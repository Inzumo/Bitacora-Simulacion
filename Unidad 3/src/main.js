import * as THREE from 'three/webgpu';
import { createSimulation } from './simulation/createSimulation.js';

let renderer, scene, camera;
let simulation;

async function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  await renderer.init();

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

  simulation = createSimulation({
    renderer,
    scene,
    params,
    count: 10000
  });

  // Eventos de teclado
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') {
      if (simulation && typeof simulation.reset === 'function') {
        simulation.reset();
      }
    }
  });

  window.addEventListener('resize', onWindowResize);
  renderer.setAnimationLoop(animate);
}

function animate() {
  if (simulation && typeof simulation.stepSimulation === 'function') {
    simulation.stepSimulation();
  }
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
