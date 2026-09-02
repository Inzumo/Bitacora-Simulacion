import * as THREE from 'three/webgpu';
import {
  uniform,
  instancedArray,
  float,
  vec3,
  vec4,
  compute,
  Fn,
  mix,
  length,
  normalize,
  cross,
  clamp,
  instanceIndex
} from 'three/tsl';

export function createSimulation({ renderer, scene, params, count }) {
  // ============================================================
  // UNIFORMS TSL DECLARADOS CON TIPO EXPLÍCITO
  // ============================================================
  const uTimeStep = uniform(params.timeStep?.value ?? 0.016, 'float');
  const uMaxSpeed = uniform(params.maxSpeed?.value ?? 10.0, 'float');
  const uParticleSize = uniform(params.particleSize?.value ?? 0.08, 'float');

  const uRadialEnabled = uniform(params.radialEnabled?.value ?? 0.0, 'float');
  const uRadialStrength = uniform(params.radialStrength?.value ?? 2.0, 'float');

  const uVortexEnabled = uniform(params.vortexEnabled?.value ?? 0.0, 'float');
  const uVortexStrength = uniform(params.vortexStrength?.value ?? 2.0, 'float');

  const uCurlEnabled = uniform(params.curlEnabled?.value ?? 0.0, 'float');
  const uCurlStrength = uniform(params.curlStrength?.value ?? 0.0, 'float');

  const uDragEnabled = uniform(params.dragEnabled?.value ?? 1.0, 'float');
  const uDragCoefficient = uniform(params.dragCoefficient?.value ?? 0.05, 'float');

  const uWindEnabled = uniform(params.windEnabled?.value ?? 0.0, 'float');
  const uWind = uniform(params.wind?.value || new THREE.Vector3(0, 0, 0), 'vec3');

  const uCurrentCenter = uniform(
    params.currentCenter?.value || new THREE.Vector3(0, 0, 0),
    'vec3'
  );

  const uniforms = {
    uTimeStep,
    uMaxSpeed,
    uParticleSize,
    uRadialEnabled,
    uRadialStrength,
    uVortexEnabled,
    uVortexStrength,
    uCurlEnabled,
    uCurlStrength,
    uDragEnabled,
    uDragCoefficient,
    uWindEnabled,
    uWind,
    uCurrentCenter
  };

  // ============================================================
  // BUFFERS GPU
  // ============================================================
  const positionArray = new Float32Array(count * 3);
  const velocityArray = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const radius = 2.0 * Math.sqrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positionArray[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positionArray[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positionArray[i3 + 2] = radius * Math.cos(phi);

    velocityArray[i3] = (Math.random() - 0.5) * 0.1;
    velocityArray[i3 + 1] = (Math.random() - 0.5) * 0.1;
    velocityArray[i3 + 2] = (Math.random() - 0.5) * 0.1;
  }

  const positionBuffer = instancedArray(positionArray, 'vec3');
  const velocityBuffer = instancedArray(velocityArray, 'vec3');

  // ============================================================
  // COMPUTE SHADER TSL
  // ============================================================
  const computeUpdate = Fn(() => {
    const pos = positionBuffer.element(instanceIndex);
    const vel = velocityBuffer.element(instanceIndex);

    const force = vec3(0.0).toVar();

    // Fuerza Radial
    const delta = uCurrentCenter.sub(pos);
    const dist = length(delta).max(0.1);
    const dir = delta.div(dist);

    const radialForce = dir.mul(uRadialStrength).mul(uRadialEnabled);
    force.addAssign(radialForce);

    // Fuerza Vórtice
    const up = vec3(0.0, 1.0, 0.0);
    const vortexDir = cross(dir, up);
    const vortexForce = vortexDir.mul(uVortexStrength).mul(uVortexEnabled);
    force.addAssign(vortexForce);

    // Fuerza Viento
    const windForce = uWind.mul(uWindEnabled);
    force.addAssign(windForce);

    // Fuerza Drag
    const dragForce = vel.mul(uDragCoefficient.negate()).mul(uDragEnabled);
    force.addAssign(dragForce);

    // Integración de Euler
    vel.addAssign(force.mul(uTimeStep));

    // Limitar velocidad máxima
    const speed = length(vel);
    const overSpeed = speed.greaterThan(uMaxSpeed);
    const limitedVel = normalize(vel).mul(uMaxSpeed);
    vel.assign(mix(vel, limitedVel, overSpeed));

    // Actualizar posición
    pos.addAssign(vel.mul(uTimeStep));
  });

  const computeNode = computeUpdate().compute(count);

  // ============================================================
  // MATERIAL DE PARTÍCULAS
  // ============================================================
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3)
  );

  const particleMaterial = new THREE.SpriteNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particleMaterial.positionNode = positionBuffer.element(instanceIndex);
  particleMaterial.scaleNode = uParticleSize;

  const velNode = velocityBuffer.element(instanceIndex);
  const speedRatio = clamp(length(velNode).div(uMaxSpeed), 0.0, 1.0);
  const colorSlow = vec3(0.1, 0.4, 1.0);
  const colorFast = vec3(1.0, 0.2, 0.5);

  particleMaterial.colorNode = vec4(mix(colorSlow, colorFast, speedRatio), 0.8);

  const mesh = new THREE.InstancedMesh(geometry, particleMaterial, count);
  mesh.count = count;
  scene.add(mesh);

  return {
    uniforms,
    stepSimulation: () => {
      renderer.compute(computeNode);
    },
    reset: () => {
      // Reescritura directa sobre los TypedArrays del closure
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const radius = 2.0 * Math.sqrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positionArray[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positionArray[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positionArray[i3 + 2] = radius * Math.cos(phi);

        velocityArray[i3] = (Math.random() - 0.5) * 0.1;
        velocityArray[i3 + 1] = (Math.random() - 0.5) * 0.1;
        velocityArray[i3 + 2] = (Math.random() - 0.5) * 0.1;
      }

      // Notificar actualización al atributo de buffer correspondiente
      const posAttr = positionBuffer.value || positionBuffer.attribute || positionBuffer.nodeAttribute;
      const velAttr = velocityBuffer.value || velocityBuffer.attribute || velocityBuffer.nodeAttribute;

      if (posAttr) posAttr.needsUpdate = true;
      if (velAttr) velAttr.needsUpdate = true;
    }
  };
}
