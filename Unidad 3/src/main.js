import * as THREE from 'three/webgpu';
import { createSimulation } from './simulation/createSimulation.js';

let renderer, scene, camera;
let simulation;

async function init() {
  try {
    // 1. Inyectar estilos básicos para asegurar visibilidad del Canvas
    const style = document.createElement('style');
    style.innerHTML = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #050508; }
      canvas { display: block; width: 100vw; height: 100vh; }
    `;
    document.head.appendChild(style);

    // 2. Escena y Cámara
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 5);

    // 3. Renderizador WebGPU
    renderer = new THREE.WebGPURenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    // Inicializar WebGPU asincrónicamente
    await renderer.init();
    console.log('WebGPU inicializado correctamente');

    // 4. Parámetros de la simulación
    const params = {
      timeStep: { value: 0.016 },
      maxSpeed: { value: 10.0 },
      particleSize: { value: 0.08 },
      radialEnabled: { value: 0.0 },
      radialStrength: { value: 2.0 },
      vortexEnabled: { value: 0.0 },
      vortexStrength: { value: 2.0 },
      curlEnabled: { value: 0.0 },
      curlStrength: { value: 0.0 },
      dragEnabled: { value: 1.0 },
      dragCoefficient: { value: 0.05 },
      windEnabled: { value: 0.0 },
      wind: { value: new THREE.Vector3(0, 0, 0) },
      currentCenter: { value: new THREE.Vector3(0, 0, 0) }
    };

    // 5. Crear la simulación
    simulation = createSimulation({
      renderer,
      scene,
      params,
      count: 10000
    });

    // 6. Controles de Teclado
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();

      // Reset
      if (key === 'r') {
        if (simulation && typeof simulation.reset === 'function') {
          simulation.reset();
        }
      }

      // Modos de laboratorio (1-5)
      if (['1', '2', '3', '4', '5'].includes(key)) {
        if (simulation && simulation.uniforms) {
          simulation.uniforms.uWindEnabled.value = 0.0;
          simulation.uniforms.uRadialEnabled.value = 0.0;
          simulation.uniforms.uVortexEnabled.value = 0.0;
        }

        switch (key) {
          case '1': // Inercia
            break;
          case '2': // Viento
            if (simulation?.uniforms) {
              simulation.uniforms.uWindEnabled.value = 1.0;
              simulation.uniforms.uWind.value.set(1.5, 0.5, 0.0);
            }
            break;
          case '3': // Atracción Radial
            if (simulation?.uniforms) {
              simulation.uniforms.uRadialEnabled.value = 1.0;
              simulation.uniforms.uRadialStrength.value = 3.0;
            }
            break;
          case '4': // Repulsión Radial
            if (simulation?.uniforms) {
              simulation.uniforms.uRadialEnabled.value = 1.0;
              simulation.uniforms.uRadialStrength.value = -3.0;
            }
            break;
          case '5': // Vórtice
            if (simulation?.uniforms) {
              simulation.uniforms.uVortexEnabled.value = 1.0;
              simulation.uniforms.uVortexStrength.value = 3.0;
            }
            break;
        }
      }
    });

    window.addEventListener('resize', onWindowResize);

    // 7. Bucle de animación
    renderer.setAnimationLoop(animate);

  } catch (error) {
    console.error('Error al inicializar la simulación WebGPU:', error);
  }
}

function animate() {
  if (simulation && typeof simulation.stepSimulation === 'function') {
    simulation.stepSimulation();
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function onWindowResize() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

init();

