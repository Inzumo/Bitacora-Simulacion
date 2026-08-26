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

    const positionBuffer =
        instancedArray(count, 'vec3');

    const velocityBuffer =
        instancedArray(count, 'vec3');


    // ============================================================
    // UNIFORMS
    // ============================================================

    const currentCenter =
        uniform(params.currentCenter.value);

    const currentDirection =
        uniform(params.currentDirection.value);

    const currentStrength =
        uniform(params.currentStrength.value);

    const currentRadius =
        uniform(params.currentRadius.value);

    const currentEnabled =
        uniform(params.currentEnabled.value);


    const dragCoefficient =
        uniform(params.dragCoefficient.value);

    const dragEnabled =
        uniform(params.dragEnabled.value);


    const radialStrength =
        uniform(params.radialStrength.value);

    const radialEnabled =
        uniform(params.radialEnabled.value);

    const radialSoftness =
        uniform(params.radialSoftness.value);


    const vortexStrength =
        uniform(params.vortexStrength.value);

    const vortexEnabled =
        uniform(params.vortexEnabled.value);

    const vortexSoftness =
        uniform(params.vortexSoftness.value);


    const wind =
        uniform(params.wind.value);

    const windEnabled =
        uniform(params.windEnabled.value);


    const curlEnabled =
        uniform(params.curlEnabled.value);

    const curlStrength =
        uniform(params.curlStrength.value);

    const noiseScale =
        uniform(params.noiseScale.value);

    const noiseSpeed =
        uniform(params.noiseSpeed.value);


    const dt =
        uniform(params.timeStep.value);

    const maxSpeed =
        uniform(params.maxSpeed.value);

    const bounds =
        uniform(params.bounds.value);


    // ============================================================
    // RESET
    // ============================================================

    const resetCompute = Fn(() => {

        const index =
            float(instanceIndex);


        // Distribución pseudoaleatoria

        const u =
            hash(index.mul(12.9898));

        const v =
            hash(index.mul(78.233));

        const radius =
            hash(index.mul(37.719))
                .mul(3.5);


        const theta =
            u.mul(Math.PI * 2.0);

        const phi =
            v.sub(0.5)
                .mul(Math.PI);


        const px =
            radius
                .mul(cos(phi))
                .mul(cos(theta));

        const py =
            radius
                .mul(cos(phi))
                .mul(sin(theta));

        const pz =
            radius
                .mul(sin(phi));


        const randomPosition =
            vec3(
                px,
                py,
                pz
            );


        // Velocidad inicial

        const speed =
            float(params.initialSpeed.value);

        const initialVelocity =
            vec3(
                hash(index.mul(15.1)).sub(0.5),
                hash(index.mul(26.2)).sub(0.5),
                hash(index.mul(43.3)).sub(0.5)
            )
            .normalize()
            .mul(speed);


        positionBuffer
            .element(instanceIndex)
            .assign(randomPosition);


        velocityBuffer
            .element(instanceIndex)
            .assign(initialVelocity);

    })().compute(count);


    // ============================================================
    // SIMULACIÓN
    // ============================================================

    const computeSimulation = Fn(() => {

        const position =
            positionBuffer.element(instanceIndex);

        const velocity =
            velocityBuffer.element(instanceIndex);


        const acceleration =
            vec3(0, 0, 0).toVar();


        // ========================================================
        // 1. CORRIENTE LOCAL
        // ========================================================

        const toParticle =
            position.sub(currentCenter);

        const distance =
            toParticle.length();


        const influence =
            float(1.0).sub(
                smoothstep(
                    currentRadius.mul(0.2),
                    currentRadius,
                    distance
                )
            );


        acceleration.addAssign(
            currentDirection
                .mul(currentStrength)
                .mul(influence)
                .mul(currentEnabled)
        );


        // ========================================================
        // 2. DRAG
        // ========================================================

        acceleration.addAssign(
            velocity
                .mul(dragCoefficient)
                .negate()
                .mul(dragEnabled)
        );


        // ========================================================
        // 3. ATRACCIÓN / REPULSIÓN
        // ========================================================

        const radialVector =
            currentCenter.sub(position);

        const radialDistance =
            radialVector.length();


        const radialDenominator =
            radialDistance
                .mul(radialDistance)
                .add(
                    radialSoftness
                        .mul(radialSoftness)
                )
                .add(0.001);


        acceleration.addAssign(
            radialVector
                .mul(radialStrength)
                .div(radialDenominator)
                .mul(radialEnabled)
        );


        // ========================================================
        // 4. VÓRTICE
        // ========================================================

        const perpendicular =
            vec3(
                radialVector.y
                    .negate()
                    .add(sin(position.z)),

                radialVector.x
                    .sub(cos(position.z)),

                sin(radialDistance)
            );


        const vortexDenominator =
            radialDistance
                .add(vortexSoftness)
                .add(0.001);


        acceleration.addAssign(
            perpendicular
                .mul(vortexStrength)
                .div(vortexDenominator)
                .mul(vortexEnabled)
        );


        // ========================================================
        // 5. VIENTO
        // ========================================================

        acceleration.addAssign(
            wind.mul(windEnabled)
        );


        // ========================================================
        // 6. CAMPO ARMÓNICO
        // ========================================================

        const np =
            position.mul(noiseScale);


        const harmonicNoise =
            vec3(

                sin(
                    np.y.mul(1.5)
                        .add(noiseSpeed)
                )
                .add(
                    cos(
                        np.z.mul(0.8)
                    )
                ),

                cos(
                    np.z.mul(1.2)
                        .add(noiseSpeed)
                )
                .add(
                    sin(
                        np.x.mul(1.1)
                    )
                ),

                sin(
                    np.x.mul(0.9)
                        .add(noiseSpeed)
                )
                .add(
                    cos(
                        np.y.mul(1.3)
                    )
                )
            );


        acceleration.addAssign(
            harmonicNoise
                .mul(curlStrength)
                .mul(curlEnabled)
        );


        // ========================================================
        // INTEGRACIÓN EULER
        // ========================================================

        velocity.addAssign(
            acceleration.mul(dt)
        );


        // ========================================================
        // LÍMITE DE VELOCIDAD
        // ========================================================

        const speed =
            velocity.length();


        If(
            speed.greaterThan(maxSpeed),
            () => {

                velocity.assign(
                    velocity
                        .normalize()
                        .mul(maxSpeed)
                );

            }
        );


        // ========================================================
        // POSICIÓN
        // ========================================================

        position.addAssign(
            velocity.mul(dt)
        );


        // ========================================================
        // LÍMITES
        // ========================================================

        If(
            position.x.greaterThan(bounds.x),
            () => {
                position.x.assign(bounds.x);

                velocity.x.assign(
                    velocity.x
                        .negate()
                        .mul(0.8)
                );
            }
        );


        If(
            position.x.lessThan(bounds.x.negate()),
            () => {
                position.x.assign(
                    bounds.x.negate()
                );

                velocity.x.assign(
                    velocity.x
                        .negate()
                        .mul(0.8)
                );
            }
        );


        If(
            position.y.greaterThan(bounds.y),
            () => {
                position.y.assign(bounds.y);

                velocity.y.assign(
                    velocity.y
                        .negate()
                        .mul(0.8)
                );
            }
        );


        If(
            position.y.lessThan(bounds.y.negate()),
            () => {
                position.y.assign(
                    bounds.y.negate()
                );

                velocity.y.assign(
                    velocity.y
                        .negate()
                        .mul(0.8)
                );
            }
        );


        If(
            position.z.greaterThan(bounds.z),
            () => {
                position.z.assign(bounds.z);

                velocity.z.assign(
                    velocity.z
                        .negate()
                        .mul(0.8)
                );
            }
        );


        If(
            position.z.lessThan(bounds.z.negate()),
            () => {
                position.z.assign(
                    bounds.z.negate()
                );

                velocity.z.assign(
                    velocity.z
                        .negate()
                        .mul(0.8)
                );
            }
        );

    })().compute(count);


    // ============================================================
    // MATERIAL
    // ============================================================

    const particleMaterial =
        new THREE.SpriteNodeMaterial({

            transparent: true,

            depthWrite: false,

            blending:
                THREE.AdditiveBlending
        });


    // ============================================================
    // POSICIÓN
    // ============================================================

    particleMaterial.positionNode =
        positionBuffer.toAttribute();


    // ============================================================
    // VELOCIDAD
    // ============================================================

    const currentVel =
        velocityBuffer.toAttribute();


    const velSpeed =
        currentVel
            .length()
            .div(maxSpeed);


    // ============================================================
    // TAMAÑO DINÁMICO
    // ============================================================

    const particleScale =
        mix(
            float(0.055),
            float(0.13),
            smoothstep(
                0.05,
                0.8,
                velSpeed
            )
        );


    particleMaterial.scaleNode =
        particleScale;


    // ============================================================
    // COLOR
    // ============================================================

    const slowColor =
        vec3(
            0.18,
            0.02,
            0.45
        );


    const mediumColor =
        vec3(
            0.55,
            0.03,
            0.85
        );


    const fastColor =
        vec3(
            1.0,
            0.08,
            0.22
        );


    const mediumMix =
        smoothstep(
            0.05,
            0.45,
            velSpeed
        );


    const fastMix =
        smoothstep(
            0.45,
            0.9,
            velSpeed
        );


    const colorSlowMedium =
        mix(
            slowColor,
            mediumColor,
            mediumMix
        );


    const finalColor =
        mix(
            colorSlowMedium,
            fastColor,
            fastMix
        );


    particleMaterial.colorNode =
        finalColor;


    // ============================================================
    // INSTANCIA
    // ============================================================

    const particles =
        new THREE.Sprite(
            particleMaterial
        );


    particles.count =
        count;


    scene.add(particles);


    // ============================================================
    // UNIFORMS
    // ============================================================

    function updateUniforms() {

        currentCenter.value.copy(
            params.currentCenter.value
        );

        currentDirection.value.copy(
            params.currentDirection.value
        );

        currentStrength.value =
            params.currentStrength.value;

        currentRadius.value =
            params.currentRadius.value;

        currentEnabled.value =
            params.currentEnabled.value;


        dragCoefficient.value =
            params.dragCoefficient.value;

        dragEnabled.value =
            params.dragEnabled.value;


        radialStrength.value =
            params.radialStrength.value;

        radialEnabled.value =
            params.radialEnabled.value;

        radialSoftness.value =
            params.radialSoftness.value;


        vortexStrength.value =
            params.vortexStrength.value;

        vortexEnabled.value =
            params.vortexEnabled.value;

        vortexSoftness.value =
            params.vortexSoftness.value;


        wind.value.copy(
            params.wind.value
        );

        windEnabled.value =
            params.windEnabled.value;


        curlEnabled.value =
            params.curlEnabled.value;

        curlStrength.value =
            params.curlStrength.value;

        noiseScale.value =
            params.noiseScale.value;

        noiseSpeed.value =
            params.noiseSpeed.value;


        dt.value =
            params.timeStep.value;

        maxSpeed.value =
            params.maxSpeed.value;

        bounds.value.copy(
            params.bounds.value
        );
    }


    // ============================================================
    // RESET
    // ============================================================

    function reset() {

        updateUniforms();

        renderer.computeAsync(
            resetCompute
        );
    }


    // ============================================================
    // STEP
    // ============================================================

    function stepSimulation() {

        updateUniforms();

        renderer.compute(
            computeSimulation
        );
    }


    // ============================================================
    // RETURN
    // ============================================================

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
