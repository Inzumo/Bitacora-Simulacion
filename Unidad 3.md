# Bitacora-Simulacion

Reto de Diseño N°3

El objetivo fue encontrar la tensión expresiva del instrumento. En lugar de ajustar valores al azar, me enfoqué en la pieza LesAlpx de Floating Points para traducir su dinámica: la respiración entre un orden orgánico/cohesión armónica y su expansión caótica/volcánica.

## Tabla de Criterios

| Criterio | Peso | Valoración | Sustentación / Evidencias |
| :--- | :---: | :---: | :--- |
| **La intención es clara y perceptible en el comportamiento.** | **20%** | **100%** | La metáfora de *"Fuera del Enjambre"* es legible desde el primer segundo. Se nota de entrada el contraste entre el núcleo cohesionado (seguridad) y las partículas exploradoras (expansión), generando una dinámica orgánica sin necesidad de explicaciones previas. |
| **Los tipos, cantidades, matriz y parámetros están justificados desde la intención.** | **25%** | **100%** | Diseñé cuatro clases de agentes (P1 a P4) con velocidades, masas y campos de fuerza específicos. Los valores no son aleatorios; están ajustados para mantener el equilibrio del sistema sin que las partículas colapsen o se dispersen sin sentido. |
| **Comprendo y puedo modificar el funcionamiento técnico del sistema.** | **20%** | **100%** | Dominio total del código: implementé comportamientos de *Steering* (atracción, repulsión y *Arrival* suave) y optimicé los bucles de interacción mediante submuestreo estocástico para sostener más de 1.000 partículas a **60 FPS estables**. |
| **El sistema produce variaciones con una identidad reconocible.** | **15%** | **100%** | El score conecta la escucha con decisiones; escogí pocos controles expresivos y puedo conducir el sistema en vivo sin que el audio lo controle automáticamente. |
| **Experimentación y criterio frente a la IA** | **10** | **10** | Comparé alternativas, registré hallazgos y descartes, corregí propuestas de IA y puedo justificar por qué conservé la versión presentada. |
| **Entrega técnica y documentación** | **5** | **5** | URL pública funcional desplegada a 60 FPS estables con bitácora estructurada que permite reconstruir todo el proceso. |
