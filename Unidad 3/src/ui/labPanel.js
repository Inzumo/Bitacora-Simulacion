export function createLabPanel({
    params,
    onReset,
    onPreset,
    onModeChange,
    onPauseChange
}) {

    const panel =
        document.createElement('div');

    panel.className =
        'lab-panel';

    panel.innerHTML = `
        <div class="panel-title">
            INSTRUMENTO DE FUERZAS
        </div>

        <div class="panel-subtitle">
            CORRIENTE
        </div>

        <button id="modeButton">
            Cambiar a PERFORMANCE
        </button>

        <button id="pauseButton">
            Pausar
        </button>

        <button id="resetButton">
            Reiniciar
        </button>

        <div id="labControls">

            <div class="section-title">
                LABORATORIO
            </div>

            <button data-preset="inertia">
                1 · Inercia
            </button>

            <button data-preset="wind">
                2 · Viento constante
            </button>

            <button data-preset="attract">
                3 · Atracción radial
            </button>

            <button data-preset="repel">
                4 · Repulsión radial
            </button>

            <button data-preset="vortex">
                5 · Vórtice
            </button>

        </div>

        <div id="performanceControls">

            <div class="section-title">
                PERFORMANCE
            </div>

            <label>
                Intensidad de corriente
                <span id="currentStrengthValue"></span>
            </label>

            <input
                id="currentStrength"
                type="range"
                min="0"
                max="8"
                step="0.1"
                value="${params.currentStrength.value}"
            >

            <label>
                Radio de corriente
                <span id="currentRadiusValue"></span>
            </label>

            <input
                id="currentRadius"
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value="${params.currentRadius.value}"
            >

            <label>
                Drag
                <span id="dragValue"></span>
            </label>

            <input
                id="dragCoefficient"
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value="${params.dragCoefficient.value}"
            >

        </div>
    `;

    document.body.appendChild(
        panel
    );

    const modeButton =
        panel.querySelector(
            '#modeButton'
        );

    const pauseButton =
        panel.querySelector(
            '#pauseButton'
        );

    const resetButton =
        panel.querySelector(
            '#resetButton'
        );

    const labControls =
        panel.querySelector(
            '#labControls'
        );

    const performanceControls =
        panel.querySelector(
            '#performanceControls'
        );

    const currentStrengthInput =
        panel.querySelector(
            '#currentStrength'
        );

    const currentRadiusInput =
        panel.querySelector(
            '#currentRadius'
        );

    const dragInput =
        panel.querySelector(
            '#dragCoefficient'
        );

    const currentStrengthValue =
        panel.querySelector(
            '#currentStrengthValue'
        );

    const currentRadiusValue =
        panel.querySelector(
            '#currentRadiusValue'
        );

    const dragValue =
        panel.querySelector(
            '#dragValue'
        );

    // ============================================================
    // REFRESCAR VALORES
    // ============================================================

    function refresh() {

        currentStrengthInput.value =
            params.currentStrength.value;

        currentRadiusInput.value =
            params.currentRadius.value;

        dragInput.value =
            params.dragCoefficient.value;

        currentStrengthValue.textContent =
            Number(
                params.currentStrength.value
            ).toFixed(1);

        currentRadiusValue.textContent =
            Number(
                params.currentRadius.value
            ).toFixed(1);

        dragValue.textContent =
            Number(
                params.dragCoefficient.value
            ).toFixed(2);

    }

    // ============================================================
    // CONTROLES PERFORMANCE
    // ============================================================

    currentStrengthInput.addEventListener(
        'input',
        () => {

            params.currentStrength.value =
                Number(
                    currentStrengthInput.value
                );

            currentStrengthValue.textContent =
                Number(
                    currentStrengthInput.value
                ).toFixed(1);

        }
    );

    currentRadiusInput.addEventListener(
        'input',
        () => {

            params.currentRadius.value =
                Number(
                    currentRadiusInput.value
                );

            currentRadiusValue.textContent =
                Number(
                    currentRadiusInput.value
                ).toFixed(1);

        }
    );

    dragInput.addEventListener(
        'input',
        () => {

            params.dragCoefficient.value =
                Number(
                    dragInput.value
                );

            dragValue.textContent =
                Number(
                    dragInput.value
                ).toFixed(2);

        }
    );

    // ============================================================
    // PRESETS LAB
    // ============================================================

    panel
        .querySelectorAll(
            '[data-preset]'
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    'click',
                    () => {

                        onPreset(
                            button.dataset.preset
                        );

                    }
                );

            }
        );

    // ============================================================
    // MODO
    // ============================================================

    modeButton.addEventListener(
        'click',
        () => {

            onModeChange();

        }
    );

    // ============================================================
    // PAUSA
    // ============================================================

    pauseButton.addEventListener(
        'click',
        () => {

            onPauseChange();

            pauseButton.textContent =
                pauseButton.textContent === 'Pausar'
                    ? 'Continuar'
                    : 'Pausar';

        }
    );

    // ============================================================
    // RESET
    // ============================================================

    resetButton.addEventListener(
        'click',
        () => {

            onReset();

        }
    );

    // ============================================================
    // VISIBILIDAD
    // ============================================================

    function setVisible(
        visible
    ) {

        labControls.style.display =
            visible
                ? 'block'
                : 'none';

        performanceControls.style.display =
            visible
                ? 'none'
                : 'block';

        modeButton.textContent =
            visible
                ? 'Cambiar a PERFORMANCE'
                : 'Cambiar a LAB';

    }

    // ============================================================
    // API
    // ============================================================

    refresh();

    return {

        refresh,

        setVisible,

        element: panel

    };

}