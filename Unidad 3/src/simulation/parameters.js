import * as THREE from 'three/webgpu';

export function createParameters() {
  const params = {
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

    // Fricción (Drag)
    dragCoefficient: { value: 0.05 },
    dragEnabled: { value: 1.0 },

    // Curl Noise
    curlEnabled: { value: 0.0 },
    curlStrength: { value: 1.0 },
    noiseScale: { value: 0.5 },
    noiseSpeed: { value: 0.1 },

    // Estado objetivo para transiciones suaves (targets)
    targets: {}
  };

  // Inicializar metas con copias independientes de los valores base
  for (const key in params) {
    if (key === 'targets') continue;
    const val = params[key].value;
    if (val instanceof THREE.Vector3) {
      params.targets[key] = val.clone();
    } else {
      params.targets[key] = val;
    }
  }

  return params;
}

// Función de suavizado continuo que debes invocar en el bucle principal (animate)
export function updateParametersSmoothly(params, lerpFactor = 0.05) {
  for (const key in params.targets) {
    const targetVal = params.targets[key];
    const currentUniform = params[key];

    if (currentUniform && currentUniform.value !== undefined) {
      if (currentUniform.value instanceof THREE.Vector3) {
        currentUniform.value.lerp(targetVal, lerpFactor);
      } else if (typeof currentUniform.value === 'number') {
        currentUniform.value += (targetVal - currentUniform.value) * lerpFactor;
      }
    }
  }
}

// Mapa de los 5 Presets (actualizan exclusivamente los valores dentro de 'targets')
export const presets = {
  preset1: (params) => { // Inercia / Estado Base
    params.targets.radialEnabled = 0.0;
    params.targets.vortexEnabled = 0.0;
    params.targets.windEnabled = 0.0;
    params.targets.currentEnabled = 0.0;
    params.targets.dragEnabled = 1.0;
    params.targets.dragCoefficient = 0.08;
  },
  preset2: (params) => { // Viento / Flujo Direccional
    params.targets.radialEnabled = 0.0;
    params.targets.vortexEnabled = 0.0;
    params.targets.currentEnabled = 1.0;
    params.targets.currentStrength = 5.0;
    params.targets.windEnabled = 1.0;
    params.targets.wind.set(3.0, 0.0, 0.0);
    params.targets.dragCoefficient = 0.02;
  },
  preset3: (params) => { // Atracción Radial / Tensión
    params.targets.radialEnabled = 1.0;
    params.targets.radialStrength = 8.0;
    params.targets.vortexEnabled = 0.0;
    params.targets.windEnabled = 0.0;
    params.targets.currentEnabled = 0.0;
    params.targets.dragCoefficient = 0.04;
  },
  preset4: (params) => { // Repulsión / Impacto
    params.targets.radialEnabled = 1.0;
    params.targets.radialStrength = -15.0; // Valor negativo genera repulsión
    params.targets.vortexEnabled = 0.0;
    params.targets.windEnabled = 0.0;
    params.targets.currentEnabled = 0.0;
    params.targets.dragCoefficient = 0.01;
  },
  preset5: (params) => { // Vórtice / Caos Orgánico
    params.targets.radialEnabled = 0.0;
    params.targets.vortexEnabled = 1.0;
    params.targets.vortexStrength = 12.0;
    params.targets.curlEnabled = 1.0;
    params.targets.curlStrength = 2.0;
    params.targets.dragCoefficient = 0.03;
  }
};
