import * as THREE from 'three/webgpu';
import { 
  Fn, 
  instancedArray, 
  float, 
  vec3, 
  vec4, 
  If, 
  uniform 
} from 'three/tsl';

export function createSimulation({ renderer, scene, params, count }) {
  // 1. BUFFERS DE ALMACENAMIENTO (Storage Buffers)
  // Guardamos posición (vec4) y velocidad (vec4) por partícula
  const positionBuffer = instancedArray(count, 'vec4');
  const velocityBuffer = instancedArray(count, 'vec4');

  // 2. INICIALIZACIÓN DE PARTÍCULAS (Compute Shader de Reset)
  const initParticles = Fn(({ storageProcess }) => {
    const index = storageProcess.globalInvocationID.x;

    // Distribuir partículas en una esfera aleatoria
    const phi = float(index).mul(0.1);
    const radius = float(index).mod(2.0);
    
    const posX = radius.mul(phi.cos());
    const posY = radius.mul(phi.sin());
    const posZ = float(index).mod(1.0).sub(0.5);

    positionBuffer.element(index).assign(vec4(posX, posY, posZ, 1.0));
    velocityBuffer.element(index).assign(vec4(0.0, 0.0, 0.0, 0.0));
  });

  const initCompute = initParticles().compute(count);

  // 3. SHADER DE SIMULACIÓN (Física por Frame)
  const updateParticles = Fn(({ storageProcess }) => {
    const index = storageProcess.globalInvocationID.x;

    const pos = positionBuffer.element(index).xyz;
    const vel = velocityBuffer.element(index).xyz;

    // Aplicar fuerza del atractor (si existe en params)
    const attrPos = vec3(params.attractor ? params.attractor : vec3(0.0));
    const dir = attrPos.sub(pos);
    const dist = dir.length().max(0.1);
    const force = dir.normalize().mul(float(params.targets?.radialStrength || 0.5)).div(dist);

    // Actualizar velocidad con amortiguamiento (Damping)
    const newVel = vel.add(force.mul(0.016)).mul(0.98);
    const newPos = pos.add(newVel.mul(0.016));

    // Guardar los nuevos estados en el buffer
    positionBuffer.element(index).assign(vec4(newPos, 1.0));
    velocityBuffer.element(index).assign(vec4(newVel, 0.0));
  });

  const computeNode = updateParticles().compute(count);

  // 4. CREAR LA GEOMETRÍA Y MATERIAL VISUAL
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.drawRange.count = count;

  // El material TSL lee la posición directamente desde el Storage Buffer
  const material = new THREE.PointsNodeMaterial({
    size: 3.0,
    sizeAttenuation: true,
  });

  // Vinculamos la posición del vértice con el buffer procesado en GPU
  material.positionNode = positionBuffer.toAttribute();
  material.colorNode = vec4(0.2, 0.6, 1.0, 1.0);

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // 5. MÉTODOS DE CONTROL
  return {
    computeNode,
    stepSimulation: () => {
      if (renderer) renderer.compute(computeNode);
    },
    reset: () => {
      if (renderer) renderer.compute(initCompute);
    }
  };
}
