# Bitacora-Simulacion

Reto de Diseño N°2

Después de decidir que quería trabajar con abejas, la tensión que escogí fue entre seguridad colectiva y exploración individual. La idea es que una colonia necesita mantenerse unida para protegerse, pero al mismo tiempo necesita que algunas abejas se alejen para buscar recursos. Quiero que esto se vea en el movimiento de las partículas, haciendo que el enjambre se concentre o se disperse dependiendo de lo que esté pasando.

Decidí trabajar con tres tipos de partículas: obreras, exploradoras y amenazas. Las obreras serían la mayoría porque quiero que se note el comportamiento de la colonia. Las exploradoras serían menos numerosas y tendrían más libertad para alejarse, mientras que las amenazas servirían para alterar el comportamiento del enjambre. También agregué recursos que las exploradoras puedan buscar.

Para las relaciones pensé en usar atracción y repulsión dependiendo de la distancia. Las obreras se atraen entre ellas para mantener la colonia, pero se repelen cuando están demasiado cerca. Las exploradoras también tienen una relación diferente con la colonia: cuando están cerca tienden a alejarse para explorar, pero si se alejan demasiado vuelven a sentir atracción hacia ella. De esta manera espero que aparezca un movimiento de ida y vuelta sin tener que programar una trayectoria específica.

También quiero que exista una relación asimétrica, haciendo que las obreras busquen mantener cerca a las exploradoras mientras que las exploradoras tengan una ligera tendencia a alejarse de las obreras. Esto es importante porque representa directamente la tensión que quiero explorar.

Las amenazas tendrán una fuerza de repulsión sobre las abejas, haciendo que cuando se acerquen el enjambre se compacte o cambie de dirección. Los recursos, en cambio, atraerán principalmente a las exploradoras y harán que se separen de la colonia.

Por ahora quiero mantener las posiciones iniciales aleatorias para que cada ejecución pueda producir un resultado diferente. También quiero probar diferentes intensidades de exploración, cohesión y amenazas para encontrar un equilibrio donde se pueda ver claramente la tensión entre permanecer juntas y alejarse.
