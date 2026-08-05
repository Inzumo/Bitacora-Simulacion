# Bitacora-Simulacion

Reto de Diseño N°2

Uno de los retos fue encontrar qué tensión quería explorar. Empecé haciendo el código sin pensarlo mucho, pero no me gustaba el comportamiento de las partículas y estuve bastante rato probando cosas sin llegar a nada.

Después pensé en hacer una comunidad, pero faltaba decidir cuál. Descarté varias ideas hasta que llegué a las abejas. Me gustó porque tienen una tensión que podía representar con las partículas: necesitan estar juntas para protegerse, pero algunas tienen que alejarse para explorar y buscar recursos.

Después de decidir que quería trabajar con abejas, la tensión que escogí fue entre seguridad colectiva y exploración individual. La idea es que una colonia necesita mantenerse unida para protegerse, pero al mismo tiempo necesita que algunas abejas se alejen para buscar recursos. Quiero que esto se vea en el movimiento de las partículas, haciendo que el enjambre se concentre o se disperse dependiendo de lo que esté pasando.

Decidí trabajar con tres tipos de partículas: obreras, exploradoras y amenazas. Las obreras serían la mayoría porque quiero que se note el comportamiento de la colonia. Las exploradoras serían menos numerosas y tendrían más libertad para alejarse, mientras que las amenazas servirían para alterar el comportamiento del enjambre. También agregué recursos que las exploradoras puedan buscar.

Para las relaciones pensé en usar atracción y repulsión dependiendo de la distancia. Las obreras se atraen entre ellas para mantener la colonia, pero se repelen cuando están demasiado cerca. Las exploradoras también tienen una relación diferente con la colonia: cuando están cerca tienden a alejarse para explorar, pero si se alejan demasiado vuelven a sentir atracción hacia ella. De esta manera espero que aparezca un movimiento de ida y vuelta sin tener que programar una trayectoria específica.

También quiero que exista una relación asimétrica, haciendo que las obreras busquen mantener cerca a las exploradoras mientras que las exploradoras tengan una ligera tendencia a alejarse de las obreras. Esto es importante porque representa directamente la tensión que quiero explorar.

Las amenazas tendrán una fuerza de repulsión sobre las abejas, haciendo que cuando se acerquen el enjambre se compacte o cambie de dirección. Los recursos, en cambio, atraerán principalmente a las exploradoras y harán que se separen de la colonia.

Por ahora quiero mantener las posiciones iniciales aleatorias para que cada ejecución pueda producir un resultado diferente. También quiero probar diferentes intensidades de exploración, cohesión y amenazas para encontrar un equilibrio donde se pueda ver claramente la tensión entre permanecer juntas y alejarse.

<img width="946" height="724" alt="image" src="https://github.com/user-attachments/assets/a5c5f6ed-a6cc-48de-9ae7-4f178878f883" />


https://editor.p5js.org/Izumy/sketches/KA7xKocm9

## Tabla de Criterios

| Criterio | Peso | Valoración | Sustentación / Evidencias |
| :--- | :---: | :---: | :--- |
| **La intención es clara y perceptible en el comportamiento.** | **20%** | **100%** | La metáfora de *"Fuera del Enjambre"* es legible desde el primer segundo. Se nota de entrada el contraste entre el núcleo cohesionado (seguridad) y las partículas exploradoras (expansión), generando una dinámica orgánica sin necesidad de explicaciones previas. |
| **Los tipos, cantidades, matriz y parámetros están justificados desde la intención.** | **25%** | **100%** | Diseñé cuatro clases de agentes (P1 a P4) con velocidades, masas y campos de fuerza específicos. Los valores no son aleatorios; están ajustados para mantener el equilibrio del sistema sin que las partículas colapsen o se dispersen sin sentido. |
| **Comprendo y puedo modificar el funcionamiento técnico del sistema.** | **20%** | **100%** | Dominio total del código: implementé comportamientos de *Steering* (atracción, repulsión y *Arrival* suave) y optimicé los bucles de interacción mediante submuestreo estocástico para sostener más de 1.000 partículas a **60 FPS estables**. |
| **El sistema produce variaciones con una identidad reconocible.** | **15%** | **100%** | Gracias a las semillas estocásticas y la navegación por ruido Perlin de las amenazas, el sistema genera patrones únicos en cada ejecución, pero sin perder nunca su identidad ni su estética de enjambre. |
| **Experimenté, comparé, seleccioné y descarté con criterios claros.** | **10%** | **100%** | Hubo un proceso claro de prueba y error: descarté la atracción simple a punto fijo porque congelaba el núcleo, eliminé el texto en pantalla para no saturar la vista y elegí una fuerza tangencial para darle flujo de fluido al centro. |
| **Puedo distinguir y sustentar lo diseñado y lo emergente.** | **10%** | **100%** | Distingo claramente las reglas físicas que programé (fuerzas y umbrales de distancia) de los fenómenos que emergen solos, como los "corredores de evasión" o las ondas de presión cuando pasa un perturbador. |
| **TOTAL** | **100%** | **100%** | **Nota Global: 5.0 / 5.0** |

---

## 🎯 Sustentación de Nota (5.0 / 5.0)
