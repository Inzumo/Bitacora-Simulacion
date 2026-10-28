# Bitacora-Simulacion

[https://inzumo.github.io/Bitacora-Simulacion/](https://inzumo.github.io/Preuba-Simulacion-actividad-3/)

---
## Cómo arranqué

Para esta entrega quise que el sistema se viera como una galaxia de luz y no como puntos blancos moviéndose. La idea que quería transmitir era energía: que se notara cuándo el sistema está tranquilo y cuándo lo estoy empujando.

---

## Decisiones de diseño
Las partículas lentas son cian y, a medida que aceleran, pasan a púrpura, magenta y rojo neón. Así el color me dice cuánta energía tiene el sistema sin tener que mirar números. Evité el blanco puro porque cansa la vista y porque con tantas partículas encima se pierde el color.

Al principio solo hice que las partículas crecieran con la velocidad, pero se veía como bolitas más grandes. Con ayuda de la IA cambié la forma: ahora cada partícula se estira en la dirección en la que se mueve, con un núcleo brillante y un halo suave. Se ve como una estrella con cola.

Las partículas se quedaban en un cuadro pequeño en el centro. Ajusté el volumen según lo que ve la cámara, para que el sistema ocupe todo el fondo. El fondo es casi negro con un poco de azul para que el neón resalte.

Tengo viento, fuerza radial (atracción o repulsión según el signo), vórtice y fricción. La quinta es mi fuerza propia: turbulencia. Se lo pedí a la IA y ella propuso una fórmula que depende de la posición y del tiempo. Me gustó porque se siente orgánica, como el humo, y no empuja todo hacia un solo lado.
---

## Tabla de Criterios

| Criterio | Peso | Valoración | Qué debe demostrar la evidencia  |
| :--- | :---: | :---: | :--- |
| **Trazabilidad y comprensión del sistema.** | **25** | **25** | Puedo señalar y explicar estado, fuerzas, integración, render y controles; además puedo ubicar qué partes produjo o modificó la IA. |
| **Verificación del algoritmo de fuerzas** | **25** | **20** | Estudié en detalle el proyecto y aunque no comprenda toda la sintaxis, puedo identificar su arquitectura, sus partes, puedo aislar una fuerza central, formular una predicción, la ejecuté ya analicé, comparé el resultado, cambié deliberadamente un signo o parámetro y expliqué la diferencia. |
| **Diseño de fuerzas e intención** | **20** | **20** | Las fuerzas y sus parámetros hacen perceptible una intención; el comportamiento surge de la dinámica y no de trayectorias previamente dibujadas. |
| **Instrumento, score e interpretación** | **15** | **13** | El score conecta la escucha con decisiones; escogí pocos controles expresivos y puedo conducir el sistema en vivo sin que el audio lo controle automáticamente. |
| **Experimentación y criterio frente a la IA** | **10** | **10** | Comparé alternativas, registré hallazgos y descartes, corregí propuestas de IA y puedo justificar por qué conservé la versión presentada. |
| **Entrega técnica y documentación** | **5** | **5** | URL pública funcional desplegada a 60 FPS estables con bitácora estructurada que permite reconstruir todo el proceso. |
