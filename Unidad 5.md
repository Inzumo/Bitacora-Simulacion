# Bitácora — Unidad 5

---
## Cómo arranqué

Al principio pensé en construir un sistema de partículas flotantes con efectos vistosos que reaccionaran al puntero del mouse. Sin embargo, analizando los referentes y las bases de la unidad, comprendí que replicar un estilo puramente estético caería en la mera decoración. El objetivo de este proyecto no es poblar la pantalla con elementos sin sentido, sino hacer que cada fuerza física responda a una intención narrativa.

Empecé a abstraer lo que representa el relevo generacional en un entorno institucional: no es un paso de antorcha pacífico ni inmediato, sino un proceso dinámico de equilibrios, tensiones, pesos e inercias entre dos fuerzas que coexisten.

Para materializar esta dinámica, dividí el sistema en dos núcleos de elementos:

- **Estructura tradicional (Experiencia):** nodos pesados, con masa elevada, baja velocidad y un color terracota que comunica estabilidad e inercia.
- **Nuevas energías (Innovación):** nodos livianos, de respuesta rápida, alta agitación y un color turquesa vibrante.

El foco de la propuesta no está en los nodos individuales, sino en **las fuerzas y vínculos que se forman entre ellos**.

---

## Los cinco momentos

Mapeé la progresión narrativa del guion con cinco estados dinámicos del sistema:

| Momento | Escenas | Qué hace el sistema | Qué significa |
|---|---|---|---|
| 1 | 1–2 | Nodos pesados agrupados con enlaces rígidos; partículas livianas orbitando lejos. | Estructura rígida, alta inercia y status quo. |
| 2 | 3–4 | Las partículas livianas se introducen en la red, estirando los vínculos. | Fricción, ingreso de nueva energía y resistencia al cambio. |
| 3 | 5–6 | Choques de velocidad, deformación elástica y pérdida de masa del grupo tradicional. | Transferencia de carga, negociación y pérdida de rigidez. |
| 4 | 7–10 | Reconfiguración de la topología; los nodos turquesa asumen la atracción del centro. | Asunción del liderazgo y redistribución de la fuerza. |
| 5 | 11–13 | Red fluida, con equilibrio de distancias y rápida propagación de movimiento. | Ventaja competitiva, cohesión e integración intergeneracional. |

Con esta estructura garantizo que cada transición responda directamente a una sección del discurso y no a un adorno aleatorio.

---

## Decisiones de diseño

Buscando una identidad propia, opté por una paleta de alto contraste basada en fondo azul noche profundo (`#0b0d12`), utilizando terracota cálido para la masa tradicional y turquesa/cyan para la energía joven. 

Para la capa web y el sistema editorial, dividí la pantalla en dos zonas principales: la columna izquierda aislada para el texto con tipografía sans-serif limpia, y la zona derecha reservada exclusivamente para la simulación física en p5.js. 

Para garantizar la legibilidad en pantallas grandes de conferencia, incorporé un panel con baja opacidad y desenfoque (*backdrop-filter*) detrás de cada párrafo del guion.

---

## Problemas que tuve

**Sincronización de eventos de clic.** Al principio, interactuar con la interfaz del texto avanzaba la simulación o desencadenaba clicks no deseados en el canvas. Lo solucioné aislando la capa de la UI con propiedades de puntero en CSS (`pointer-events: none` y `auto` en elementos interactivos).

**Desbordamiento por sobreexcitación de fuerzas.** Durante los momentos de fricción, las partículas livianas adquirían demasiada velocidad y salían del encuadre. Lo corregí aplicando un límite a los vectores de velocidad (`constrain`) y ajustando el coeficiente de amortiguación (`damping`).

**Despliegue e integración en GitHub Pages.** El pipeline de despliegue en GitHub Actions arrojaba un error por falta de permisos en el repositorio. Lo solucioné configurando el origen de publicación en la sección *Settings > Pages* hacia **GitHub Actions**.

**Renderizado de archivos externos.** Tuve incovenientes de carga con fuentes e imágenes externas. Para asegurar la estabilidad de la presentación, integré la lógica en archivos con rutas relativas limpias e integré el marcado de UI de forma nativa.

---

## Autoevaluación

**Cumplimiento del encargo (25/25)**
La presentación interpreta secuencialmente el guion suministrado a través de un sistema generativo a pantalla completa, adaptado para eventos de gran formato.

**Relaciones estructurales (25/25)**
Existen tres fuerzas claras: cohesión interna por proximidad, repulsión para evitar colapsos y vínculos elásticos que cambian su constante de rigidez según la escena.

**Comportamiento y significado (25/25)**
Cada variación de velocidad, masa, tensión o viscosidad está directamente vinculada a una idea conceptual del discurso sobre el relevo generacional.

**Explicación y demostración (25/25)**
Puedo ejecutar la presentación en tiempo real, navegar por las escenas y justificar técnicamente cada parámetro de la simulación.

---


