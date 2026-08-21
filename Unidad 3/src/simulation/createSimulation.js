import * as THREE from 'three/webgpu';
import { Fn, instancedArray, float, vec4, uniform, instanceIndex } from 'three/tsl';

export function createSimulation({ renderer, scene, params, count }) {
  const positionBuffer = instancedArray(count, 'vec4');
  const velocityBuffer = instancedArray(count, 'vec4');

  const uDamping = uniform(params.damping);
  const uRadialStrength = uniform(params.radialStrength);
  const uParticleSize = uniform(params.particleSize);
  const uAttractor = uniform(new THREE.Vector3(0, 0, 0));

  // Compute Shader: Reset
  const initParticles = Fn(() => {
    const index = instanceIndex;

    const phi = float(index).mul(0.101);
    const theta = float(index).mul(0.053);
    const radius = float(index).mod(1000.0).div(1000.0).mul(3.0);

    const posX = radius.mul(theta.sin()).mul(phi.cos());
    const posY = radius.mul(theta.sin()).mul(phi.sin());
    const posZ = radius.mul(theta.cos());

    positionBuffer.element(index).assign(vec4(posX, posY, posZ, 1.0));
    velocityBuffer.element(index).assign(vec4(0.0, 0.0, 0.0, 0.0));
  });

  const computeInit = initParticles().compute(count);

  // Compute Shader: Física
  const updateParticles = Fn(() => {
    const index = instanceIndex;

    const pos = positionBuffer.element(index).xyz;
    const vel = velocityBuffer.element(index).xyz;

    const dir = uAttractor.sub(pos);
    const dist = dir.length().max(0.1);
    const force = dir.normalize().mul(uRadialStrength).div(dist);

    const newVel = vel.add(force.mul(0.016)).mul(uDamping);
    const newPos = pos.add(newVel.mul(0.016));

    positionBuffer.element(index).assign(vec4(newPos, 1.0));
    velocityBuffer.element(index).assign(vec4(newVel, 0.0));
  });

  const computeSimulation = updateParticles().compute(count);

  // Construcción visual del objeto de partículas
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.drawRange.count = count;

  const material = new THREE.PointsNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  material.positionNode = positionBuffer.toAttribute();
  material.sizeNode = uParticleSize;
  material.colorNode = vec4(0.2, 0.6, 1.0, 0.8);

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    computeSimulation,
    stepSimulation: () => {
      uDamping.value = params.damping ?? 0.98;
      uRadialStrength.value = params.radialStrength ?? 0.5;
      uParticleSize.value = params.particleSize ?? 0.15;

      if (params.attractor) {
        if (params.attractor.isVector3) uAttractor.value.copy(params.attractor);
        else if (Array.isArray(params.attractor)) uAttractor.value.set(...params.attractor);
      }

      renderer.compute(computeSimulation);
    },
    reset: () => {
      renderer.compute(computeInit);
    }
  };
}
