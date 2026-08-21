import * as THREE from 'three';

export function createParameters() {
  return {
    initialSpeed: { value: 0.5 },
    particleSize: { value: 0.15 },
    timeStep: { value: 0.016 },
    maxSpeed: { value: 5.0 },

    // Corriente Local
    currentCenter: { value: new THREE.Vector3(0, 0, 0) },
    currentDirection: { value: new THREE.Vector3(1, 0, 0) },
    currentStrength: { value: 0.0 },
    currentRadius: { value: 2.0 },
    currentEnabled: { value: 0.0 },

    // Drag / Fricción
    dragCoefficient: { value: 0.02 },
    dragEnabled: { value: 1.0 },

    // Fuerza Radial
    radialStrength: { value: 1.5 },
    radialEnabled: { value: 1.0 },
    radialSoftness: { value: 0.5 },

    // Vórtice
    vortexStrength: { value: 1.0 },
    vortexEnabled: { value: 0.0 },
    vortexSoftness: { value: 0.5 },

    // Viento
    wind: { value: new THREE.Vector3(0, 0, 0) },
    windEnabled: { value: 0.0 },

    // Turbulencia / Curl
    curlEnabled: { value: 0.0 },
    curlStrength: { value: 0.5 },
    noiseScale: { value: 1.0 },
    noiseSpeed: { value: 0.5 },

    // Límites de la caja
    bounds: { value: new THREE.Vector3(5, 5, 5) }
  };
}

export function updateParametersSmoothly() {
  // Interpolación auxiliar si se requiere
}

export const presets = {
  preset1: (p) => {
    p.radialEnabled.value = 1.0;
    p.radialStrength.value = 0.0;
    p.vortexEnabled.value = 0.0;
  },
  preset2: (p) => {
    p.radialEnabled.value = 0.0;
    p.windEnabled.value = 1.0;
    p.wind.value.set(1.5, 0, 0);
  },
  preset3: (p) => {
    p.radialEnabled.value = 1.0;
    p.radialStrength.value = 2.0;
    p.vortexEnabled.value = 0.0;
  },
  preset4: (p) => {
    p.radialEnabled.value = 1.0;
    p.radialStrength.value = -2.0;
    p.vortexEnabled.value = 0.0;
  },
  preset5: (p) => {
    p.radialEnabled.value = 1.0;
    p.vortexEnabled.value = 1.0;
    p.vortexStrength.value = 1.5;
  }
};
