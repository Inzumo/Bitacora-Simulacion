import * as THREE from 'three/webgpu';

export function createParameters() {

    return {

        // =========================================================
        // ESTADO GENERAL
        // =========================================================

        time: 0,

        // =========================================================
        // CENTRO DE INTERACCIÓN
        //
        // En nuestro instrumento NO es un atractor.
        // Es el centro de la corriente.
        // =========================================================

        currentCenter: {
            value: new THREE.Vector3(0, 0, 0)
        },

        currentDirection: {
            value: new THREE.Vector3(0, 0, 0)
        },

        // =========================================================
        // CORRIENTE — PERFORMANCE
        // =========================================================

        currentEnabled: {
            value: 1
        },

        currentStrength: {
            value: 3.0
        },

        currentRadius: {
            value: 2.5
        },

        // =========================================================
        // DRAG
        // =========================================================

        dragEnabled: {
            value: 1
        },

        dragCoefficient: {
            value: 0.12
        },

        // =========================================================
        // ATRACCIÓN / REPULSIÓN
        //
        // Se mantiene para el LAB.
        // =========================================================

        radialEnabled: {
            value: 0
        },

        radialStrength: {
            value: 3.0
        },

        radialSoftness: {
            value: 0.35
        },

        // =========================================================
        // VÓRTICE
        //
        // Se mantiene para el LAB.
        // =========================================================

        vortexEnabled: {
            value: 0
        },

        vortexStrength: {
            value: 3.0
        },

        vortexSoftness: {
            value: 0.35
        },

        // =========================================================
        // VIENTO
        //
        // Se mantiene para el LAB.
        // =========================================================

        windEnabled: {
            value: 0
        },

        wind: {
            value: new THREE.Vector3(0, 0, 0)
        },

        // =========================================================
        // CURL NOISE
        // =========================================================

        curlEnabled: {
            value: 1
        },

        curlStrength: {
            value: 0.35
        },

        noiseScale: {
            value: 0.65
        },

        noiseSpeed: {
            value: 0.15
        },

        // =========================================================
        // INTEGRACIÓN
        // =========================================================

        timeStep: {
            value: 0.016
        },

        // =========================================================
        // VELOCIDAD INICIAL — LAB
        // =========================================================

        initialSpeed: {
            value: 0
        },

        // =========================================================
        // LÍMITES DEL ESPACIO
        // =========================================================

        bounds: {
            value: new THREE.Vector3(5.0, 3.2, 2.5)
        },

        // =========================================================
        // VELOCIDAD MÁXIMA
        // =========================================================

        maxSpeed: {
            value: 4.5
        },

        // =========================================================
        // TAMAÑO VISUAL
        // =========================================================

        particleSize: {
            value: new THREE.Vector2(0.045, 0.045)
        }

    };

}