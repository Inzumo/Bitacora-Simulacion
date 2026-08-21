export function createParameters() {
  return {
    timeScale: 1.0,
    maxSpeed: 5.0,
    particleSize: 0.15,
    damping: 0.98,
    
    radialEnabled: 1.0,
    radialStrength: 0.5,
    vortexEnabled: 0.0,
    vortexStrength: 1.0,
    curlEnabled: 0.0,
    curlStrength: 0.5,
    dragEnabled: 0.0,
    
    attractor: [0, 0, 0],
    currentCenter: [0, 0, 0],
    wind: [0, 0, 0],
    bounds: [5, 5, 5]
  };
}

export function updateParametersSmoothly(params, lerpFactor = 0.05) {
  // Aplicación directa sin interpolaciones
}

export const presets = {
  preset1: (params) => {
    params.damping = 0.99;
    params.maxSpeed = 8.0;
    params.radialStrength = 0.0;
  },
  preset2: (params) => {
    params.damping = 0.95;
    params.maxSpeed = 4.0;
    params.radialStrength = 0.2;
    params.wind = [1.5, 0.0, 0.0];
  },
  preset3: (params) => {
    params.damping = 0.97;
    params.maxSpeed = 6.0;
    params.radialStrength = 2.0;
  },
  preset4: (params) => {
    params.damping = 0.97;
    params.maxSpeed = 6.0;
    params.radialStrength = -2.0;
  },
  preset5: (params) => {
    params.damping = 0.98;
    params.maxSpeed = 10.0;
    params.radialStrength = 1.0;
  }
};
