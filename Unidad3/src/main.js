import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';

import { createParameters } from './simulation/parameters.js';
import { createSimulation } from './simulation/createSimulation.js';
import { createLabPanel } from './ui/labPanel.js';

/*
2^15: 32768
2^16: 65536
2^17: 131072
2^18: 262144
2^19: 524288
2^20: 1048576
2^21: 2097152
2^22: 4194304
2^23: 8388608
2^24: 16777216
*/

const PARTICLE_COUNT = 131072;

async function main() {

  const mount = document.querySelector('#app');

  if (!WebGPU.isAvailable()) {
    mount.appendChild(WebGPU.getErrorMessage());
    throw new Error(
      'Este proyecto requiere WebGPU para ejecutar compute shaders.'
    );
  }

  // ============================================================
  // ESCENA
  // ============================================================

  const scene = new THREE.Scene();

  scene.background = new THREE.Color('#050607');

  // ============================================================
  // CÁMARA
  // ============================================================

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.05,
    100
  );

  camera.position.set(0, 0, 11);

  // ============================================================
  // RENDERER WEBGPU
  // ============================================================

  const renderer = new THREE.WebGPURenderer({
    antialias: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  mount.appendChild(renderer.domElement);

  try {
    await renderer.init();
  } catch (err) {
    console.warn(
      'Advertencia en renderer.init():',
      err
    );
  }

  // ============================================================
  // CONTROLES
  // ============================================================

  const orbit = new OrbitControls(
    camera,
    renderer.domElement
  );

  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;

  orbit.target.set(0, 0, 0);

  // ============================================================
  // PARÁMETROS + SIMULACIÓN
  // ============================================================

  const params = createParameters();

  const simulation = createSimulation({
    renderer,
    scene,
    params,
    count: PARTICLE_COUNT
  });

  // ============================================================
  // ELEMENTOS DE LABORATORIO
  // ============================================================

  const attractorHelper = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.12,
      16,
      12
    ),
    new THREE.MeshBasicMaterial({
      color: '#ffffff'
    })
  );

  scene.add(attractorHelper);

  const axes = new THREE.AxesHelper(1.5);

  scene.add(axes);

  // ============================================================
  // POINTER → POSICIÓN 3D
  // ============================================================

  const pointerNdc = new THREE.Vector2();

  const raycaster = new THREE.Raycaster();

  const interactionPlane = new THREE.Plane(
    new THREE.Vector3(0, 0, 1),
    0
  );

  const hit = new THREE.Vector3();

  window.addEventListener(
    'pointermove',
    (event) => {

      pointerNdc.x =
        (event.clientX / window.innerWidth) * 2 - 1;

      pointerNdc.y =
        -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(
        pointerNdc,
        camera
      );

      if (
        raycaster.ray.intersectPlane(
          interactionPlane,
          hit
        )
      ) {

        if (params.currentCenter) {
          params.currentCenter.value.copy(hit);
        }

        attractorHelper.position.copy(hit);
      }
    }
  );

  // ============================================================
  // ESTADO
  // ============================================================

  let paused = false;

  let mode = 'LAB';

  let panel;

  let savedRadialStrength =
    params.radialStrength.value;

  let savedRadialEnabled =
    params.radialEnabled.value;

  // ============================================================
  // PRESETS
  // ============================================================

  const applyPreset = (id) => {

    // IMPORTANTE:
    // Cambiar de preset NO debe dejar la simulación pausada.
    paused = false;

    // Limpiar fuerzas anteriores

    params.windEnabled.value = 0;

    params.radialEnabled.value = 0;

    params.vortexEnabled.value = 0;

    params.dragEnabled.value = 0;

    params.curlEnabled.value = 0;

    params.wind.value.set(
      0,
      0,
      0
    );

    params.initialSpeed.value = 0;

    // ========================================================
    // PRESET 1 — INERCIA
    // ========================================================

    if (id === 'inertia') {

      params.initialSpeed.value = 0.8;

      params.dragEnabled.value = 1;

      params.dragCoefficient.value = 0.02;
    }

    // ========================================================
    // PRESET 2 — VIENTO
    // ========================================================

    else if (id === 'wind') {

      params.windEnabled.value = 1;

      params.wind.value.set(
        1.5,
        0,
        0
      );

      params.dragEnabled.value = 1;

      params.dragCoefficient.value = 0.05;
    }

    // ========================================================
    // PRESET 3 — ATRACCIÓN
    // ========================================================

    else if (id === 'attract') {

      params.radialEnabled.value = 1;

      params.radialStrength.value = 3.0;

      params.dragEnabled.value = 1;

      params.dragCoefficient.value = 0.05;
    }

    // ========================================================
    // PRESET 4 — REPULSIÓN
    // ========================================================

    else if (id === 'repel') {

      params.radialEnabled.value = 1;

      params.radialStrength.value = -3.0;

      params.dragEnabled.value = 1;

      params.dragCoefficient.value = 0.05;
    }

    // ========================================================
    // PRESET 5 — VÓRTICE
    // ========================================================

    else if (id === 'vortex') {

      params.radialEnabled.value = 1;

      params.radialStrength.value = 1.0;

      params.vortexEnabled.value = 1;

      params.vortexStrength.value = 3.0;

      params.dragEnabled.value = 1;

      params.dragCoefficient.value = 0.08;
    }

    // Reiniciar partículas con el nuevo preset

    simulation.reset();

    panel?.refresh();
  };

  // ============================================================
  // CAMBIO DE MODO
  // ============================================================

  const setMode = (next) => {

    mode = next;

    const lab = mode === 'LAB';

    panel.setVisible(lab);

    axes.visible = lab;

    attractorHelper.visible = lab;

    hud.innerHTML = lab
      ? '<strong>LAB</strong> · P: performance · R: reset · 1–5: pruebas'
      : '';
  };

  // ============================================================
  // PANEL
  // ============================================================

  panel = createLabPanel({
    params,

    onReset: () => {
      simulation.reset();
    },

    onPreset: applyPreset,

    onModeChange: () => {
      setMode(
        mode === 'LAB'
          ? 'PERFORMANCE'
          : 'LAB'
      );
    },

    onPauseChange: () => {
      paused = !paused;
    }
  });

  // ============================================================
  // HUD
  // ============================================================

  const hud = document.createElement('div');

  hud.className = 'hud';

  document.body.appendChild(hud);

  setMode('LAB');

  // ============================================================
  // TECLADO
  // ============================================================

  window.addEventListener(
    'keydown',
    (event) => {

      if (event.repeat) return;

      // --------------------------------------------------------
      // PERFORMANCE / LAB
      // --------------------------------------------------------

      if (event.code === 'KeyP') {

        setMode(
          mode === 'LAB'
            ? 'PERFORMANCE'
            : 'LAB'
        );

        return;
      }

      // --------------------------------------------------------
      // RESET
      // --------------------------------------------------------

      if (event.code === 'KeyR') {

        simulation.reset();

        return;
      }

      // --------------------------------------------------------
      // PRESETS
      // --------------------------------------------------------

      if (event.code === 'Digit1') {
        applyPreset('inertia');
        return;
      }

      if (event.code === 'Digit2') {
        applyPreset('wind');
        return;
      }

      if (event.code === 'Digit3') {
        applyPreset('attract');
        return;
      }

      if (event.code === 'Digit4') {
        applyPreset('repel');
        return;
      }

      if (event.code === 'Digit5') {
        applyPreset('vortex');
        return;
      }

      // --------------------------------------------------------
      // SPACE = INVERSIÓN TEMPORAL
      // --------------------------------------------------------

      if (event.code === 'Space') {

        event.preventDefault();

        savedRadialStrength =
          params.radialStrength.value;

        savedRadialEnabled =
          params.radialEnabled.value;

        params.radialEnabled.value = 1;

        params.radialStrength.value =
          -(savedRadialStrength || 2.0);
      }
    }
  );

  // ============================================================
  // KEYUP
  // ============================================================

  window.addEventListener(
    'keyup',
    (event) => {

      if (event.code === 'Space') {

        params.radialEnabled.value =
          savedRadialEnabled;

        params.radialStrength.value =
          savedRadialStrength;
      }
    }
  );

  // ============================================================
  // RESIZE
  // ============================================================

  window.addEventListener(
    'resize',
    () => {

      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
  );

  // ============================================================
  // RESET INICIAL
  // ============================================================

  simulation.reset();

  // ============================================================
  // LOOP
  // ============================================================

  renderer.setAnimationLoop(
    () => {

      if (!paused) {
        simulation.stepSimulation();
      }

      orbit.update();

      renderer.render(
        scene,
        camera
      );
    }
  );
}

// ================================================================
// ERROR HANDLER
// ================================================================

main().catch((error) => {

  console.error(error);

  const pre =
    document.createElement('pre');

  pre.style.cssText =
    'position:fixed;inset:16px;white-space:pre-wrap;color:#fff;z-index:50';

  pre.textContent =
    String(
      error?.stack || error
    );

  document.body.appendChild(pre);
});