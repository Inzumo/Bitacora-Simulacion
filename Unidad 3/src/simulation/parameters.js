import * as THREE from 'three/webgpu';

export function createParameters() {
  return {
    initialSpeed: { value: 0.5 },
    maxSpeed: { value: 10.0 },
    timeStep: { value: 0.016 },
    bounds: { value: new THREE.Vector3(5.0, 5.0, 5.0) },
    particleSize: { value: 0.08 },

    // Corriente Local
    currentCenter: { value: new THREE.Vector3(0, 0, 0) },
    currentDirection: { value: new THREE.Vector3(1, 0, 0) },
    currentStrength: { value: 2.0 },
    currentRadius: { value: 2.0 },
    currentEnabled: { value: 1.0 },

    // Viento Constante
    wind: { value: new THREE.Vector3(0, 0, 0) },
    windEnabled: { value: 0.0 },

    // Atracción / Repulsión Radial
    radialStrength: { value: 2.0 },
    radialEnabled: { value: 1.0 },
    radialSoftness: { value: 0.5 },

    // Vórtice
    vortexStrength: { value: 2.0 },
    vortexEnabled: { value: 0.0 },
    vortexSoftness: { value: 0.5 },

    // Ficción (Drag)
    dragCoefficient: { value: 0.05 },
    dragEnabled: { value: 1.0 },

    // Curl Noise
    curlEnabled: { value: 0.0 },
    curlStrength: { value: 1.0 },
    noiseScale: { value: 0.5 },
    noiseSpeed: { value: 0.1 }
  };
}
