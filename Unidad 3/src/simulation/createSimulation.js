import * as THREE from 'three/webgpu';

import {
    Fn,
    If,
    float,
    vec3,
    uniform,
    instancedArray,
    instanceIndex,
    curlNoise,
    hash,
    smoothstep
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
        instancedArray(
            count,
            'vec3'
        );

    const velocityBuffer =
        instancedArray(
            count,
            'vec3'
        );

    // ============================================================
    // UNIFORMS
    // ============================================================

    const currentCenter =
        uniform(
            params.currentCenter.value
        );

    const currentDirection =
        uniform(
            params.currentDirection.value
        );

    const currentStrength =
        uniform(
            params.currentStrength.value
        );

    const currentRadius =
        uniform(
            params.currentRadius.value
        );

    const currentEnabled =
        uniform(
            params.currentEnabled.value
        );

    const dragCoefficient =
        uniform(
            params.dragCoefficient.value
        );

    const dragEnabled =
        uniform(
            params.dragEnabled.value
        );

    const radialStrength =
        uniform(
            params.radialStrength.value
        );

    const radialEnabled =
        uniform(
            params.radialEnabled.value
        );

    const radialSoftness =
        uniform(
            params.radialSoftness.value
        );

    const vortexStrength =
        uniform(
            params.vortexStrength.value
        );

    const vortexEnabled =
        uniform(
            params.vortexEnabled.value
        );

    const vortexSoftness =
        uniform(
            params.vortexSoftness.value
        );

    const wind =
        uniform(
            params.wind.value
        );

    const windEnabled =
        uniform(
            params.windEnabled.value
        );

    const curlEnabled =
        uniform(
            params.curlEnabled.value
        );

    const curlStrength =
        uniform(
            params.curlStrength.value
        );

    const noiseScale =
        uniform(
            params.noiseScale.value
        );

    const noiseSpeed =
        uniform(
            params.noiseSpeed.value
        );

    const dt =
        uniform(
            params.timeStep.value
        );

    const maxSpeed =
        uniform(
            params.maxSpeed.value
        );

    const bounds =
        uniform(
            params.bounds.value
        );

    // ============================================================
    // RESET COMPUTE
    // ============================================================

    const resetCompute = Fn(() => {

        const index =
            float(instanceIndex);

        const px =
            hash(
                index.mul(12.9898)
            )
            .mul(2.0)
            .sub(1.0)
            .mul(4.5);

        const py =
            hash(
                index.mul(78.233)
            )
            .mul(2.0)
            .sub(1.0)
            .mul(2.8);

        const pz =
            hash(
                index.mul(37.719)
            )
            .mul(2.0)
            .sub(1.0)
            .mul(2.0);

        const randomPosition =
            vec3(
                px,
                py,
                pz
            );

        const angle =
            hash(
                index.mul(17.231)
            )
            .mul(Math.PI * 2);

        const randomSpeed =
            float(
                params.initialSpeed.value
            );

        const initialVelocity =
            vec3(
                angle.cos(),
                angle.sin(),
                0
            )
            .mul(randomSpeed);

        positionBuffer
            .element(instanceIndex)
            .assign(
                randomPosition
            );

        velocityBuffer
            .element(instanceIndex)
            .assign(
                initialVelocity
            );

    })().compute(count);

    // ============================================================
    // SIMULATION COMPUTE
    // ============================================================

    const computeSimulation = Fn(() => {

        // --------------------------------------------------------
        // ESTADO
        // --------------------------------------------------------

        const position =
            positionBuffer.element(
                instanceIndex
            );

        const velocity =
            velocityBuffer.element(
                instanceIndex
            );

        // --------------------------------------------------------
        // ACELERACIÓN TOTAL
        // --------------------------------------------------------

        const acceleration =
            vec3(
                0,
                0,
                0
            ).toVar();

        // ========================================================
        // 1. CORRIENTE LOCAL
        //
        // Esta es la fuerza principal de nuestro instrumento.
        //
        // El puntero define el centro.
        // El movimiento del puntero define la dirección.
        // ========================================================

        const toParticle =
            position
                .sub(currentCenter);

        const distance =
            toParticle.length();

        const influence =
            float(1.0)
                .sub(
                    smoothstep(
                        currentRadius.mul(0.25),
                        currentRadius,
                        distance
                    )
                );

        const currentForce =
            currentDirection
                .mul(currentStrength)
                .mul(influence)
                .mul(currentEnabled);

        acceleration.addAssign(
            currentForce
        );

        // ========================================================
        // 2. DRAG
        //
        // F_drag = -c * v
        // ========================================================

        const dragForce =
            velocity
                .mul(
                    dragCoefficient
                )
                .negate();

        acceleration.addAssign(
            dragForce.mul(
                dragEnabled
            )
        );

        // ========================================================
        // 3. ATRACCIÓN / REPULSIÓN RADIAL
        //
        // F = k*r / (|r|^3 + s^2)
        // ========================================================

        const radialVector =
            currentCenter
                .sub(position);

        const radialDistance =
            radialVector.length();

        const radialDenominator =
            radialDistance
                .mul(radialDistance)
                .mul(radialDistance)
                .add(
                    radialSoftness
                        .mul(radialSoftness)
                )
                .add(0.0001);

        const radialForce =
            radialVector
                .mul(radialStrength)
                .div(
                    radialDenominator
                )
                .mul(radialEnabled);

        acceleration.addAssign(
            radialForce
        );

        // ========================================================
        // 4. VÓRTICE
        //
        // r_perp = (-r.y, r.x, 0)
        //
        // F = alpha * r_perp / (|r| + s)
        // ========================================================

        const perpendicular =
            vec3(
                radialVector.y.negate(),
                radialVector.x,
                0
            );

        const vortexDenominator =
            radialDistance
                .add(
                    vortexSoftness
                )
                .add(0.0001);

        const vortexForce =
            perpendicular
                .mul(vortexStrength)
                .div(
                    vortexDenominator
                )
                .mul(vortexEnabled);

        acceleration.addAssign(
            vortexForce
        );

        // ========================================================
        // 5. VIENTO CONSTANTE
        // ========================================================

        acceleration.addAssign(
            wind.mul(
                windEnabled
            )
        );

        // ========================================================
        // 6. CURL NOISE
        //
        // Campo de divergencia aproximadamente cero.
        // ========================================================

        const noisePosition =
            position
                .mul(noiseScale);

        const curl =
            curlNoise(
                noisePosition
                    .add(
                        vec3(
                            0,
                            0,
                            noiseSpeed
                        )
                    )
            );

        acceleration.addAssign(
            curl
                .mul(curlStrength)
                .mul(curlEnabled)
        );

        // ========================================================
        // EULER SEMIIMPLÍCITO
        //
        // v = v + a * dt
        // p = p + v * dt
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
            speed.greaterThan(
                maxSpeed
            ),
            () => {

                velocity.assign(
                    velocity
                        .normalize()
                        .mul(maxSpeed)
                );

            }
        );

        // ========================================================
        // ACTUALIZACIÓN DE POSICIÓN
        // ========================================================

        position.addAssign(
            velocity.mul(dt)
        );

        // ========================================================
        // REFLEXIÓN EN LOS LÍMITES
        // ========================================================

        If(
            position.x
                .greaterThan(
                    bounds.x
                ),
            () => {

                position.x.assign(
                    bounds.x
                );

                velocity.x.assign(
                    velocity.x.negate()
                );

            }
        );

        If(
            position.x
                .lessThan(
                    bounds.x.negate()
                ),
            () => {

                position.x.assign(
                    bounds.x.negate()
                );

                velocity.x.assign(
                    velocity.x.negate()
                );

            }
        );

        If(
            position.y
                .greaterThan(
                    bounds.y
                ),
            () => {

                position.y.assign(
                    bounds.y
                );

                velocity.y.assign(
                    velocity.y.negate()
                );

            }
        );

        If(
            position.y
                .lessThan(
                    bounds.y.negate()
                ),
            () => {

                position.y.assign(
                    bounds.y.negate()
                );

                velocity.y.assign(
                    velocity.y.negate()
                );

            }
        );

        If(
            position.z
                .greaterThan(
                    bounds.z
                ),
            () => {

                position.z.assign(
                    bounds.z
                );

                velocity.z.assign(
                    velocity.z.negate()
                );

            }
        );

        If(
            position.z
                .lessThan(
                    bounds.z.negate()
                ),
            () => {

                position.z.assign(
                    bounds.z.negate()
                );

                velocity.z.assign(
                    velocity.z.negate()
                );

            }
        );

    })().compute(count);

    // ============================================================
    // MATERIAL DE PARTÍCULAS
    // ============================================================

    const particleMaterial =
        new THREE.SpriteNodeMaterial({
            transparent: true,
            depthWrite: false
        });

    /*
     * El buffer de posiciones calculado por Compute
     * se utiliza directamente para renderizar.
     */

    particleMaterial.positionNode =
        positionBuffer.toAttribute();

    particleMaterial.scaleNode =
        params.particleSize.value;

    particleMaterial.colorNode =
        uniform(
            new THREE.Color('#d7f4ff')
        );

    // ============================================================
    // SPRITE INSTANCIADO
    // ============================================================

    const particles =
        new THREE.Sprite(
            particleMaterial
        );

    particles.count =
        count;

    scene.add(
        particles
    );

    // ============================================================
    // ACTUALIZAR UNIFORMS
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
    // API
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