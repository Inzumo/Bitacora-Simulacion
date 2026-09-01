import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';

import { createParameters } from './simulation/parameters.js';
import { createSimulation } from './simulation/createSimulation.js';
import { createLabPanel } from './ui/labPanel.js';

const PARTICLE_COUNT = 131072;

async function main() {
  const mount = document.querySelector('#app');

  if (!WebGPU.isAvailable()) {
    mount.appendChild(WebGPU.getErrorMessage());
    throw new Error('Este proyecto requiere WebGPU para ejecutar compute shaders.');
  }

  // ============================================================
  // ESCENA & CÁMARA
  // ============================================================
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#030406');

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
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  mount.appendChild(renderer.domElement);

  try {
    await renderer.init();
  } catch (err) {
    console.warn('Advertencia en renderer.init():', err);
  }

  // ============================================================
  // CONTROLES
  // ============================================================
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;
  orbit.target.set(0, 0, 0);

  // ============================================================
  // PARÁMETROS & TARGETS PARA LERP
  // ============================================================
  const params = createParameters();

  const targets = {
    windEnabled: params.windEnabled.value,
    wind: params.wind.value.clone(),
    radialEnabled: params.radialEnabled.value,
    radialStrength: params.radialStrength.value,
    vortexEnabled: params.vortexEnabled.value,
    vortexStrength: params.vortexStrength.value,
    dragEnabled: params.dragEnabled.value,
    dragCoefficient: params.dragCoefficient.value
  };

  const simulation = createSimulation({
    renderer,
    scene,
    params,
    count: PARTICLE_COUNT
  });

  const { uniforms } = simulation;

  // ============================================================
  // ELEMENTOS DE INTERFAZ & GUÍAS
  // ============================================================
  const attractorHelper = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#ffffff' })
  );
  scene.add(attractorHelper);

  const axes = new THREE.AxesHelper(1.5);
  scene.add(axes);

  // ============================================================
  // POINTER INTERACTION (3D)
  // ============================================================
  const pointerNdc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();

  window.addEventListener('pointermove', (event) => {
    pointerNdc.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointerNdc.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointerNdc, camera);

    if (raycaster.ray.intersectPlane(interactionPlane, hit)) {
      params.currentCenter.value.copy(hit);
      uniforms.uCurrentCenter.value.copy(hit);
      attractorHelper.position.copy(hit);
    }
  });

  let paused = false;
  let mode = 'PERFORMANCE';
  let activePreset = '1';

  // ============================================================
  // PRESETS EN TIEMPO REAL
  // ============================================================
  const applyPreset = (id) => {
    paused = false;
    activePreset = id;

    targets.windEnabled = 0.0;
    targets.radialEnabled = 0.0;
    targets.vortexEnabled = 0.0;
    targets.dragEnabled = 1.0;
    targets.dragCoefficient = 0.05;

    switch (id) {
      case 'inertia':
      case '1':
        targets.dragCoefficient = 0.02;
        break;

      case 'wind':
      case '2':
        targets.windEnabled = 1.0;
        targets.wind.set(2.5, 0, 0);
        targets.dragCoefficient = 0.04;
        break;

      case 'attract':
      case '3':
        targets.radialEnabled = 1.0;
        targets.radialStrength = 4.0;
        targets.dragCoefficient = 0.05;
        break;

      case 'repel':
      case '4':
        targets.radialEnabled = 1.0;
        targets.radialStrength = -4.0;
        targets.dragCoefficient = 0.05;
        break;

      case 'vortex':
      case '5':
        targets.radialEnabled = 1.0;
        targets.radialStrength = 1.0;
        targets.vortexEnabled = 1.0;
        targets.vortexStrength = 4.0;
        targets.dragCoefficient = 0.06;
        break;
    }

    updateHUD();
    panel.refresh();
  };

  // ============================================================
  // INTERPOLACIÓN LERP EN CADA CUADRO
  // ============================================================
  const updateInertia = (factor = 0.08) => {
    params.windEnabled.value = THREE.MathUtils.lerp(params.windEnabled.value, targets.windEnabled, factor);
    uniforms.uWindEnabled.value = params.windEnabled.value;

    params.wind.value.lerp(targets.wind, factor);
    uniforms.uWind.value.copy(params.wind.value);

    params.radialEnabled.value = THREE.MathUtils.lerp(params.radialEnabled.value, targets.radialEnabled, factor);
    uniforms.uRadialEnabled.value = params.radialEnabled.value;

    params.radialStrength.value = THREE.MathUtils.lerp(params.radialStrength.value, targets.radialStrength, factor);
    uniforms.uRadialStrength.value = params.radialStrength.value;

    params.vortexEnabled.value = THREE.MathUtils.lerp(params.vortexEnabled.value, targets.vortexEnabled, factor);
    uniforms.uVortexEnabled.value = params.vortexEnabled.value;

    params.vortexStrength.value = THREE.MathUtils.lerp(params.vortexStrength.value, targets.vortexStrength, factor);
    uniforms.uVortexStrength.value = params.vortexStrength.value;

    params.dragEnabled.value = THREE.MathUtils.lerp(params.dragEnabled.value, targets.dragEnabled, factor);
    uniforms.uDragEnabled.value = params.dragEnabled.value;

    params.dragCoefficient.value = THREE.MathUtils.lerp(params.dragCoefficient.value, targets.dragCoefficient, factor);
    uniforms.uDragCoefficient.value = params.dragCoefficient.value;
  };

  // ============================================================
  // HUD EN VIVO
  // ============================================================
  const hud = document.createElement('div');
  hud.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(10, 12, 16, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.15);
    padding: 10px 20px;
    border-radius: 30px;
    color: #fff;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    display: flex;
    gap: 12px;
    align-items: center;
    pointer-events: none;
    z-index: 100;
  `;
  document.body.appendChild(hud);

  const updateHUD = () => {
    const keys = [
      { id: '1', label: '1: Inercia' },
      { id: '2', label: '2: Viento' },
      { id: '3', label: '3: Atracción' },
      { id: '4', label: '4: Repulsión' },
      { id: '5', label: '5: Vórtice' }
    ];

    hud.innerHTML = keys
      .map(
        (k) => `
        <span style="
          padding: 4px 10px;
          border-radius: 14px;
          background: ${activePreset === k.id ? 'rgba(255,255,255,0.25)' : 'transparent'};
          border: 1px solid ${activePreset === k.id ? '#fff' : 'transparent'};
          font-weight: ${activePreset === k.id ? 'bold' : 'normal'};
          transition: all 0.2s ease;
        ">${k.label}</span>
      `
      )
      .join('') + `<span style="opacity:0.4; margin-left:8px;">| P: Modo | R: Reset</span>`;
  };

  // ============================================================
  // CREACIÓN DEL PANEL (PASANDO UNIFORMS)
  // ============================================================
  const panel = createLabPanel({
    params,
    uniforms,
    onReset: () => simulation.reset(),
    onPreset: applyPreset,
    onModeChange: () => setMode(mode === 'LAB' ? 'PERFORMANCE' : 'LAB'),
    onPauseChange: () => (paused = !paused)
  });

  const setMode = (next) => {
    mode = next;
    const isLab = mode === 'LAB';
    panel.setVisible(isLab);
    axes.visible = isLab;
    attractorHelper.visible = isLab;
  };

  setMode('PERFORMANCE');
  updateHUD();

  // ============================================================
  // TECLADO
  // ============================================================
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;

    if (event.code === 'KeyP') {
      setMode(mode === 'LAB' ? 'PERFORMANCE' : 'LAB');
      return;
    }

    if (event.code === 'KeyR') {
      simulation.reset();
      return;
    }

    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(event.code)) {
      const num = event.code.replace('Digit', '');
      applyPreset(num);
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  simulation.reset();

  // ============================================================
  // LOOP PRINCIPAL
  // ============================================================
  renderer.setAnimationLoop(() => {
    if (!paused) {
      updateInertia(0.06);
      simulation.stepSimulation();
    }

    orbit.update();
    renderer.render(scene, camera);
  });
}

main().catch((error) => {
  console.error(error);
  const pre = document.createElement('pre');
  pre.style.cssText = 'position:fixed;inset:16px;white-space:pre-wrap;color:#fff;z-index:50';
  pre.textContent = String(error?.stack || error);
  document.body.appendChild(pre);
});
