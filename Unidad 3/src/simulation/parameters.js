import * as THREE from 'three';

export function createParameters() {
  return {
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
}
