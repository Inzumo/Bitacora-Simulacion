import * as THREE from 'three';
import { 
    fn, uniform, storage, 
    float, vec3, vec4, 
    instanceIndex, If 
} from 'three/tsl';
import { createLabPanel } from './ui/labPanel.js';

// Setup de Escena y Renderizador WebGPU
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

await renderer.init();

// Estado de Parámetros y Uniforms
const params = {
    timeStep: { value: 0.016 },
    maxSpeed: { value: 5.0 },
    particleSize: { value: 0.035 },
    radialEnabled: { value: 1 },
    radialStrength: { value: -3.0 },
    vortexEnabled: { value: 1 },
    vortexStrength: { value: 3.0 },
    dragEnabled: { value: 1 },
    dragCoefficient: { value: 0.08 },
    windEnabled: { value: 0 },
    wind: { value: new THREE.Vector2(0, 0) }
};

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

// Storage Buffers (Geometría Esférica Inicial)
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
}

const positionBuffer = storage(new THREE.StorageInstancedBufferAttribute(initialPositions, 4), 'vec4', PARTICLE_COUNT);
const velocityBuffer = storage(new THREE.StorageInstancedBufferAttribute(initialVelocities, 4), 'vec4', PARTICLE_COUNT);

// Compute Shader TSL
const computeUpdate = fn(() => {
    const pos = positionBuffer.element(instanceIndex).xyz;
    const vel = velocityBuffer.element(instanceIndex).xyz;
    const force = vec3(0.0).toVar();

    const delta = uPointer.sub(pos);
    const distSq = delta.dot(delta).add(0.01);
    const dist = distSq.sqrt();
    const dir = delta.div(dist);

    If(uRadialEnabled.equal(1), () => {
        force.addAssign(dir.mul(uRadialStrength.div(distSq)));
    });

    If(uVortexEnabled.equal(1), () => {
        const vortexDir = vec3(delta.y.negate(), delta.x, 0.0);
        force.addAssign(vortexDir.mul(uVortexStrength.div(dist)));
    });

    If(uWindEnabled.equal(1), () => {
        force.addAssign(vec3(uWind.x, uWind.y, 0.0));
    });

    vel.addAssign(force.mul(uTimeStep));

    If(uDragEnabled.equal(1), () => {
        const dragFactor = float(1.0).sub(uDragCoefficient.mul(uTimeStep).mul(10.0)).max(0.0);
        vel.mulAssign(dragFactor);
    });

    const speed = vel.length();
    If(speed.greaterThan(uMaxSpeed), () => {
        vel.assign(vel.normalize().mul(uMaxSpeed));
    });

    pos.addAssign(vel.mul(uTimeStep));

    positionBuffer.element(instanceIndex).assign(vec4(pos, 1.0));
    velocityBuffer.element(instanceIndex).assign(vec4(vel, 0.0));
})();

const computeNode = computeUpdate().compute(PARTICLE_COUNT);

// Material y Render
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

// Controladores de Teclado e Interfaz
let isLabMode = true;
let isPaused = false;
let previousRadialStrength = params.radialStrength.value;

const labPanel = createLabPanel({
    params: params,
    onReset: () => resetSimulation(),
    onPreset: (key) => applyPreset(key),
    onModeChange: () => { isLabMode = !isLabMode; labPanel.setVisible(isLabMode); },
    onPauseChange: () => { isPaused = !isPaused; }
});

function resetSimulation() {
    positionBuffer.value.array.set(initialPositions);
    velocityBuffer.value.array.set(initialVelocities);
    positionBuffer.value.needsUpdate = true;
    velocityBuffer.value.needsUpdate = true;
}

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

window.addEventListener('pointermove', (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    uPointer.value.set(x * 4.5, y * 3.0, 0);
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') { isLabMode = !isLabMode; labPanel.setVisible(isLabMode); }
    if (e.key === 'r' || e.key === 'R') { resetSimulation(); labPanel.refresh(); }
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

function animate() {
    requestAnimationFrame(animate);
    syncUniforms();
    material.sizeNode = float(params.particleSize.value);
    if (!isPaused) renderer.compute(computeNode);
    renderer.render(scene, camera);
}

animate();
