import * as THREE from 'three/webgpu';
import { Fn, instancedArray, float, vec4, uniform } from 'three/tsl';

export function createSimulation({ renderer, scene, params, count }) {
  const positionBuffer = instancedArray(count, 'vec4');
  const velocityBuffer = instancedArray(count, 'vec4');

  // Init / Reset Compute Node
  const initParticles = Fn(({ storageProcess }) => {
    const index = storageProcess.globalInvocationID.x;

    const phi = float(index).mul(0.1);
    const radius = float(index).mod(2.0);

    const posX = radius.mul(phi.cos());
    const posY = radius.mul(phi.sin());
    const posZ = float(index).mod(1.0).sub(0.5);

    positionBuffer.element(index).assign(vec4(posX, posY, posZ, 1.0));
    velocityBuffer.element(index).assign(vec4(0.0, 0.0, 0.0, 0.0));
  });

  const computeInit = initParticles().compute(count);

  // Frame Physics Compute Node
  const updateParticles = Fn(({ storageProcess }) => {
    const index = storageProcess.globalInvocationID.x;

    const pos = positionBuffer.element(index).xyz;
    const vel = velocityBuffer.element(index).xyz;

    const newPos = pos.add(vel.mul(0.016));

    positionBuffer.element(index).assign(vec4(newPos, 1.0));
    velocityBuffer.element(index).assign(vec4(vel, 0.0));
  });

  const computeSimulation = updateParticles().compute(count);

  // Mesh setup
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.drawRange.count = count;

  const material = new THREE.PointsNodeMaterial({
    size: 3.0,
    sizeAttenuation: true,
  });

  material.positionNode = positionBuffer.toAttribute();
  material.colorNode = vec4(0.2, 0.6, 1.0, 1.0);

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    computeSimulation,
    stepSimulation: () => {
      renderer.compute(computeSimulation);
    },
    reset: () => {
      renderer.compute(computeInit);
    }
  };
}
