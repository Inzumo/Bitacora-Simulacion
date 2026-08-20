import * as THREE from 'three/webgpu';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import WebGPU from 'three/addons/capabilities/WebGPU.js';

import './styles.css';

import { createParameters } from './simulation/parameters.js';

import { createSimulation } from './simulation/createSimulation.js';

import { createLabPanel } from './ui/labPanel.js';


// ================================================================
// CONFIGURACIÓN
// ================================================================
//
// Empieza con 5000.
// Cuando compruebes que funciona:
//
// 5000
// 20000
// 65536
// 131072
//
// ================================================================

const PARTICLE_COUNT = 5000;


// ================================================================
// MAIN
// ================================================================

async function main() {

    const mount =
        document.querySelector(
            '#app'
        );

    // ============================================================
    // WEBGPU
    // ============================================================

    if (
        !WebGPU.isAvailable()
    ) {

        mount.appendChild(
            WebGPU.getErrorMessage()
        );

        throw new Error(
            'Este proyecto requiere WebGPU.'
        );

    }

    // ============================================================
    // ESCENA
    // ============================================================

    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            '#050607'
        );

    // ============================================================
    // CÁMARA
    // ============================================================

    const camera =
        new THREE.PerspectiveCamera(
            50,
            innerWidth / innerHeight,
            0.05,
            100
        );

    camera.position.set(
        0,
        0,
        11
    );

    // ============================================================
    // RENDERER
    // ============================================================

    const renderer =
        new THREE.WebGPURenderer({
            antialias: true
        });

    renderer.setPixelRatio(
        Math.min(
            devicePixelRatio,
            2
        )
    );

    renderer.setSize(
        innerWidth,
        innerHeight
    );

    mount.appendChild(
        renderer.domElement
    );

    await renderer.init();

    // ============================================================
    // ORBIT CONTROLS
    // ============================================================

    const orbit =
        new OrbitControls(
            camera,
            renderer.domElement
        );

    orbit.enableDamping = true;

    orbit.target.set(
        0,
        0,
        0
    );

    // ============================================================
    // PARÁMETROS
    // ============================================================

    const params =
        createParameters();

    // ============================================================
    // SIMULACIÓN
    // ============================================================

    const simulation =
        createSimulation({

            renderer,

            scene,

            params,

            count:
                PARTICLE_COUNT

        });

    // ============================================================
    // AYUDAS VISUALES
    // ============================================================

    const currentHelper =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.10,
                16,
                12
            ),

            new THREE.MeshBasicMaterial({
                color:
                    '#ffffff'
            })

        );

    scene.add(
        currentHelper
    );

    const axes =
        new THREE.AxesHelper(
            1.5
        );

    scene.add(
        axes
    );

    // ============================================================
    // POINTER
    // ============================================================

    const pointerNdc =
        new THREE.Vector2();

    const raycaster =
        new THREE.Raycaster();

    const interactionPlane =
        new THREE.Plane(
            new THREE.Vector3(
                0,
                0,
                1
            ),
            0
        );

    const currentWorld =
        new THREE.Vector3();

    const previousWorld =
        new THREE.Vector3();

    const gesture =
        new THREE.Vector3();

    let hasPreviousPoint =
        false;

    // ============================================================
    // MOUSE → CORRIENTE
    // ============================================================

    addEventListener(
        'pointermove',
        (event) => {

            pointerNdc.x =
                (
                    event.clientX /
                    innerWidth
                ) * 2 - 1;

            pointerNdc.y =
                -(
                    event.clientY /
                    innerHeight
                ) * 2 + 1;

            raycaster.setFromCamera(
                pointerNdc,
                camera
            );

            const hit =
                raycaster.ray
                    .intersectPlane(
                        interactionPlane,
                        currentWorld
                    );

            if (!hit) {
                return;
            }

            // ----------------------------------------------------
            // PRIMER MOVIMIENTO
            // ----------------------------------------------------

            if (
                !hasPreviousPoint
            ) {

                previousWorld.copy(
                    currentWorld
                );

                hasPreviousPoint =
                    true;

                gesture.set(
                    0,
                    0,
                    0
                );

            } else {

                // ------------------------------------------------
                // DIRECCIÓN DEL GESTO
                // ------------------------------------------------

                gesture
                    .copy(
                        currentWorld
                    )
                    .sub(
                        previousWorld
                    );

                // ------------------------------------------------
                // LIMITAR VELOCIDAD
                // ------------------------------------------------

                const maxGesture =
                    0.30;

                if (
                    gesture.length() >
                    maxGesture
                ) {

                    gesture
                        .normalize()
                        .multiplyScalar(
                            maxGesture
                        );

                }

                previousWorld.copy(
                    currentWorld
                );

            }

            // ----------------------------------------------------
            // CENTRO DE LA CORRIENTE
            // ----------------------------------------------------

            params.currentCenter.value.copy(
                currentWorld
            );

            // ----------------------------------------------------
            // DIRECCIÓN DE LA CORRIENTE
            // ----------------------------------------------------

            params.currentDirection.value.copy(
                gesture
            );

            currentHelper.position.copy(
                currentWorld
            );

        }
    );

    // ============================================================
    // ESTADO
    // ============================================================

    let paused =
        false;

    let mode =
        'LAB';

    let panel;

    // ============================================================
    // HUD
    // ============================================================

    const hud =
        document.createElement(
            'div'
        );

    hud.className =
        'hud';

    document.body.append(
        hud
    );

    // ============================================================
    // PRESETS
    // ============================================================

    const applyPreset =
        (id) => {

            // ----------------------------------------------------
            // APAGAR FUERZAS
            // ----------------------------------------------------

            params.currentEnabled.value =
                0;

            params.windEnabled.value =
                0;

            params.radialEnabled.value =
                0;

            params.vortexEnabled.value =
                0;

            params.curlEnabled.value =
                0;

            params.dragEnabled.value =
                0;

            params.wind.value.set(
                0,
                0,
                0
            );

            params.initialSpeed.value =
                0;

            // ----------------------------------------------------
            // INERCIA
            // ----------------------------------------------------

            if (
                id === 'inertia'
            ) {

                params.initialSpeed.value =
                    0.8;

            }

            // ----------------------------------------------------
            // VIENTO
            // ----------------------------------------------------

            else if (
                id === 'wind'
            ) {

                params.windEnabled.value =
                    1;

                params.wind.value.set(
                    1.5,
                    0,
                    0
                );

            }

            // ----------------------------------------------------
            // ATRACCIÓN
            // ----------------------------------------------------

            else if (
                id === 'attract'
            ) {

                params.radialEnabled.value =
                    1;

                params.radialStrength.value =
                    3.0;

            }

            // ----------------------------------------------------
            // REPULSIÓN
            // ----------------------------------------------------

            else if (
                id === 'repel'
            ) {

                params.radialEnabled.value =
                    1;

                params.radialStrength.value =
                    -3.0;

            }

            // ----------------------------------------------------
            // VÓRTICE
            // ----------------------------------------------------

            else if (
                id === 'vortex'
            ) {

                params.radialEnabled.value =
                    1;

                params.radialStrength.value =
                    1.0;

                params.vortexEnabled.value =
                    1;

                params.vortexStrength.value =
                    3.0;

                params.dragEnabled.value =
                    1;

                params.dragCoefficient.value =
                    0.08;

            }

            // ----------------------------------------------------
            // RESET
            // ----------------------------------------------------

            simulation.reset();

            panel?.refresh();

        };

    // ============================================================
    // MODO
    // ============================================================

    const setMode =
        (next) => {

            mode =
                next;

            const lab =
                mode === 'LAB';

            panel.setVisible(
                lab
            );

            axes.visible =
                lab;

            currentHelper.visible =
                lab;

            orbit.enabled =
                lab;

            if (lab) {

                hud.innerHTML =
                    `
                    <strong>LAB</strong>
                    · P: PERFORMANCE
                    · R: RESET
                    · 1–5: pruebas
                    `;

            } else {

                hud.innerHTML =
                    `
                    <strong>CORRIENTE</strong>
                    · mueve el puntero
                    · interpreta con el gesto
                    `;

            }

        };

    // ============================================================
    // PANEL
    // ============================================================

    panel =
        createLabPanel({

            params,

            onReset:
                () => {

                    simulation.reset();

                },

            onPreset:
                applyPreset,

            onModeChange:
                () => {

                    setMode(
                        mode === 'LAB'
                            ? 'PERFORMANCE'
                            : 'LAB'
                    );

                },

            onPauseChange:
                () => {

                    paused =
                        !paused;

                }

        });

    // ============================================================
    // INICIAR EN LAB
    // ============================================================

    setMode(
        'LAB'
    );

    // ============================================================
    // TECLADO
    // ============================================================

    addEventListener(
        'keydown',
        (event) => {

            if (
                event.repeat
            ) {
                return;
            }

            // ----------------------------------------------------
            // P → CAMBIAR MODO
            // ----------------------------------------------------

            if (
                event.code ===
                'KeyP'
            ) {

                setMode(
                    mode === 'LAB'
                        ? 'PERFORMANCE'
                        : 'LAB'
                );

            }

            // ----------------------------------------------------
            // R → RESET
            // ----------------------------------------------------

            if (
                event.code ===
                'KeyR'
            ) {

                simulation.reset();

            }

            // ----------------------------------------------------
            // LAB 1–5
            // ----------------------------------------------------

            if (
                event.code ===
                'Digit1'
            ) {

                applyPreset(
                    'inertia'
                );

            }

            if (
                event.code ===
                'Digit2'
            ) {

                applyPreset(
                    'wind'
                );

            }

            if (
                event.code ===
                'Digit3'
            ) {

                applyPreset(
                    'attract'
                );

            }

            if (
                event.code ===
                'Digit4'
            ) {

                applyPreset(
                    'repel'
                );

            }

            if (
                event.code ===
                'Digit5'
            ) {

                applyPreset(
                    'vortex'
                );

            }

        }
    );

    // ============================================================
    // RESIZE
    // ============================================================

    addEventListener(
        'resize',
        () => {

            camera.aspect =
                innerWidth /
                innerHeight;

            camera.updateProjectionMatrix();

            renderer.setSize(
                innerWidth,
                innerHeight
            );

        }
    );

    // ============================================================
    // RESET INICIAL
    // ============================================================

    simulation.reset();

    // ============================================================
    // LOOP
    // ============================================================

    renderer.setAnimationLoop(
        () => {

            if (!paused) {

                /*
                 * El gesto se desvanece progresivamente.
                 *
                 * Esto hace que un movimiento brusco genere
                 * una corriente que desaparece gradualmente.
                 */

                params.currentDirection.value
                    .multiplyScalar(
                        0.94
                    );

                simulation.stepSimulation();

            }

            orbit.update();

            renderer.render(
                scene,
                camera
            );

        }
    );

}


// ================================================================
// ERRORES
// ================================================================

main().catch(
    (error) => {

        console.error(
            error
        );

        const pre =
            document.createElement(
                'pre'
            );

        pre.style.cssText =
            `
            position:fixed;
            inset:16px;
            white-space:pre-wrap;
            color:#fff;
            background:#050607;
            padding:20px;
            z-index:50;
            overflow:auto;
            `;

        pre.textContent =
            String(
                error?.stack ||
                error
            );

        document.body.appendChild(
            pre
        );

    }
);