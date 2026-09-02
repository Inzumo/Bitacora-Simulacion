import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import './styles.css';

import { createParameters } from './simulation/parameters.js';
import { createSimulation } from './simulation/createSimulation.js';
import { createLabPanel } from './ui/labPanel.js';

const PARTICLE_COUNT = 300000; // 2^17
const NUM_ATTRACTORS = 8;      // Cantidad de puntos focales

async function main() {
  const mount = document.querySelector('#app');

  if (!WebGPU.isAvailable()) {
    mount.appendChild(WebGPU.getErrorMessage());
    throw new Error('Este proyecto requiere WebGPU para ejecutar compute shaders.');
  }

  // THREE.JS MENTAL MODEL: scene + camera + renderer ---------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050607');

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 100);
  camera.position.set(0, 0, 11);

  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  mount.appendChild(renderer.domElement);
  await renderer.init();

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.target.set(0, 0, 0);

  const params = createParameters();
  
  // ----------------------------------------------------------------------
  // MULTI-ATRACTORES Y HELPERS GRÁFICOS
  // ----------------------------------------------------------------------
  const attractors = Array.from({ length: NUM_ATTRACTORS }, () => new THREE.Vector3());
  const attractorHelpersGroup = new THREE.Group();
  scene.add(attractorHelpersGroup);

  const sphereGeo = new THREE.SphereGeometry(0.1, 16, 12);
  const sphereMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

  for (let i = 0; i < NUM_ATTRACTORS; i++) {
    const helperMesh = new THREE.Mesh(sphereGeo, sphereMat);
    attractorHelpersGroup.add(helperMesh);
  }

  const axes = new THREE.AxesHelper(1.5);
  scene.add(axes);

  /// Muestra/actualiza la posición del arreglo de atractores con mayor separación
  const triggerRandomAttractors = () => {
    // Aumentamos los rangos para que los focos se dispersen a lo largo del nuevo boundsSize
    const rangeX = 9.0; // Antes 5.0
    const rangeY = 7.0; // Antes 3.5
    const rangeZ = 6.0; // Antes 3.0

    const minDistance = 4.5; // Distancia mínima deseada entre focos

    attractors.forEach((attractor, i) => {
      let candidate = new THREE.Vector3();
      let valid = false;
      let attempts = 0;

      // Intentamos encontrar una posición que no esté pegada a los focos ya creados
      while (!valid && attempts < 15) {
        candidate.set(
          (Math.random() - 0.5) * rangeX,
          (Math.random() - 0.5) * rangeY,
          (Math.random() - 0.5) * rangeZ
        );

        valid = true;
        for (let j = 0; j < i; j++) {
          if (candidate.distanceTo(attractors[j]) < minDistance) {
            valid = false;
            break;
          }
        }
        attempts++;
      }

      attractor.copy(candidate);

      // Actualizar representación visual (esferas blancas)
      attractorHelpersGroup.children[i].position.copy(attractor);

      // Actualizar uniform en la GPU para el shader de física
      if (params.attractors && params.attractors[i]) {
        params.attractors[i].value.copy(attractor);
      }
    });
  };

  const simulation = createSimulation({ renderer, scene, params, count: PARTICLE_COUNT });

  let paused = false;
  let mode = 'LAB';
  let panel;
  let savedRadialStrength = params.radialStrength.value;
  let savedRadialEnabled = params.radialEnabled.value;

  const applyPreset = (id) => {
    params.windEnabled.value = 0;
    params.radialEnabled.value = 0;
    params.vortexEnabled.value = 0;
    params.dragEnabled.value = 0;
    params.wind.value.set(0, 0, 0);
    params.initialSpeed.value = 0;

    if (id === 'inertia') {
      params.initialSpeed.value = 0.8;
    } else if (id === 'wind') {
      params.windEnabled.value = 1;
      params.wind.value.set(1.5, 0, 0);
    } else if (id === 'attract') {
      params.radialEnabled.value = 1;
      params.radialStrength.value = 3.0;
    } else if (id === 'repel') {
      params.radialEnabled.value = 1;
      params.radialStrength.value = -3.0;
    } else if (id === 'vortex') {
      params.radialEnabled.value = 1;
      params.radialStrength.value = 1.0;
      params.vortexEnabled.value = 1;
      params.vortexStrength.value = 3.0;
      params.dragEnabled.value = 1;
      params.dragCoefficient.value = 0.08;
    }
    simulation.reset();
    panel?.refresh();
  };

const setMode = (next) => {
    mode = next;
    const lab = mode === 'LAB';
    panel.setVisible(lab);
    axes.visible = lab;
    attractorHelpersGroup.visible = lab;
    hud.innerHTML = lab
      ? '<strong>LAB</strong> · P: performance · R: reset · F/G: tamaño · 1–5: pruebas'
      : `
        <strong>PERFORMANCE</strong><br>
        W/S · tensión &nbsp;&nbsp;
        A/D · rotación &nbsp;&nbsp;
        Q/E · viento &nbsp;&nbsp;
        Z/X · energía &nbsp;&nbsp;
        F/G · tamaño &nbsp;&nbsp;
        R · reset &nbsp;&nbsp;
        P · LAB
      `;
  };

  panel = createLabPanel({
    params,
    onReset: () => simulation.reset(),
    onPreset: applyPreset,
    onModeChange: () => setMode(mode === 'LAB' ? 'PERFORMANCE' : 'LAB'),
    onPauseChange: () => paused = !paused
  });

  const hud = document.createElement('div');
  hud.className = 'hud';
  document.body.append(hud);
  setMode('LAB');

  
