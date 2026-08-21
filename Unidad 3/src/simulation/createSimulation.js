import * as THREE from 'three/webgpu';
import { Fn, instancedArray, float, vec3, vec4, uniform, instanceIndex } from 'three/tsl';

export function createSimulation({ renderer, scene, params, count }) {
  // Buffers de estado en VRAM
  const positionBuffer = instancedArray(count, 'vec4');
  const velocityBuffer = instancedArray(count, 'vec4');

  // Uniforms vinculados a parámetros
  const uDamping = uniform(params.damping || 0.98);
  const uRadialStrength = uniform(params.radialStrength || 0.5);
  const uParticleSize = uniform(params.particleSize || 0.05);
  const uAttractor = uniform(new THREE.Vector3(0, 0, 0));

  // Compute Shader de Inicialización
  const initParticles = Fn(() => {
    const index = instanceIndex;

    // Distribución en esfera uniforme 3D de radio 3.0
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

  // Compute Shader de Física
  const updateParticles = Fn(() => {
    const index = instanceIndex;

    const pos = positionBuffer.element(index).xyz;
    const vel = velocityBuffer.element(index).xyz;

    // Cálculo de dirección y atracción
    const dir = uAttractor.sub(pos);
    const dist = dir.length().max(0.2);
    const force = dir.normalize().mul(uRadialStrength).div(dist);

    const newVel = vel.add(force.mul(0.016)).mul(uDamping);
    const newPos = pos.add(newVel.mul(0.016));

    positionBuffer.element(index).assign(vec4(newPos, 1.0));
    velocityBuffer.element(index).assign(vec4(newVel, 0.0));
  });

  const computeSimulation = updateParticles().compute(count);

  // Creación de Geometría y Material Nodal
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.drawRange.count = count;

  const material = new THREE.PointsNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  // Asignación explícita de nodos
  material.positionNode = positionBuffer.toAttribute();
  material.sizeNode = uParticleSize;
  material.colorNode = vec4(0.3, 0.7, 1.0, 0.8);

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    computeSimulation,
    stepSimulation: () => {
      // Sincronización de parámetros hacia la GPU
      uDamping.value = isNaN(params.damping) ? 0.98 : params.damping;
      uRadialStrength.value = isNaN(params.radialStrength) ? 0.5 : params.radialStrength;
      uParticleSize.value = isNaN(params.particleSize) ? 0.05 : params.particleSize;

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
