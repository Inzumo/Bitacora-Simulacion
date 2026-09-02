js
import * as THREE from 'three/webgpu';
import { createSimulation } from './simulation/createSimulation.js';

let renderer = null;
let scene = null;
let camera = null;
let simulation = null;

async function init() {
  try {
    // --------------------------------------------------
    // ESTILOS
    // --------------------------------------------------

    const style = document.createElement('style');

    style.innerHTML = 
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html,
      body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #050508;
      }

      body {
        position: relative;
      }

      canvas {
        display: block;
        width: 100vw;
        height: 100vh;
      }

      #error-message {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 30px;
        background: #050508;
        color: white;
        font-family: monospace;
        z-index: 9999;
      }

      #error-message .error-box {
        max-width: 800px;
        padding: 30px;
        border: 1px solid #ff4466;
        background: #0b0b12;
      }

      #error-message h1 {
        margin-bottom: 15px;
        color: #ff4466;
      }

      #error-message p {
        margin-bottom: 15px;
        line-height: 1.5;
      }

      #error-message pre {
        white-space: pre-wrap;
        word-break: break-word;
        color: #ffb3c1;
      }
    ;

    document.head.appendChild(style);

    // --------------------------------------------------
    // ESCENA
    // --------------------------------------------------

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x050508);

    // --------------------------------------------------
    // CÁMARA
    // --------------------------------------------------

    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    // --------------------------------------------------
    // WEBGPU
    // --------------------------------------------------

    if (!navigator.gpu) {
      throw new Error(
        'WebGPU no está disponible en este navegador.'
      );
    }

    renderer = new THREE.WebGPURenderer({
      antialias: true
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    document.body.appendChild(renderer.domElement);

    // WebGPU necesita inicialización asíncrona
    await renderer.init();

    console.log('WebGPU inicializado correctamente');

    // --------------------------------------------------
    // PARÁMETROS
    // --------------------------------------------------

    const params = {
      timeStep: {
        value: 0.016
      },

      maxSpeed: {
        value: 10.0
      },

      particleSize: {
        value: 0.08
      },

      radialEnabled: {
        value: 0.0
      },

      radialStrength: {
        value: 2.0
      },

      vortexEnabled: {
        value: 0.0
      },

      vortexStrength: {
        value: 2.0
      },

      curlEnabled: {
        value: 0.0
      },

      curlStrength: {
        value: 0.0
      },

      dragEnabled: {
        value: 1.0
      },

      dragCoefficient: {
        value: 0.05
      },

      windEnabled: {
        value: 0.0
      },

      wind: {
        value: new THREE.Vector3(0, 0, 0)
      },

      currentCenter: {
        value: new THREE.Vector3(0, 0, 0)
      }
    };

    // --------------------------------------------------
    // SIMULACIÓN
    // --------------------------------------------------

    simulation = createSimulation({
      renderer,
      scene,
      params,
      count: 10000
    });

    // --------------------------------------------------
    // TECLADO
    // --------------------------------------------------

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();

      if (!simulation) {
        return;
      }

      // RESET
      if (key === 'r') {
        if (typeof simulation.reset === 'function') {
          simulation.reset();
        }

        return;
      }

      // MODOS 1 - 5
      if (
        ['1', '2', '3', '4', '5'].includes(key)
      ) {

        // Apagar todas las fuerzas principales
        simulation.uniforms.uWindEnabled.value = 0.0;
        simulation.uniforms.uRadialEnabled.value = 0.0;
        simulation.uniforms.uVortexEnabled.value = 0.0;

        switch (key) {

          // ------------------------------------------
          // 1 - INERCIA
          // ------------------------------------------

          case '1':

            console.log('Modo 1: Inercia');

            break;

          // ------------------------------------------
          // 2 - VIENTO
          // ------------------------------------------

          case '2':

            console.log('Modo 2: Viento');

            simulation.uniforms.uWindEnabled.value = 1.0;

            simulation.uniforms.uWind.value.set(
              1.5,
              0.5,
              0.0
            );

            break;

          // ------------------------------------------
          // 3 - ATRACCIÓN
          // ------------------------------------------

          case '3':

            console.log(
              'Modo 3: Atracción radial'
            );

            simulation.uniforms.uRadialEnabled.value = 1.0;

            simulation.uniforms.uRadialStrength.value = 3.0;

            break;

          // ------------------------------------------
          // 4 - REPULSIÓN
          // ------------------------------------------

          case '4':

            console.log(
              'Modo 4: Repulsión radial'
            );

            simulation.uniforms.uRadialEnabled.value = 1.0;

            simulation.uniforms.uRadialStrength.value = -3.0;

            break;

          // ------------------------------------------
          // 5 - VÓRTICE
          // ------------------------------------------

          case '5':

            console.log('Modo 5: Vórtice');

            simulation.uniforms.uVortexEnabled.value = 1.0;

            simulation.uniforms.uVortexStrength.value = 3.0;

            break;
        }
      }
    });

    // --------------------------------------------------
    // RESIZE
    // --------------------------------------------------

    window.addEventListener(
      'resize',
      onWindowResize
    );

    // --------------------------------------------------
    // ANIMACIÓN
    // --------------------------------------------------

    renderer.setAnimationLoop(animate);

  } catch (error) {

    console.error(
      'Error al inicializar WebGPU:',
      error
    );

    showError(error);
  }
}

// ------------------------------------------------------
// LOOP
// ------------------------------------------------------

function animate() {

  if (
    simulation &&
    typeof simulation.stepSimulation === 'function'
  ) {
    simulation.stepSimulation();
  }

  if (
    renderer &&
    scene &&
    camera
  ) {
    renderer.render(
      scene,
      camera
    );
  }
}

// ------------------------------------------------------
// RESIZE
// ------------------------------------------------------

function onWindowResize() {

  if (!camera || !renderer) {
    return;
  }

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
}

// ------------------------------------------------------
// ERROR VISUAL
// ------------------------------------------------------

function showError(error) {

  const message =
    error?.stack ||
    error?.message ||
    String(error);

  const errorElement =
    document.createElement('div');

  errorElement.id =
    'error-message';

  errorElement.innerHTML =
    <div class="error-box">

      <h1>ERROR DE WEBGPU</h1>

      <p>
        La simulación no pudo inicializarse.
      </p>

      <p>
        Revisa la consola del navegador para
        obtener más información.
      </p>

      <pre>${escapeHtml(message)}</pre>

    </div>
  ;

  document.body.appendChild(
    errorElement
  );
}

// Evita insertar HTML accidentalmente
function escapeHtml(value) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ------------------------------------------------------
// INICIAR
// ------------------------------------------------------

init();
```
