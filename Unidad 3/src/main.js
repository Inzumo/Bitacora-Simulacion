import * as THREE from 'three';
import { 
    fn, uniform, texture, storage, attribute, 
    float, vec2, vec3, vec4, 
    instanceIndex, If 
} from 'three/tsl';
import { createLabPanel } from './ui/labPanel.js';

// ============================================================
// 1. ESCENA Y RENDERIZADOR WEBGPU
// ============================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

await renderer.init();

// ============================================================
// 2. UNIFORMS (CONEXIÓN GPU <-> UI)
// ============================================================
const params = {
    timeStep: { value: 0.016 },
    maxSpeed: { value: 5.0 },
    particleSize: { value: 0.035 },

    radialEnabled: { value: 1 },
    radialStrength: { value: -3.0 },

    vortexEnabled: { value: 1 },
    vortexStrength: { value: 3.0 },

    curlEnabled: { value: 0 },
    curlStrength: { value: 2.0 },

    dragEnabled: { value: 1 },
    dragCoefficient: { value: 0.08 },

    windEnabled: { value: 0 },
    wind: { value: new THREE.Vector2(0, 0) }
};

// Uniforms de TSL para la GPU
const uTimeStep = uniform(params.timeStep.value);
const uMaxSpeed = uniform(params.maxSpeed.value);

const uRadialEnabled = uniform(params.radialEnabled.value);
const uRadialStrength = uniform(params.radialStrength.value);

const uVortexEnabled = uniform(params.vortexEnabled.value);
const uVortexStrength = uniform(params.vortexStrength.value);

const uDragEnabled = uniform(params.dragEnabled.value);
const uDragCoefficient = uniform(params.dragCoefficient.value);

const uWindEnabled = uniform(params.windEnabled.value);
const uWind = uniform(params.wind.value);

const uPointer = uniform(new THREE.Vector3(0, 0, 0));

// Actualizar uniforms en memoria compartida
function syncUniforms() {
    uTimeStep.value = params.timeStep.value;
    uMaxSpeed.value = params.maxSpeed.value;
    uRadialEnabled.value = params.radialEnabled.value;
    uRadialStrength.value = params.radialStrength.value;
    uVortexEnabled.value = params.vortexEnabled.value;
    uVortexStrength.value = params.vortexStrength.value;
    uDragEnabled.value = params.dragEnabled.value;
    uDragCoefficient.value = params.dragCoefficient.value;
    uWindEnabled.value = params.windEnabled.value;
    uWind.value.copy(params.wind.value);
}

// ============================================================
// 3. STORAGE BUFFERS (GEOMETRÍA Y PARTICULAS EN GPU)
// ============================================================
const PARTICLE_COUNT = 30000;

const initialPositions = new Float32Array(PARTICLE_COUNT * 4);
const initialVelocities = new Float32Array(PARTICLE_COUNT * 4);

const radius = 2.5;

for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i4 = i * 4;

    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);

    initialPositions[i4] = radius * Math.sin(phi) * Math.cos(theta);
    initialPositions[i4 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    initialPositions[i4 + 2] = radius * Math.cos(phi);
    initialPositions[i4 + 3] = 1.0;

    initialVelocities[i4] = 0;
    initialVelocities[i4 + 1] = 0;
    initialVelocities[i4 + 2] = 0;
    initialVelocities[i4 + 3] = 0;
}

const positionBuffer = storage(new THREE.StorageInstancedBufferAttribute(initialPositions, 4), 'vec4', PARTICLE_COUNT);
const velocityBuffer = storage(new THREE.StorageInstancedBufferAttribute(initialVelocities, 4), 'vec4', PARTICLE_COUNT);

