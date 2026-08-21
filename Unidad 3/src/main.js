import * as THREE from 'three';
import { createLabPanel } from './ui/labPanel.js';

// ============================================================
// 1. ESTADO GLOBAL Y PARÁMETROS (UNIFORMS)
// ============================================================
let isLabMode = true;
let isPaused = false;
let previousRadialStrength = -3.0;

// Objeto de parámetros que alimentan la GPU y la UI
const params = {
    timeStep: { value: 0.016 },
    maxSpeed: { value: 5.0 },
    particleSize: { value: 0.035 },

    // Fuerza Radial
    radialEnabled: { value: 1 },
    radialStrength: { value: -3.0 }, // Negativo = Atracción, Positivo = Repulsión

    // Vórtice
    vortexEnabled: { value: 1 },
    vortexStrength: { value: 3.0 },

    // Turbulencia / Ruido Armónico
    curlEnabled: { value: 0 },
    curlStrength: { value: 2.0 },

    // Drag (Fricción/Amortiguamiento)
    dragEnabled: { value: 1 },
    dragCoefficient: { value: 0.08 },

    // Viento
    windEnabled: { value: 0 },
    wind: { value: new THREE.Vector2(0, 0) }
};

// ============================================================
// 2. INICIALIZACIÓN DE LA UI (LAB PANEL)
// ============================================================
const labPanel = createLabPanel({
    params: params,
    onReset: () => resetSimulation(),
    onPreset: (presetKey) => applyPreset(presetKey),
    onModeChange: () => toggleMode(),
    onPauseChange: () => togglePause()
});

function toggleMode() {
    isLabMode = !isLabMode;
    labPanel.setVisible(isLabMode);
}

function togglePause() {
    isPaused = !isPaused;
}

function resetSimulation() {
    // AQUÍ: Invoca el método de reinicio de tus partículas/GPU
    // e.g., simulation.reset();
    console.log("Simulación reiniciada.");
    labPanel.refresh();
}

// ============================================================
// 3. PRESETS DE LABORATORIO (ESCENARIOS 1 A 5)
// ============================================================
function applyPreset(presetKey) {
    // Desactivar todas las fuerzas por defecto
    params.radialEnabled.value = 0;
    params.vortexEnabled.value = 0;
    params.curlEnabled.value = 0;
    params.dragEnabled.value = 0;
    params.windEnabled.value = 0;

    switch (String(presetKey)) {
        case '1': // Inercia pura
            break;

        case '2': // Viento constante
            params.windEnabled.value = 1;
            params.wind.value.set(2.0, 0.0);
            break;

        case '3': // Atracción radial
            params.radialEnabled.value = 1;
            params.radialStrength.value = -5.0;
            break;

        case '4': // Repulsión radial
            params.radialEnabled.value = 1;
            params.radialStrength.value = 8.0;
            break;

        case '5': // Vórtice
            params.vortexEnabled.value = 1;
            params.vortexStrength.value = 4.0;
            break;
    }

    resetSimulation();
}

// ============================================================
// 4. EVENTOS DE TECLADO (INTERACCIÓN EN VIVO Y PERFORMANCE)
// ============================================================

// Interacción con la Barra Espaciadora (Atracción <-> Repulsión)
window.addEventListener('keydown', (e) => {
    // Tecla P: Alternar modo LAB / PERFORMANCE
    if (e.key === 'p' || e.key === 'P') {
        toggleMode();
    }

    // Tecla R: Reiniciar posiciones
    if (e.key === 'r' || e.key === 'R') {
        resetSimulation();
    }

    // Barra Espaciadora: Inversión Radial (Explosión)
    if (e.code === 'Space') {
        e.preventDefault(); // Evita el scroll de la página

        if (!e.repeat) {
            // Guardar valor actual para restaurarlo al soltar
            previousRadialStrength = params.radialStrength.value;
            params.radialStrength.value = 15.0; // Fuerza de repulsión/onda expansiva
            params.radialEnabled.value = 1;

            labPanel.refresh();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();

        // Restaurar el estado previo de fuerza radial
        params.radialStrength.value = previousRadialStrength;

        labPanel.refresh();
    }
});

// Forzar visibilidad inicial del panel en modo LAB
labPanel.setVisible(true);
