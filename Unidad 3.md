# Bitacora-Simulacion

Reto de Diseño N°3

Uno de los primeros retos fue encontrar qué tensión quería explorar con las partículas. Al principio empecé haciendo el código sin tener muy claro qué quería representar. Estaba más concentrado en conseguir que las partículas se movieran y en probar diferentes fuerzas, pero el resultado no me convencía mucho porque se sentía como una simulación que se movía porque sí.

Después de probar varias cosas, pensé que necesitaba primero encontrar una idea que tuviera sentido y después buscar la forma de representarla con las partículas. Ahí fue cuando empecé a pensar en diferentes tipos de comportamientos que pudieran tener una relación entre ellos.

Al final decidí trabajar con una tensión entre cohesión y expansión. La idea era tener un sistema que pudiera mantenerse concentrado y formar una especie de núcleo, pero que al mismo tiempo pudiera romper esa estructura y expandirse. Esto también me permitió relacionarlo con la música que escogí para la pieza, LesAlpx de Floating Points.

Quería que la simulación tuviera momentos en los que las partículas parecieran estar contenidas y organizadas, y otros en los que esa organización se rompiera de repente. Por eso terminé trabajando principalmente con una fuerza de atracción radial y una fuerza de vórtice. La atracción hace que las partículas se concentren alrededor del cursor, mientras que el vórtice hace que ese movimiento no sea simplemente entrar y salir, sino que también tenga una rotación.

Después agregué la posibilidad de cambiar la atracción por repulsión con la Barra Espaciadora. Esto terminó siendo una de las partes más importantes del proyecto porque me permitía pasar directamente de un estado de cohesión a uno de expansión. En lugar de tener una animación que simplemente siguiera su curso, podía intervenir en ella y provocar el cambio en tiempo real.

$$
\vec{F}_{\text{total}} =
\vec{F}_{\text{radial}} +
\vec{F}_{\text{vortex}} +
\vec{F}_{\text{wind}} +
\vec{F}_{\text{drag}}
$$

Cada fuerza cumple una función diferente dentro del comportamiento. La fuerza radial controla principalmente si las partículas se acercan o se alejan, el vórtice genera el movimiento de rotación, el viento permite agregar una fuerza externa y el drag ayuda a controlar la velocidad para que el sistema no se vuelva demasiado inestable.

También decidí que la simulación tuviera 30.000 partículas. Al principio mi preocupación era que una cantidad tan grande de partículas pudiera afectar demasiado el rendimiento, especialmente porque quería que la interacción fuera en tiempo real. Por eso terminé llevando el cálculo físico al Compute Shader de WebGPU, utilizando los Storage Buffers para guardar las posiciones y velocidades.

La parte visual también fue importante. Utilicé THREE.PointsNodeMaterial y AdditiveBlending porque quería que las partículas se sintieran más como una masa luminosa que como puntos individuales. De esta forma, cuando muchas partículas se juntan, visualmente se forma un núcleo, y cuando se separan se puede ver mucho mejor la expansión.

Finalmente dividí la experiencia en dos modos. El Modo LAB lo utilicé para probar y ajustar las fuerzas con sliders y presets, mientras que el Modo PERFORMANCE lo dejé más limpio para poder controlar la simulación directamente con el mouse, la Barra Espaciadora y las teclas P y R.

La intención final no era solamente hacer una simulación de partículas que se viera bien, sino convertirla en una especie de instrumento visual, donde yo pudiera controlar la tensión del sistema mientras escucho la música y decidir en qué momento mantener las partículas juntas y en qué momento hacer que todo explote.

## Tabla de Criterios

| Criterio | Peso | Valoración | Qué debe demostrar la evidencia  |
| :--- | :---: | :---: | :--- |
| **Trazabilidad y comprensión del sistema.** | **25** | **25** | Puedo señalar y explicar estado, fuerzas, integración, render y controles; además puedo ubicar qué partes produjo o modificó la IA. |
| **Verificación del algoritmo de fuerzas** | **25** | **25** | Estudié en detalle el proyecto y aunque no comprenda toda la sintaxis, puedo identificar su arquitectura, sus partes, puedo aislar una fuerza central, formular una predicción, la ejecuté ya analicé, comparé el resultado, cambié deliberadamente un signo o parámetro y expliqué la diferencia. |
| **Diseño de fuerzas e intención** | **20** | **20** | Las fuerzas y sus parámetros hacen perceptible una intención; el comportamiento surge de la dinámica y no de trayectorias previamente dibujadas. |
| **Instrumento, score e interpretación** | **15** | **15** | El score conecta la escucha con decisiones; escogí pocos controles expresivos y puedo conducir el sistema en vivo sin que el audio lo controle automáticamente. |
| **Experimentación y criterio frente a la IA** | **10** | **10** | Comparé alternativas, registré hallazgos y descartes, corregí propuestas de IA y puedo justificar por qué conservé la versión presentada. |
| **Entrega técnica y documentación** | **5** | **5** | URL pública funcional desplegada a 60 FPS estables con bitácora estructurada que permite reconstruir todo el proceso. |
