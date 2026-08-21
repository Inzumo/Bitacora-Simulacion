import * as THREE from 'three/webgpu';
import { Fn, instancedArray, float, vec3, vec4, uniform, instanceIndex } from 'three/tsl';

export function createSimulation({ renderer, scene, params, count }) {
  // Buffers en VRAM
  const positionBuffer = instancedArray(count, 'vec4');
  const velocityBuffer = instancedArray(count, 'vec4');

  // Uniforms vinculados a los parámetros
  const uDamping = uniform(params.damping);
  const uRadialStrength = uniform(params.radialStrength);
  const uAttractor = uniform(new THREE.Vector3(...params.attractor));

  // Compute Shader de Inicialización / Reset
  const initParticles = Fn(() => {
    // Usamos instanceIndex directamente en lugar de storageProcess.globalInvocationID.x
    const index = instanceIndex;

    const phi = float(index).mul(0.1);
    const radius = float(index).mod(2.0);

    const posX = radius.mul(phi.cos());
    const posY = radius.mul(phi.sin());
    const posZ = float(index).mod(1.0).sub(0.5);

    positionBuffer.element(index).assign(vec4(posX, posY, posZ, 1.0));
    velocityBuffer.element(index).assign(vec4(0.0, 0.0, 0.0, 0.0));
  });

  const computeInit = initParticles().compute(count);

  // Compute Shader de Física
  const updateParticles = Fn(() => {
    const index = instanceIndex;

    const pos = positionBuffer.element(index).xyz;
    const vel = velocityBuffer.element(index).xyz;

    // Fuerza de atracción radial
    const dir = uAttractor.sub(pos);
    const dist = dir.length().max(0.1);
    const force = dir.normalize().mul(uRadialStrength).div(dist);

    const newVel = vel.add(force.mul(0.016)).mul(uDamping);
    const newPos = pos.add(newVel.mul(0.016));

    positionBuffer.element(index).assign(vec4(newPos, 1.0));
    velocityBuffer.element(index).assign(vec4(newVel, 0.0));
  });

  const computeSimulation = updateParticles().compute(count);

  // Malla visual
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
      uDamping.value = params.damping;
      uRadialStrength.value = params.radialStrength;
      if (params.attractor.isVector3) {
        uAttractor.value.copy(params.attractor);
      } else if (Array.isArray(params.attractor)) {
        uAttractor.value.set(...params.attractor);
      }

      renderer.compute(computeSimulation);
    },
    reset: () => {
      renderer.compute(computeInit);
    }
  };
}
