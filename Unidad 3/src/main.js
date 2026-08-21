import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';

import { createParameters, presets } from './simulation/parameters.js';
import { createSimulation } from './simulation/createSimulation.js';
import { createLabPanel } from './ui/labPanel.js';

const PARTICLE_COUNT = 65536;

async function main() {
  const mount = document.querySelector('#app');

  if (!WebGPU.isAvailable()) {
    mount.appendChild(WebGPU.getErrorMessage());
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050607');

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  mount.appendChild(renderer.domElement);

  await renderer.init();

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;

  const params = createParameters();
  
  // Tamaño óptimo para renderizado de Points
  params.particleSize.value = 2.5;

  const simulation = createSimulation({ renderer, scene, params, count: PARTICLE_COUNT });

  const axes = new THREE.AxesHelper(2);
  scene.add(axes);

  // Inicializar buffers GPU asíncronamente
  await simulation.reset();

  let paused = false;

  createLabPanel({
    params,
    onReset: () => simulation.reset(),
    onPreset: (id) => {
      if (presets[id]) presets[id](params);
      simulation.reset();
    },
    onPauseChange: () => {
      paused = !paused;
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  renderer.setAnimationLoop(async () => {
    if (!paused) {
      await simulation.stepSimulation();
    }
    orbit.update();
    await renderer.renderAsync(scene, camera);
  });
}

main().catch(console.error);