// ============================================================
// 4. COMPUTE SHADER EN TSL (FÍSICA PARALELA)
// ============================================================
const computeUpdate = fn(() => {
    const pos = positionBuffer.element(instanceIndex).xyz;
    const vel = velocityBuffer.element(instanceIndex).xyz;

    const force = vec3(0.0).toVar();

    // Dirección al puntero
    const delta = uPointer.sub(pos);
    const distSq = delta.dot(delta).add(0.01);
    const dist = distSq.sqrt();
    const dir = delta.div(dist);

    // Fuerza Radial (Atracción / Repulsión)
    If(uRadialEnabled.equal(1), () => {
        const fRadial = uRadialStrength.div(distSq);
        force.addAssign(dir.mul(fRadial));
    });

    // Fuerza Vórtice
    If(uVortexEnabled.equal(1), () => {
        const fVortex = uVortexStrength.div(dist);
        const vortexDir = vec3(delta.y.negate(), delta.x, 0.0);
        force.addAssign(vortexDir.mul(fVortex));
    });

    // Fuerza Viento
    If(uWindEnabled.equal(1), () => {
        force.addAssign(vec3(uWind.x, uWind.y, 0.0));
    });

    // Actualización de Velocidad
    vel.addAssign(force.mul(uTimeStep));

    // Drag / Fricción
    If(uDragEnabled.equal(1), () => {
        const dragFactor = float(1.0).sub(uDragCoefficient.mul(uTimeStep).mul(10.0)).max(0.0);
        vel.mulAssign(dragFactor);
    });

    // Límite de Velocidad
    const speed = vel.length();
    If(speed.greaterThan(uMaxSpeed), () => {
        vel.assign(vel.normalize().mul(uMaxSpeed));
    });

    // Actualización de Posición
    pos.addAssign(vel.mul(uTimeStep));

    // Guardar en Storage Buffers
    positionBuffer.element(instanceIndex).assign(vec4(pos, 1.0));
    velocityBuffer.element(instanceIndex).assign(vec4(vel, 0.0));
})();

const computeNode = computeUpdate().compute(PARTICLE_COUNT);

// ============================================================
// 5. MATERIAL Y SISTEMA VISUAL DE PARTÍCULAS
// ============================================================
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));

const material = new THREE.PointsNodeMaterial();
material.positionNode = positionBuffer.element(instanceIndex).xyz;
material.sizeNode = float(params.particleSize.value);
material.colorNode = vec4(0.37, 0.62, 1.0, 0.8);
material.transparent = true;
material.depthWrite = false;
material.blending = THREE.AdditiveBlending;

const particleSystem = new THREE.Points(geometry, material);
particleSystem.count = PARTICLE_COUNT;
scene.add(particleSystem);

// Reset de la simulación
const simulation = {
    reset: () => {
        // Recargar posiciones iniciales en la GPU
        positionBuffer.value.array.set(initialPositions);
        velocityBuffer.value.array.set(initialVelocities);
        positionBuffer.value.needsUpdate = true;
        velocityBuffer.value.needsUpdate = true;
    }
};

// ============================================================
// 6. TECLADO, ESPACIO Y PANEL DE CONTROL
// ============================================================
let isLabMode = true;
let isPaused = false;
let previousRadialStrength = params.radialStrength.value;

const labPanel = createLabPanel({
    params: params,
    onReset: () => simulation.reset(),
    onPreset: (presetKey) => applyPreset(presetKey),
    onModeChange: () => toggleMode(),
    onPauseChange: () => { isPaused = !isPaused; }
});

function toggleMode() {
    isLabMode = !isLabMode;
    labPanel.setVisible(isLabMode);
}

function applyPreset(presetKey) {
    params.radialEnabled.value = 0;
    params.vortexEnabled.value = 0;
    params.curlEnabled.value = 0;
    params.dragEnabled.value = 0;
    params.windEnabled.value = 0;

    switch (String(presetKey)) {
        case '1': break;
        case '2':
            params.windEnabled.value = 1;
            params.wind.value.set(2.0, 0.0);
            break;
        case '3':
            params.radialEnabled.value = 1;
            params.radialStrength.value = -5.0;
            break;
        case '4':
            params.radialEnabled.value = 1;
            params.radialStrength.value = 8.0;
            break;
        case '5':
            params.vortexEnabled.value = 1;
            params.vortexStrength.value = 4.0;
            break;
    }
    simulation.reset();
    labPanel.refresh();
}

// Mouse
window.addEventListener('pointermove', (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    uPointer.value.set(x * 4.5, y * 3.0, 0);
});

// Teclado
window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') toggleMode();

    if (e.key === 'r' || e.key === 'R') {
        simulation.reset();
        labPanel.refresh();
    }

    // Tecla Espacio: Repulsión/Explosión
    if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
            previousRadialStrength = params.radialStrength.value;
            params.radialStrength.value = 18.0;
            params.radialEnabled.value = 1;
            labPanel.refresh();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        params.radialStrength.value = previousRadialStrength;
        labPanel.refresh();
    }
});

// ============================================================
// 7. BUCLE DE RENDER
// ============================================================
function animate() {
    requestAnimationFrame(animate);

    syncUniforms();
    material.sizeNode = float(params.particleSize.value);

    if (!isPaused) {
        renderer.compute(computeNode);
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
