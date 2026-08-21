import * as THREE from 'three/webgpu';

import {
    Fn,
    If,
    float,
    vec3,
    uniform,
    instancedArray,
    instanceIndex,
    hash,
    smoothstep,
    sin,
    cos,
    mix
} from 'three/tsl';

export function createSimulation({
    renderer,
    scene,
    params,
    count
}) {

    // ============================================================
    // BUFFERS GPU
    // ============================================================

    const positionBuffer = instancedArray(count, 'vec3');
    const velocityBuffer = instancedArray(count, 'vec3');

    // ============================================================
    // UNIFORMS (Instanciados directamente en WebGPU)
    // ============================================================

    const currentCenter = uniform(params.currentCenter.value.clone());
    const currentDirection = uniform(params.currentDirection.value.clone());
    const currentStrength = uniform(params.currentStrength.value);
    const currentRadius = uniform(params.currentRadius.value);
    const currentEnabled = uniform(params.currentEnabled.value);

    const dragCoefficient = uniform(params.dragCoefficient.value);
    const dragEnabled = uniform(params.dragEnabled.value);

    const radialStrength = uniform(params.radialStrength.value);
    const radialEnabled = uniform(params.radialEnabled.value);
    const radialSoftness = uniform(params.radialSoftness.value);

    const vortexStrength = uniform(params.vortexStrength.value);
    const vortexEnabled = uniform(params.vortexEnabled.value);
    const vortexSoftness = uniform(params.vortexSoftness.value);

    const wind = uniform(params.wind.value.clone());
    const windEnabled = uniform(params.windEnabled.value);

    const curlEnabled = uniform(params.curlEnabled.value);
    const curlStrength = uniform(params.curlStrength.value);
    const noiseScale = uniform(params.noiseScale.value);
    const noiseSpeed = uniform(params.noiseSpeed.value);

    const dt = uniform(params.timeStep.value);
    const maxSpeed = uniform(params.maxSpeed.value);
    const bounds = uniform(params.bounds.value.clone());

    // ============================================================
    // RESET COMPUTE (Distribución Esférica Orgánica)
    // ============================================================

    const resetCompute = Fn(() => {
        const index = float(instanceIndex);

        const u = hash(index.mul(12.9898));
        const v = hash(index.mul(78.233));
        const radius = hash(index.mul(37.719)).mul(3.5);

        const theta = u.mul(Math.PI * 2.0);
        const phi = v.sub(0.5).mul(Math.PI);

        const px = radius.mul(cos(phi)).mul(cos(theta));
        const py = radius.mul(cos(phi)).mul(sin(theta));
        const pz = radius.mul(sin(phi));

        const randomPosition = vec3(px, py, pz);

        const speed = float(params.initialSpeed.value);
        const initialVelocity = vec3(
            hash(index.mul(15.1)).sub(0.5),
            hash(index.mul(26.2)).sub(0.5),
            hash(index.mul(43.3)).sub(0.5)
        ).normalize().mul(speed);

        positionBuffer.element(instanceIndex).assign(randomPosition);
        velocityBuffer.element(instanceIndex).assign(initialVelocity);

    })().compute(count);

    // ============================================================
    // SIMULATION COMPUTE (Física Personalizada)
    // ============================================================

    const computeSimulation = Fn(() => {
        const position = positionBuffer.element(instanceIndex);
        const velocity = velocityBuffer.element(instanceIndex);

        const acceleration = vec3(0, 0, 0).toVar();

        // 1. Corriente local
        const toParticle = position.sub(currentCenter);
        const distance = toParticle.length();
        const influence = float(1.0).sub(
            smoothstep(currentRadius.mul(0.2), currentRadius, distance)
        );

        acceleration.addAssign(
            currentDirection.mul(currentStrength).mul(influence).mul(currentEnabled)
        );

        // 2. Drag
        acceleration.addAssign(
            velocity.mul(dragCoefficient).negate().mul(dragEnabled)
        );

        // 3. Atracción / Repulsión Radial
        const radialVector = currentCenter.sub(position);
        const radialDistance = radialVector.length();
        const radialDenominator = radialDistance.mul(radialDistance).add(radialSoftness.mul(radialSoftness)).add(0.001);

        acceleration.addAssign(
            radialVector.mul(radialStrength).div(radialDenominator).mul(radialEnabled)
        );

        // 4. Vórtice Hiperbólico Trifásico
        const perpendicular = vec3(
            radialVector.y.negate().add(sin(position.z)),
            radialVector.x.sub(cos(position.z)),
            sin(radialDistance)
        );
        const vortexDenominator = radialDistance.add(vortexSoftness).add(0.001);

        acceleration.addAssign(
            perpendicular.mul(vortexStrength).div(vortexDenominator).mul(vortexEnabled)
        );

        // 5. Viento
        acceleration.addAssign(wind.mul(windEnabled));

        // 6. Campo Armónico Oscilatorio (Turbulencia)
        const np = position.mul(noiseScale);
        const harmonicNoise = vec3(
            sin(np.y.mul(1.5).add(noiseSpeed)).add(cos(np.z.mul(0.8))),
            cos(np.z.mul(1.2).add(noiseSpeed)).add(sin(np.x.mul(1.1))),
            sin(np.x.mul(0.9).add(noiseSpeed)).add(cos(np.y.mul(1.3)))
        );

        acceleration.addAssign(
            harmonicNoise.mul(curlStrength).mul(curlEnabled)
        );

        // Integración Euler
        velocity.addAssign(acceleration.mul(dt));

        // Límite de velocidad
        const speed = velocity.length();
        If(speed.greaterThan(maxSpeed), () => {
            velocity.assign(velocity.normalize().mul(maxSpeed));
        });

        // Actualización de posición
        position.addAssign(velocity.mul(dt));

        // Colisión en límites con amortiguamiento
        If(position.x.greaterThan(bounds.value.x), () => { position.x.assign(bounds.value.x); velocity.x.assign(velocity.x.negate().mul(0.8)); });
        If(position.x.lessThan(bounds.value.x.negate()), () => { position.x.assign(bounds.value.x.negate()); velocity.x.assign(velocity.x.negate().mul(0.8)); });
        If(position.y.greaterThan(bounds.value.y), () => { position.y.assign(bounds.value.y); velocity.y.assign(velocity.y.negate().mul(0.8)); });
        If(position.y.lessThan(bounds.value.y.negate()), () => { position.y.assign(bounds.value.y.negate()); velocity.y.assign(velocity.y.negate().mul(0.8)); });
        If(position.z.greaterThan(bounds.value.z), () => { position.z.assign(bounds.value.z); velocity.z.assign(velocity.z.negate().mul(0.8)); });
        If(position.z.lessThan(bounds.value.z.negate()), () => { position.z.assign(bounds.value.z.negate()); velocity.z.assign(velocity.z.negate().mul(0.8)); });

    })().compute(count);

    // ============================================================
    // MATERIAL Y SHADER DE COLOR DINÁMICO
    // ============================================================

    const particleMaterial = new THREE.SpriteNodeMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    particleMaterial.positionNode = positionBuffer.toAttribute();
    particleMaterial.scaleNode = params.particleSize.value;

    const currentVel = velocityBuffer.toAttribute();
    const velSpeed = currentVel.length().div(maxSpeed);

    const baseColor = vec3(0.25, 0.02, 0.55); 
    const fastColor = vec3(1.0, 0.05, 0.25);  

    particleMaterial.colorNode = mix(baseColor, fastColor, smoothstep(0.05, 0.7, velSpeed));

    // ============================================================
    // INSTANCIACIÓN
    // ============================================================

    const particles = new THREE.Sprite(particleMaterial);
    particles.count = count;
    scene.add(particles);

    // Ejecutar el reset inicial sin congelar
    renderer.computeAsync(resetCompute);

    // ============================================================
    // MÉTODOS DE CONTROL SUAVES (SIN RE-COMPUTAR EN CPU)
    // ============================================================

    function updateUniforms() {
        // Copia segura de componentes Vector3 sin instanciar nuevos objetos
        if (params.currentCenter?.value) currentCenter.value.copy(params.currentCenter.value);
        if (params.currentDirection?.value) currentDirection.value.copy(params.currentDirection.value);
        if (params.wind?.value) wind.value.copy(params.wind.value);
        if (params.bounds?.value) bounds.value.copy(params.bounds.value);

        // Asignación rápida de escalares
        currentStrength.value = params.currentStrength.value;
        currentRadius.value = params.currentRadius.value;
        currentEnabled.value = params.currentEnabled.value ? 1.0 : 0.0;

        dragCoefficient.value = params.dragCoefficient.value;
        dragEnabled.value = params.dragEnabled.value ? 1.0 : 0.0;

        radialStrength.value = params.radialStrength.value;
        radialEnabled.value = params.radialEnabled.value ? 1.0 : 0.0;
        radialSoftness.value = params.radialSoftness.value;

        vortexStrength.value = params.vortexStrength.value;
        vortexEnabled.value = params.vortexEnabled.value ? 1.0 : 0.0;
        vortexSoftness.value = params.vortexSoftness.value;

        windEnabled.value = params.windEnabled.value ? 1.0 : 0.0;

        curlEnabled.value = params.curlEnabled.value ? 1.0 : 0.0;
        curlStrength.value = params.curlStrength.value;
        noiseScale.value = params.noiseScale.value;
        noiseSpeed.value = params.noiseSpeed.value;

        dt.value = params.timeStep.value;
        maxSpeed.value = params.maxSpeed.value;
    }

    function reset() {
        updateUniforms();
        renderer.computeAsync(resetCompute);
    }

    // `stepSimulation` ahora es ultra liviano
    function stepSimulation() {
        updateUniforms();
    }

    return {
        positionBuffer,
        velocityBuffer,
        reset,
        stepSimulation,
        computeSimulation,
        resetCompute,
        particles,
        uniforms: {
            currentCenter,
            currentDirection,
            currentStrength,
            currentRadius,
            currentEnabled,
            dragCoefficient,
            dragEnabled,
            radialStrength,
            radialEnabled,
            vortexStrength,
            vortexEnabled,
            wind,
            windEnabled,
            curlEnabled,
            curlStrength,
            noiseScale,
            noiseSpeed,
            dt,
            maxSpeed,
            bounds
        }
    };
}
