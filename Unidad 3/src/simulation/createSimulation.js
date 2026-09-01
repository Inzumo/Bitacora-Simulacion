import * as THREE from 'three/webgpu';
import {
  Fn,
  uniform,
  instancedArray,
  float,
  vec3,
  vec4,
  instanceIndex,
  length,
  smoothstep,
  mix,
  add,
  mul,
  sub,
  negate,
  normalize,
  If
} from 'three/tsl';

export function createSimulation({ renderer, scene, params, count }) {
  // -----------------------------------------------------------------
  // 1. BUFFERS Y ATRIBUTOS GPU
  // -----------------------------------------------------------------
  const positionBuffer = instancedArray(count, 'vec3');
  const velocityBuffer = instancedArray(count, 'vec3');

  // Declarar Uniforms pasando directamente las referencias de .value
  const uInitialSpeed = uniform(params.initialSpeed.value);
  const uMaxSpeed = uniform(params.maxSpeed.value);
  const uTimeStep = uniform(params.timeStep.value);
  const uBounds = uniform(params.bounds.value);

  const uCurrentCenter = uniform(params.currentCenter.value);

  const uWind = uniform(params.wind.value);
  const uWindEnabled = uniform(params.windEnabled.value);

  const uRadialStrength = uniform(params.radialStrength.value);
  const uRadialEnabled = uniform(params.radialEnabled.value);
  const uRadialSoftness = uniform(params.radialSoftness.value);

  const uVortexStrength = uniform(params.vortexStrength.value);
  const uVortexEnabled = uniform(params.vortexEnabled.value);
  const uVortexSoftness = uniform(params.vortexSoftness.value);

  const uDragCoefficient = uniform(params.dragCoefficient.value);
  const uDragEnabled = uniform(params.dragEnabled.value);

  const uParticleSize = uniform(params.particleSize.value);

  // -----------------------------------------------------------------
  // 2. HELPER HASH (GPU)
  // -----------------------------------------------------------------
  const gpuHash = (idx) => {
    const fIdx = float(idx);
    const p1 = fIdx.mul(0.1031).fract();
    const p2 = p1.mul(p1.add(33.33));
    return p1.mul(p2).fract();
  };

  // -----------------------------------------------------------------
  // 3. INIT COMPUTE SHADER
  // -----------------------------------------------------------------
  const initCompute = Fn(() => {
    const p = positionBuffer.element(instanceIndex);
    const v = velocityBuffer.element(instanceIndex);

    const rx = gpuHash(instanceIndex).mul(2.0).sub(1.0).mul(uBounds.x);
    const ry = gpuHash(instanceIndex.add(1)).mul(2.0).sub(1.0).mul(uBounds.y);
    const rz = gpuHash(instanceIndex.add(2)).mul(2.0).sub(1.0).mul(uBounds.z);

    p.assign(vec3(rx, ry, rz));

    const vx = gpuHash(instanceIndex.add(3)).mul(2.0).sub(1.0);
    const vy = gpuHash(instanceIndex.add(4)).mul(2.0).sub(1.0);
    const vz = gpuHash(instanceIndex.add(5)).mul(2.0).sub(1.0);

    const dir = normalize(vec3(vx, vy, vz));
    v.assign(dir.mul(uInitialSpeed));
  })().compute(count);

  // -----------------------------------------------------------------
  // 4. STEP COMPUTE SHADER (FÍSICA)
  // -----------------------------------------------------------------
  const stepCompute = Fn(() => {
    const p = positionBuffer.element(instanceIndex);
    const v = velocityBuffer.element(instanceIndex);

    let force = vec3(0.0);

    // Viento
    If(uWindEnabled.greaterThan(0.5), () => {
      force.addAssign(uWind);
    });

    // Atracción / Repulsión Radial
    If(uRadialEnabled.greaterThan(0.5), () => {
      const delta = sub(uCurrentCenter, p);
      const dist = length(delta);
      const dir = normalize(delta);
      const factor = float(1.0).div(dist.add(uRadialSoftness));
      force.addAssign(dir.mul(uRadialStrength).mul(factor));
    });

    // Vórtice
    If(uVortexEnabled.greaterThan(0.5), () => {
      const delta = sub(p, uCurrentCenter);
      const tangent = vec3(negate(delta.z), float(0.0), delta.x);
      const dist = length(delta);
      const dir = normalize(tangent);
      const factor = float(1.0).div(dist.add(uVortexSoftness));
      force.addAssign(dir.mul(uVortexStrength).mul(factor));
    });

    // Fricción (Drag)
    If(uDragEnabled.greaterThan(0.5), () => {
      force.addAssign(negate(v).mul(uDragCoefficient));
    });

    // Integración de movimiento
    v.addAssign(force.mul(uTimeStep));

    // Límite de velocidad
    const currentSpeed = length(v);
    If(currentSpeed.greaterThan(uMaxSpeed), () => {
      v.assign(normalize(v).mul(uMaxSpeed));
    });

    p.addAssign(v.mul(uTimeStep));

    // Rebote en límites
    If(p.x.abs().greaterThan(uBounds.x), () => {
      p.x.assign(p.x.sign().mul(uBounds.x));
      v.x.assign(negate(v.x));
    });
    If(p.y.abs().greaterThan(uBounds.y), () => {
      p.y.assign(p.y.sign().mul(uBounds.y));
      v.y.assign(negate(v.y));
    });
    If(p.z.abs().greaterThan(uBounds.z), () => {
      p.z.assign(p.z.sign().mul(uBounds.z));
      v.z.assign(negate(v.z));
    });
  })().compute(count);

  // -----------------------------------------------------------------
  // 5. MATERIAL VISUAL
  // -----------------------------------------------------------------
  const material = new THREE.SpriteNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  material.positionNode = positionBuffer.toAttribute();

  const vel = velocityBuffer.toAttribute();
  const speed = length(vel);
  const normalizedSpeed = smoothstep(0.0, 5.0, speed);

  const colorSlow = vec3(0.0, 0.4, 1.0);  // Azul eléctrico
  const colorMid = vec3(0.8, 0.1, 0.9);   // Magenta
  const colorFast = vec3(1.0, 0.4, 0.1);  // Naranja fuego

  const finalColor = mix(
    mix(colorSlow, colorMid, normalizedSpeed.mul(1.5)),
    colorFast,
    smoothstep(0.4, 1.0, normalizedSpeed)
  );

  material.colorNode = vec4(finalColor.mul(1.8), 0.85);
  material.scaleNode = uParticleSize.mul(add(1.0, normalizedSpeed.mul(0.6)));

  // -----------------------------------------------------------------
  // 6. MESH INSTANCIADO
  // -----------------------------------------------------------------
  const geometry = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  scene.add(mesh);

  return {
    uniforms: {
      uInitialSpeed,
      uMaxSpeed,
      uTimeStep,
      uBounds,
      uCurrentCenter,
      uWind,
      uWindEnabled,
      uRadialStrength,
      uRadialEnabled,
      uRadialSoftness,
      uVortexStrength,
      uVortexEnabled,
      uVortexSoftness,
      uDragCoefficient,
      uDragEnabled,
      uParticleSize
    },
    reset() {
      renderer.compute(initCompute);
    },
    stepSimulation() {
      renderer.compute(stepCompute);
    }
  };
}
