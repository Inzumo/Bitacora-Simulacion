export function createParameters() {
  const params = {
    damping: 0.98,
    speedLimit: 5.0,
    radialStrength: 0.5,
    radialEnabled: 1.0,
    attractor: [0, 0, 0],
    currentCenter: [0, 0, 0],
    wind: [0, 0, 0],
    bounds: [5, 5, 5]
  };

  // Referencia directa para compatibilidad de accesos
  params.targets = params;

  return params;
}

export function updateParametersSmoothly(params, lerpFactor = 0.05) {
  // Los parámetros se aplican directamente en tiempo real
}

export const presets = {
  preset1: (params) => {
    params.damping = 0.99;
    params.speedLimit = 8.0;
    params.radialStrength = 0.0;
  },
  preset2: (params) => {
    params.damping = 0.95;
    params.speedLimit = 4.0;
    params.radialStrength = 0.2;
    params.wind = [1.5, 0.0, 0.0];
  },
  preset3: (params) => {
    params.damping = 0.97;
    params.speedLimit = 6.0;
    params.radialStrength = 2.0;
  },
  preset4: (params) => {
    params.damping = 0.97;
    params.speedLimit = 6.0;
    params.radialStrength = -2.0;
  },
  preset5: (params) => {
    params.damping = 0.98;
    params.speedLimit = 10.0;
    params.radialStrength = 1.0;
  }
};
