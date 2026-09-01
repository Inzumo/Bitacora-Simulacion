export function createLabPanel({
    params,
    uniforms,
    onReset,
    onPreset,
    onModeChange,
    onPauseChange
}) {
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

    const panel = document.createElement('div');
    panel.className = 'lab-panel';

    panel.innerHTML = `
        <div class="panel-title">U3 · FORCES INSTRUMENT</div>

        <div class="panel-subtitle">
            LAB: aísla fuerzas, predice y prueba.<br>
            Presiona <strong>P</strong> para cambiar de modo.
        </div>

        <div class="main-buttons">
            <button id="modeButton">Cambiar a PERFORMANCE</button>
            <button id="pauseButton">Pausar</button>
            <button id="resetButton">Reiniciar (R)</button>
        </div>

        <div id="labControls">
            <div class="section-title">PRUEBAS DE COMPORTAMIENTO</div>
            <button data-preset="1">1 · Inercia</button>
            <button data-preset="2">2 · Viento constante</button>
            <button data-preset="3">3 · Atracción radial</button>
            <button data-preset="4">4 · Repulsión radial</button>
            <button data-preset="5">5 · Vórtice</button>
        </div>

        <div id="performanceControls">
            <div class="section-title">SIMULACIÓN</div>
            <label>
                Time Scale: <span id="timeScaleValue"></span>
                <input id="timeScale" type="range" min="0.001" max="0.05" step="0.001" value="${params.timeStep?.value || 0.016}">
            </label>

            <label>
                Max Speed: <span id="maxSpeedValue"></span>
                <input id="maxSpeed" type="range" min="1" max="20" step="0.1" value="${params.maxSpeed?.value || 10.0}">
            </label>

            <label>
                Particle Size: <span id="particleSizeValue"></span>
                <input id="particleSize" type="range" min="0.005" max="0.2" step="0.001" value="${params.particleSize?.value || 0.08}">
            </label>

            <div class="section-title">FUERZAS</div>

            <div class="checkbox-row">
                <input id="radialEnabled" type="checkbox">
                <label for="radialEnabled">Fuerza Radial</label>
            </div>
            <label>
                Radial Strength: <span id="radialStrengthValue"></span>
                <input id="radialStrength" type="range" min="-20" max="20" step="0.1" value="${params.radialStrength?.value || 2.0}">
            </label>

            <div class="checkbox-row">
                <input id="vortexEnabled" type="checkbox">
                <label for="vortexEnabled">Vórtice</label>
            </div>
            <label>
                Vortex Strength: <span id="vortexStrengthValue"></span>
                <input id="vortexStrength" type="range" min="-10" max="10" step="0.1" value="${params.vortexStrength?.value || 2.0}">
            </label>

            <div class="checkbox-row">
                <input id="curlEnabled" type="checkbox">
                <label for="curlEnabled">Turbulencia</label>
            </div>
            <label>
                Curl Strength: <span id="curlStrengthValue"></span>
                <input id="curlStrength" type="range" min="0" max="10" step="0.1" value="${params.curlStrength?.value || 0}">
            </label>

            <div class="checkbox-row">
                <input id="dragEnabled" type="checkbox">
                <label for="dragEnabled">Drag</label>
            </div>
            <label>
                Drag Coefficient: <span id="dragValue"></span>
                <input id="dragCoefficient" type="range" min="0" max="0.5" step="0.01" value="${params.dragCoefficient?.value || 0.05}">
            </label>

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

    function refresh() {
        if (params.timeStep) {
            timeScaleInput.value = params.timeStep.value;
            timeScaleValue.textContent = Number(params.timeStep.value).toFixed(3);
            if (uniforms?.uTimeStep) uniforms.uTimeStep.value = params.timeStep.value;
        }
        if (params.maxSpeed) {
            maxSpeedInput.value = params.maxSpeed.value;
            maxSpeedValue.textContent = Number(params.maxSpeed.value).toFixed(1);
            if (uniforms?.uMaxSpeed) uniforms.uMaxSpeed.value = params.maxSpeed.value;
        }
        if (params.particleSize) {
            particleSizeInput.value = params.particleSize.value;
            particleSizeValue.textContent = Number(params.particleSize.value).toFixed(3);
            if (uniforms?.uParticleSize) uniforms.uParticleSize.value = params.particleSize.value;
        }

        if (params.radialEnabled) {
            radialEnabledInput.checked = Boolean(params.radialEnabled.value);
            if (uniforms?.uRadialEnabled) uniforms.uRadialEnabled.value = params.radialEnabled.value;
        }
        if (params.radialStrength) {
            radialStrengthInput.value = params.radialStrength.value;
            radialStrengthValue.textContent = Number(params.radialStrength.value).toFixed(2);
            if (uniforms?.uRadialStrength) uniforms.uRadialStrength.value = params.radialStrength.value;
        }

        if (params.vortexEnabled) {
            vortexEnabledInput.checked = Boolean(params.vortexEnabled.value);
            if (uniforms?.uVortexEnabled) uniforms.uVortexEnabled.value = params.vortexEnabled.value;
        }
        if (params.vortexStrength) {
            vortexStrengthInput.value = params.vortexStrength.value;
            vortexStrengthValue.textContent = Number(params.vortexStrength.value).toFixed(2);
            if (uniforms?.uVortexStrength) uniforms.uVortexStrength.value = params.vortexStrength.value;
        }

        if (params.curlEnabled) {
            curlEnabledInput.checked = Boolean(params.curlEnabled.value);
            if (uniforms?.uCurlEnabled) uniforms.uCurlEnabled.value = params.curlEnabled.value;
        }
        if (params.curlStrength) {
            curlStrengthInput.value = params.curlStrength.value;
            curlStrengthValue.textContent = Number(params.curlStrength.value).toFixed(2);
            if (uniforms?.uCurlStrength) uniforms.uCurlStrength.value = params.curlStrength.value;
        }

        if (params.dragEnabled) {
            dragEnabledInput.checked = Boolean(params.dragEnabled.value);
            if (uniforms?.uDragEnabled) uniforms.uDragEnabled.value = params.dragEnabled.value;
        }
        if (params.dragCoefficient) {
            dragInput.value = params.dragCoefficient.value;
            dragValue.textContent = Number(params.dragCoefficient.value).toFixed(2);
            if (uniforms?.uDragCoefficient) uniforms.uDragCoefficient.value = params.dragCoefficient.value;
        }

        if (params.windEnabled) {
            windEnabledInput.checked = Boolean(params.windEnabled.value);
            if (uniforms?.uWindEnabled) uniforms.uWindEnabled.value = params.windEnabled.value;
        }
        if (params.wind?.value) {
            windXInput.value = params.wind.value.x;
            windXValue.textContent = Number(params.wind.value.x).toFixed(2);
            windYInput.value = params.wind.value.y;
            windYValue.textContent = Number(params.wind.value.y).toFixed(2);
            if (uniforms?.uWind) uniforms.uWind.value.copy(params.wind.value);
        }
    }

    timeScaleInput.addEventListener('input', () => {
        const val = Number(timeScaleInput.value);
        if (params.timeStep) params.timeStep.value = val;
        if (uniforms?.uTimeStep) uniforms.uTimeStep.value = val;
        timeScaleValue.textContent = val.toFixed(3);
    });

    maxSpeedInput.addEventListener('input', () => {
        const val = Number(maxSpeedInput.value);
        if (params.maxSpeed) params.maxSpeed.value = val;
        if (uniforms?.uMaxSpeed) uniforms.uMaxSpeed.value = val;
        maxSpeedValue.textContent = val.toFixed(1);
    });

    particleSizeInput.addEventListener('input', () => {
        const val = Number(particleSizeInput.value);
        if (params.particleSize) params.particleSize.value = val;
        if (uniforms?.uParticleSize) uniforms.uParticleSize.value = val;
        particleSizeValue.textContent = val.toFixed(3);
    });

    radialEnabledInput.addEventListener('change', () => {
        const val = radialEnabledInput.checked ? 1.0 : 0.0;
        if (params.radialEnabled) params.radialEnabled.value = val;
        if (uniforms?.uRadialEnabled) uniforms.uRadialEnabled.value = val;
    });
    radialStrengthInput.addEventListener('input', () => {
        const val = Number(radialStrengthInput.value);
        if (params.radialStrength) params.radialStrength.value = val;
        if (uniforms?.uRadialStrength) uniforms.uRadialStrength.value = val;
        radialStrengthValue.textContent = val.toFixed(2);
    });

    vortexEnabledInput.addEventListener('change', () => {
        const val = vortexEnabledInput.checked ? 1.0 : 0.0;
        if (params.vortexEnabled) params.vortexEnabled.value = val;
        if (uniforms?.uVortexEnabled) uniforms.uVortexEnabled.value = val;
    });
    vortexStrengthInput.addEventListener('input', () => {
        const val = Number(vortexStrengthInput.value);
        if (params.vortexStrength) params.vortexStrength.value = val;
        if (uniforms?.uVortexStrength) uniforms.uVortexStrength.value = val;
        vortexStrengthValue.textContent = val.toFixed(2);
    });

    curlEnabledInput.addEventListener('change', () => {
        const val = curlEnabledInput.checked ? 1.0 : 0.0;
        if (params.curlEnabled) params.curlEnabled.value = val;
        if (uniforms?.uCurlEnabled) uniforms.uCurlEnabled.value = val;
    });
    curlStrengthInput.addEventListener('input', () => {
        const val = Number(curlStrengthInput.value);
        if (params.curlStrength) params.curlStrength.value = val;
        if (uniforms?.uCurlStrength) uniforms.uCurlStrength.value = val;
        curlStrengthValue.textContent = val.toFixed(2);
    });

    dragEnabledInput.addEventListener('change', () => {
        const val = dragEnabledInput.checked ? 1.0 : 0.0;
        if (params.dragEnabled) params.dragEnabled.value = val;
        if (uniforms?.uDragEnabled) uniforms.uDragEnabled.value = val;
    });
    dragInput.addEventListener('input', () => {
        const val = Number(dragInput.value);
        if (params.dragCoefficient) params.dragCoefficient.value = val;
        if (uniforms?.uDragCoefficient) uniforms.uDragCoefficient.value = val;
        dragValue.textContent = val.toFixed(2);
    });

    windEnabledInput.addEventListener('change', () => {
        const val = windEnabledInput.checked ? 1.0 : 0.0;
        if (params.windEnabled) params.windEnabled.value = val;
        if (uniforms?.uWindEnabled) uniforms.uWindEnabled.value = val;
    });
    windXInput.addEventListener('input', () => {
        const val = Number(windXInput.value);
        if (params.wind?.value) params.wind.value.x = val;
        if (uniforms?.uWind) uniforms.uWind.value.x = val;
        windXValue.textContent = val.toFixed(2);
    });
    windYInput.addEventListener('input', () => {
        const val = Number(windYInput.value);
        if (params.wind?.value) params.wind.value.y = val;
        if (uniforms?.uWind) uniforms.uWind.value.y = val;
        windYValue.textContent = val.toFixed(2);
    });

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
