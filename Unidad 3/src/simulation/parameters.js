export function createParameters() {
  const params = {
    // Aseguramos valores numéricos válidos en la estructura plana
    timeScale: 1.0,
    maxSpeed: 5.0,
    particleSize: 0.05,
    
    // Fuerzas
    radialEnabled: 0,
    radialStrength: 0.5,
    vortexEnabled: 0,
    vortexStrength: 1.0,
    curlEnabled: 0,
    curlStrength: 0.5,
    dragEnabled: 0,
    damping: 0.98,
    
    // Vectores / Referencias
    attractor: [0, 0, 0],
    currentCenter: [0, 0, 0],
    wind: [0, 0, 0],
    bounds: [5, 5, 5]
  };

  // Mantener compatibilidad con params.targets para Tweakpane/Lil-GUI
  params.targets = params;

  return params;
}

export function updateParametersSmoothly(params, lerpFactor = 0.05) {
  // Garantizar protección contra NaN si un slider de la UI falla
  if (isNaN(params.radialStrength)) params.radialStrength = 0.5;
  if (isNaN(params.particleSize)) params.particleSize = 0.05;
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
