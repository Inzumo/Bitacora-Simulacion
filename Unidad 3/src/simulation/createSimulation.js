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

  // Envolver parámetros para Compute Shader TSL
  const uInitialSpeed = uniform(params.initialSpeed);
  const uMaxSpeed = uniform(params.maxSpeed);
  const uTimeStep = uniform(params.timeStep);
  const uBounds = uniform(params.bounds);

  const uCurrentCenter = uniform(params.currentCenter);
  const uCurrentStrength = uniform(params.currentStrength);
  const uCurrentEnabled = uniform(params.currentEnabled);

  const uWind = uniform(params.wind);
  const uWindEnabled = uniform(params.windEnabled);

  const uRadialStrength = uniform(params.radialStrength);
  const uRadialEnabled = uniform(params.radialEnabled);
  const uRadialSoftness = uniform(params.radialSoftness);

  const uVortexStrength = uniform(params.vortexStrength);
  const uVortexEnabled = uniform(params.vortexEnabled);
  const uVortexSoftness = uniform(params.vortexSoftness);

  const uDragCoefficient = uniform(params.dragCoefficient);
  const uDragEnabled = uniform(params.dragEnabled);

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

    const b = uBounds.value;
    const rx = gpuHash(instanceIndex).mul(2.0).sub(1.0).mul(b.x);
    const ry = gpuHash(instanceIndex.add(1)).mul(2.0).sub(1.0).mul(b.y);
    const rz = gpuHash(instanceIndex.add(2)).mul(2.0).sub(1.0).mul(b.z);

    p.assign(vec3(rx, ry, rz));

    const vx = gpuHash(instanceIndex.add(3)).mul(2.0).sub(1.0);
    const vy = gpuHash(instanceIndex.add(4)).mul(2.0).sub(1.0);
    const vz = gpuHash(instanceIndex.add(5)).mul(2.0).sub(1.0);

    const dir = normalize(vec3(vx, vy, vz));
    v.assign(dir.mul(uInitialSpeed));
  })().compute(count);

  // -----------------------------------------------------------------
  // 4. STEP COMPUTE SHADER (FÍSICA COMPUTA)
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
    const b = uBounds.value;
    If(p.x.abs().greaterThan(b.x), () => {
      p.x.assign(p.x.sign().mul(b.x));
      v.x.assign(negate(v.x));
    });
    If(p.y.abs().greaterThan(b.y), () => {
      p.y.assign(p.y.sign().mul(b.y));
      v.y.assign(negate(v.y));
    });
    If(p.z.abs().greaterThan(b.z), () => {
      p.z.assign(p.z.sign().mul(b.z));
      v.z.assign(negate(v.z));
    });
  })().compute(count);

  // -----------------------------------------------------------------
  // 5. SHADER MATERIAL VISUAL (TSL TRICROMÁTICO + MEZCLA ADITIVA)
  // -----------------------------------------------------------------
  const material = new THREE.SpriteNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  // Posición desde buffer
  material.positionNode = positionBuffer.toAttribute();

  // Color y Tamaño dinámico según velocidad
  const vel = velocityBuffer.toAttribute();
  const speed = length(vel);
  const normalizedSpeed = smoothstep(0.0, 5.0, speed);

  // Paleta Neón Tricromática
  const colorSlow = vec3(0.0, 0.4, 1.0);  // Azul eléctrico
  const colorMid = vec3(0.8, 0.1, 0.9);   // Magenta
  const colorFast = vec3(1.0, 0.4, 0.1);  // Naranja fuego

  const finalColor = mix(
    mix(colorSlow, colorMid, normalizedSpeed.mul(1.5)),
    colorFast,
    smoothstep(0.4, 1.0, normalizedSpeed)
  );

  material.colorNode = vec4(finalColor.mul(1.8), 0.85);

  // Tamaño variable
  const baseSize = uniform(params.particleSize);
  material.scaleNode = baseSize.mul(add(1.0, normalizedSpeed.mul(0.6)));

  // -----------------------------------------------------------------
  // 6. MESH
  // -----------------------------------------------------------------
  const geometry = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  scene.add(mesh);

  return {
    reset() {
      renderer.compute(initCompute);
    },
    stepSimulation() {
      renderer.compute(stepCompute);
    }
  };
}
