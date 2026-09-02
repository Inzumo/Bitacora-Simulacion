import * as THREE from 'three';
import { uniform } from 'three/tsl';

export function createParameters() {
  return {
    // Definimos los 5 focos como uniforms independientes reconocibles por WGSL
    attractors: Array.from({ length: 8 }, () => uniform(new THREE.Vector3())),
    radialStrength: uniform(0.35),
    radialEnabled: uniform(1),
    vortexStrength: uniform(0.15),
    vortexEnabled: uniform(1),
    wind: uniform(new THREE.Vector3(0, 0, 0)),
    windEnabled: uniform(1),
    dragCoefficient: uniform(0.22),
    dragEnabled: uniform(1),
    initialSpeed: uniform(0.0),
    particleSize: uniform(0.02),
    boundsSize: uniform(12.0),
    maxSpeed: uniform(8.0),
    softening: uniform(0.2),
    dt: uniform(0.016),
    timeScale: uniform(1.0)
  };
}