// PERFORMANCE INSTRUMENT -----------------------------------------------
  const keys = {
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    KeyQ: false,
    KeyE: false,
    KeyZ: false,
    KeyX: false,
    KeyF: false, // <--- Nueva tecla F (Aumentar)
    KeyG: false  // <--- Nueva tecla G (Disminuir)
  };

  const performanceBase = {
    radialStrength: 0.35,
    vortexStrength: 0.15,
    windX: 0.0,
    dragCoefficient: 0.22,
    particleSize: 0.02 // <--- Tamaño base
  };

  const performanceRanges = {
    radialMax: 3.0,
    vortexMax: 3.0,
    windMax: 1.8,
    dragMin: 0.03,
    dragMax: 0.65,
    sizeMin: 0.005, // <--- Tamaño mínimo
    sizeMax: 0.12   // <--- Tamaño máximo
  };

  const approach = (current, target, amount = 0.08) => {
    return current + (target - current) * amount;
  };

  function updatePerformanceInstrument() {
    if (mode !== 'PERFORMANCE') return;

    // 1. ATRACCIÓN / REPULSIÓN
    let radialTarget = performanceBase.radialStrength;
    if (keys.KeyW && !keys.KeyS) {
      radialTarget = performanceRanges.radialMax;
    } else if (keys.KeyS && !keys.KeyW) {
      radialTarget = -performanceRanges.radialMax;
    }

    params.radialEnabled.value = 1;
    params.radialStrength.value = approach(
      params.radialStrength.value,
      radialTarget,
      0.06
    );

    // 2. VÓRTICE
    let vortexTarget = performanceBase.vortexStrength;
    if (keys.KeyA && !keys.KeyD) {
      vortexTarget = performanceRanges.vortexMax;
    } else if (keys.KeyD && !keys.KeyA) {
      vortexTarget = -performanceRanges.vortexMax;
    }

    params.vortexEnabled.value = 1;
    params.vortexStrength.value = approach(
      params.vortexStrength.value,
      vortexTarget,
      0.07
    );

    // 3. VIENTO
    let windTarget = performanceBase.windX;
    if (keys.KeyQ && !keys.KeyE) {
      windTarget = -performanceRanges.windMax;
    } else if (keys.KeyE && !keys.KeyQ) {
      windTarget = performanceRanges.windMax;
    }

    params.windEnabled.value = 1;
    params.wind.value.x = approach(
      params.wind.value.x,
      windTarget,
      0.08
    );
    params.wind.value.y = 0;
    params.wind.value.z = 0;

    // 4. DRAG / MEMORIA
    let dragTarget = performanceBase.dragCoefficient;
    if (keys.KeyZ && !keys.KeyX) {
      dragTarget = performanceRanges.dragMax;
    } else if (keys.KeyX && !keys.KeyZ) {
      dragTarget = performanceRanges.dragMin;
    }

    params.dragEnabled.value = 1;
    params.dragCoefficient.value = approach(
      params.dragCoefficient.value,
      dragTarget,
      0.06
    );

    // 5. TAMAÑO DE PARTÍCULAS (Ajuste progresivo continuo)
    if (keys.KeyF) {
      params.particleSize.value = Math.min(
        performanceRanges.sizeMax,
        params.particleSize.value + 0.001
      );
      panel?.refresh();
    } else if (keys.KeyG) {
      params.particleSize.value = Math.max(
        performanceRanges.sizeMin,
        params.particleSize.value - 0.001
      );
      panel?.refresh();
    }
  }

  function setPerformanceNeutral() {
    params.radialEnabled.value = 1;
    params.vortexEnabled.value = 1;
    params.windEnabled.value = 1;
    params.dragEnabled.value = 1;

    params.radialStrength.value = performanceBase.radialStrength;
    params.vortexStrength.value = performanceBase.vortexStrength;
    params.wind.value.set(performanceBase.windX, 0, 0);
    params.dragCoefficient.value = performanceBase.dragCoefficient;

    Object.keys(keys).forEach((key) => {
      keys[key] = false;
    });
  }

  // TECLAS ----------------------------------------------------------------
  addEventListener('keydown', (event) => {
    if (event.code in keys) {
      if (!keys[event.code]) {
        keys[event.code] = true;
        if (mode === 'PERFORMANCE') {
          triggerRandomAttractors();
        }
      }
      event.preventDefault();
      return;
    }

    if (event.code === 'KeyP') {
      setMode(mode === 'LAB' ? 'PERFORMANCE' : 'LAB');
      if (mode === 'PERFORMANCE') {
        setPerformanceNeutral();
        triggerRandomAttractors();
      }
      return;
    }

    if (event.code === 'KeyR') {
      simulation.reset();
      if (mode === 'PERFORMANCE') {
        setPerformanceNeutral();
        triggerRandomAttractors();
      }
      return;
    }

    if (mode === 'LAB' && !event.repeat) {
      if (event.code === 'Digit1') applyPreset('inertia');
      if (event.code === 'Digit2') applyPreset('wind');
      if (event.code === 'Digit3') applyPreset('attract');
      if (event.code === 'Digit4') applyPreset('repel');
      if (event.code === 'Digit5') applyPreset('vortex');
    }
  });

  addEventListener('keyup', (event) => {
    if (event.code in keys) {
      keys[event.code] = false;
      event.preventDefault();
    }
  });

  addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
      params.radialEnabled.value = savedRadialEnabled;
      params.radialStrength.value = savedRadialStrength;
    }
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Inicializar posiciones de los focos al arrancar
  triggerRandomAttractors();
  simulation.reset();

  // FRAME LOOP ------------------------------------------------------------
  renderer.setAnimationLoop(() => {
    if (!paused) {
      updatePerformanceInstrument();
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
  document.body.append(pre);
});
