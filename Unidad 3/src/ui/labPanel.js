export function createLabPanel({
    params,
    onReset,
    onPreset,
    onModeChange,
    onPauseChange
}) {
    // 1. Inyectar estilos CSS automáticos para no depender de main.css ni style.css
    if (!document.getElementById('lab-panel-styles')) {
        const style = document.createElement('style');
        style.id = 'lab-panel-styles';
        style.textContent = `
            .lab-panel {
                position: fixed;
                top: 15px;
                right: 15px;
                width: 300px;
                max-height: 90vh;
                overflow-y: auto;
                background: rgba(18, 18, 24, 0.90);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                padding: 16px;
                color: #e0e0e0;
                font-family: system-ui, -apple-system, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                z-index: 99999;
                box-sizing: border-box;
            }
            .panel-title {
                font-size: 14px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 2px;
            }
            .panel-subtitle {
                font-size: 11px;
                color: #a0a0b0;
                margin-bottom: 12px;
                line-height: 1.3;
            }
            .section-title {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: #8888a0;
                margin-top: 14px;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 4px;
            }
            .main-buttons {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-bottom: 10px;
            }
            .lab-panel button {
                width: 100%;
                padding: 7px 10px;
                background: #282836;
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #ffffff;
                font-size: 12px;
                font-weight: 500;
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .lab-panel button:hover {
                background: #3a3a4d;
            }
            #labControls button {
                margin-bottom: 6px;
                text-align: left;
                background: rgba(255, 255, 255, 0.05);
            }
            #labControls button:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            .lab-panel label {
                display: flex;
                flex-direction: column;
                font-size: 12px;
                color: #cccccc;
                margin-bottom: 8px;
            }
            .lab-panel label span {
                float: right;
                font-family: monospace;
                color: #80c0ff;
            }
            .checkbox-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 10px;
                margin-bottom: 4px;
            }
            .checkbox-row input[type="checkbox"] {
                cursor: pointer;
            }
            .checkbox-row label {
                margin: 0;
                font-weight: 600;
                color: #ffffff;
            }
            .lab-panel input[type="range"] {
                width: 100%;
                margin-top: 4px;
                accent-color: #60a0ff;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Crear estructura DOM del panel
    const panel = document.createElement('div');
    panel.className = 'lab-panel';

    panel.innerHTML = `
        <div class="panel-title">
            U3 · FORCES INSTRUMENT
        </div>

        <div class="panel-subtitle">
            LAB: aísla fuerzas, predice y prueba.<br>
            Presiona <strong>P</strong> para cambiar de modo.
        </div>

        <div class="main-buttons">
            <button id="modeButton">Cambiar a PERFORMANCE</button>
            <button id="pauseButton">Pausar</button>
            <button id="resetButton">Reiniciar (R)</button>
        </div>

        <!-- CONTROLES MODO LAB (PRESETS) -->
        <div id="labControls">
            <div class="section-title">PRUEBAS DE COMPORTAMIENTO</div>
            <button data-preset="1">1 · Inercia</button>
            <button data-preset="2">2 · Viento constante</button>
            <button data-preset="3">3 · Atracción radial</button>
            <button data-preset="4">4 · Repulsión radial</button>
            <button data-preset="5">5 · Vórtice</button>
        </div>

        <!-- CONTROLES DE PARAMETROS Y FUERZAS -->
        <div id="performanceControls">

            <div class="section-title">SIMULACIÓN</div>
            <label>
                Time Scale: <span id="timeScaleValue"></span>
                <input id="timeScale" type="range" min="0.001" max="0.05" step="0.001" value="${params.timeStep?.value || 0.016}">
            </label>

            <label>
                Max Speed: <span id="maxSpeedValue"></span>
                <input id="maxSpeed" type="range" min="1" max="20" step="0.1" value="${params.maxSpeed?.value || 5.0}">
            </label>

            <label>
                Particle Size: <span id="particleSizeValue"></span>
                <input id="particleSize" type="range" min="0.005" max="0.1" step="0.001" value="${params.particleSize?.value || 0.035}">
            </label>

            <div class="section-title">FUERZAS</div>

            <!-- RADIAL -->
            <div class="checkbox-row">
                <input id="radialEnabled" type="checkbox">
                <label for="radialEnabled">Fuerza Radial</label>
            </div>
            <label>
                Radial Strength: <span id="radialStrengthValue"></span>
                <input id="radialStrength" type="range" min="-20" max="20" step="0.1" value="${params.radialStrength?.value || -3.0}">
            </label>

            <!-- VÓRTICE -->
            <div class="checkbox-row">
                <input id="vortexEnabled" type="checkbox">
                <label for="vortexEnabled">Vórtice</label>
            </div>
            <label>
                Vortex Strength: <span id="vortexStrengthValue"></span>
                <input id="vortexStrength" type="range" min="-10" max="10" step="0.1" value="${params.vortexStrength?.value || 3.0}">
            </label>

            <!-- TURBULENCIA / RUIDO ARMÓNICO -->
            <div class="checkbox-row">
                <input id="curlEnabled" type="checkbox">
                <label for="curlEnabled">Turbulencia</label>
            </div>
            <label>
                Curl Strength: <span id="curlStrengthValue"></span>
                <input id="curlStrength" type="range" min="0" max="10" step="0.1" value="${params.curlStrength?.value || 0}">
            </label>

            <!-- DRAG -->
            <div class="checkbox-row">
                <input id="dragEnabled" type="checkbox">
                <label for="dragEnabled">Drag</label>
            </div>
            <label>
                Drag Coefficient: <span id="dragValue"></span>
                <input id="dragCoefficient" type="range" min="0" max="0.5" step="0.01" value="${params.dragCoefficient?.value || 0.08}">
            </label>

            <!-- CORRIENTE / VIENTO -->
            <div class="checkbox-row">
                <input id="windEnabled" type="checkbox">
                <label for="windEnabled">Viento</label>
            </div>
            <label>
                Wind X: <span id="windXValue"></span>
                <input id="windX" type="range" min="-5" max="5" step="0.1" value="${params.wind?.value?.x || 0}">
            </label>
            <label>
                Wind Y: <span id="windYValue"></span>
                <input id="windY" type="range" min="-5" max="5" step="0.1" value="${params.wind?.value?.y || 0}">
            </label>

        </div>
    `;

    document.body.appendChild(panel);

    // 3. Selectores DOM
    const modeButton = panel.querySelector('#modeButton');
    const pauseButton = panel.querySelector('#pauseButton');
    const resetButton = panel.querySelector('#resetButton');
    const labControls = panel.querySelector('#labControls');

    const timeScaleInput = panel.querySelector('#timeScale');
    const maxSpeedInput = panel.querySelector('#maxSpeed');
    const particleSizeInput = panel.querySelector('#particleSize');

    const radialEnabledInput = panel.querySelector('#radialEnabled');
    const radialStrengthInput = panel.querySelector('#radialStrength');

    const vortexEnabledInput = panel.querySelector('#vortexEnabled');
    const vortexStrengthInput = panel.querySelector('#vortexStrength');

    const curlEnabledInput = panel.querySelector('#curlEnabled');
    const curlStrengthInput = panel.querySelector('#curlStrength');

    const dragEnabledInput = panel.querySelector('#dragEnabled');
    const dragInput = panel.querySelector('#dragCoefficient');

    const windEnabledInput = panel.querySelector('#windEnabled');
    const windXInput = panel.querySelector('#windX');
    const windYInput = panel.querySelector('#windY');

    const timeScaleValue = panel.querySelector('#timeScaleValue');
    const maxSpeedValue = panel.querySelector('#maxSpeedValue');
    const particleSizeValue = panel.querySelector('#particleSizeValue');
    const radialStrengthValue = panel.querySelector('#radialStrengthValue');
    const vortexStrengthValue = panel.querySelector('#vortexStrengthValue');
    const curlStrengthValue = panel.querySelector('#curlStrengthValue');
    const dragValue = panel.querySelector('#dragValue');
    const windXValue = panel.querySelector('#windXValue');
    const windYValue = panel.querySelector('#windYValue');

    // 4. Refrescar datos
    function refresh() {
        if (params.timeStep) {
            timeScaleInput.value = params.timeStep.value;
            timeScaleValue.textContent = Number(params.timeStep.value).toFixed(3);
        }
        if (params.maxSpeed) {
            maxSpeedInput.value = params.maxSpeed.value;
            maxSpeedValue.textContent = Number(params.maxSpeed.value).toFixed(1);
        }
        if (params.particleSize) {
            particleSizeInput.value = params.particleSize.value;
            particleSizeValue.textContent = Number(params.particleSize.value).toFixed(3);
        }

        if (params.radialEnabled) radialEnabledInput.checked = Boolean(params.radialEnabled.value);
        if (params.radialStrength) {
            radialStrengthInput.value = params.radialStrength.value;
            radialStrengthValue.textContent = Number(params.radialStrength.value).toFixed(2);
        }

        if (params.vortexEnabled) vortexEnabledInput.checked = Boolean(params.vortexEnabled.value);
        if (params.vortexStrength) {
            vortexStrengthInput.value = params.vortexStrength.value;
            vortexStrengthValue.textContent = Number(params.vortexStrength.value).toFixed(2);
        }

        if (params.curlEnabled) curlEnabledInput.checked = Boolean(params.curlEnabled.value);
        if (params.curlStrength) {
            curlStrengthInput.value = params.curlStrength.value;
            curlStrengthValue.textContent = Number(params.curlStrength.value).toFixed(2);
        }

        if (params.dragEnabled) dragEnabledInput.checked = Boolean(params.dragEnabled.value);
        if (params.dragCoefficient) {
            dragInput.value = params.dragCoefficient.value;
            dragValue.textContent = Number(params.dragCoefficient.value).toFixed(2);
        }

        if (params.windEnabled) windEnabledInput.checked = Boolean(params.windEnabled.value);
        if (params.wind?.value) {
            windXInput.value = params.wind.value.x;
            windXValue.textContent = Number(params.wind.value.x).toFixed(2);
            windYInput.value = params.wind.value.y;
            windYValue.textContent = Number(params.wind.value.y).toFixed(2);
        }
    }

    // 5. Listeners
    timeScaleInput.addEventListener('input', () => {
        if (params.timeStep) params.timeStep.value = Number(timeScaleInput.value);
        timeScaleValue.textContent = Number(timeScaleInput.value).toFixed(3);
    });

    maxSpeedInput.addEventListener('input', () => {
        if (params.maxSpeed) params.maxSpeed.value = Number(maxSpeedInput.value);
        maxSpeedValue.textContent = Number(maxSpeedInput.value).toFixed(1);
    });

    particleSizeInput.addEventListener('input', () => {
        if (params.particleSize) params.particleSize.value = Number(particleSizeInput.value);
        particleSizeValue.textContent = Number(particleSizeInput.value).toFixed(3);
    });

    radialEnabledInput.addEventListener('change', () => {
        if (params.radialEnabled) params.radialEnabled.value = radialEnabledInput.checked ? 1 : 0;
    });
    radialStrengthInput.addEventListener('input', () => {
        if (params.radialStrength) params.radialStrength.value = Number(radialStrengthInput.value);
        radialStrengthValue.textContent = Number(radialStrengthInput.value).toFixed(2);
    });

    vortexEnabledInput.addEventListener('change', () => {
        if (params.vortexEnabled) params.vortexEnabled.value = vortexEnabledInput.checked ? 1 : 0;
    });
    vortexStrengthInput.addEventListener('input', () => {
        if (params.vortexStrength) params.vortexStrength.value = Number(vortexStrengthInput.value);
        vortexStrengthValue.textContent = Number(vortexStrengthInput.value).toFixed(2);
    });

    curlEnabledInput.addEventListener('change', () => {
        if (params.curlEnabled) params.curlEnabled.value = curlEnabledInput.checked ? 1 : 0;
    });
    curlStrengthInput.addEventListener('input', () => {
        if (params.curlStrength) params.curlStrength.value = Number(curlStrengthInput.value);
        curlStrengthValue.textContent = Number(curlStrengthInput.value).toFixed(2);
    });

    dragEnabledInput.addEventListener('change', () => {
        if (params.dragEnabled) params.dragEnabled.value = dragEnabledInput.checked ? 1 : 0;
    });
    dragInput.addEventListener('input', () => {
        if (params.dragCoefficient) params.dragCoefficient.value = Number(dragInput.value);
        dragValue.textContent = Number(dragInput.value).toFixed(2);
    });

    windEnabledInput.addEventListener('change', () => {
        if (params.windEnabled) params.windEnabled.value = windEnabledInput.checked ? 1 : 0;
    });
    windXInput.addEventListener('input', () => {
        if (params.wind?.value) params.wind.value.x = Number(windXInput.value);
        windXValue.textContent = Number(windXInput.value).toFixed(2);
    });
    windYInput.addEventListener('input', () => {
        if (params.wind?.value) params.wind.value.y = Number(windYInput.value);
        windYValue.textContent = Number(windYInput.value).toFixed(2);
    });

    // Presets
    panel.querySelectorAll('[data-preset]').forEach((button) => {
        button.addEventListener('click', () => {
            if (onPreset) onPreset(button.dataset.preset);
            refresh();
        });
    });

    modeButton.addEventListener('click', () => {
        if (onModeChange) onModeChange();
    });

    pauseButton.addEventListener('click', () => {
        if (onPauseChange) onPauseChange();
        pauseButton.textContent = pauseButton.textContent === 'Pausar' ? 'Continuar' : 'Pausar';
    });

    resetButton.addEventListener('click', () => {
        if (onReset) onReset();
        refresh();
    });

    // 6. Visibilidad de Modos
    function setVisible(visible) {
        if (visible) {
            panel.style.display = 'block';
            labControls.style.display = 'block';
            modeButton.textContent = 'Cambiar a PERFORMANCE';
        } else {
            panel.style.display = 'none';
            labControls.style.display = 'none';
            modeButton.textContent = 'Cambiar a LAB';
        }
    }

    refresh();

    return {
        refresh,
        setVisible,
        element: panel
    };
}