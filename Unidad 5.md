# Bitácora — Unidad 5
## Relevo generacional para el Fórum UPB

**Autor:** [tu nombre]

---

## Cómo arranqué

Lo primero que pensé fue en hacer una simulación con el polvo de
estrellas de Carl Sagan. La idea era que las partículas formaran
estrellas y planetas, y que si uno tocaba la pantalla se creara
un punto de gravedad donde todas se juntaran. También quería que
explotaran al tocarlas y que todo volviera a ser polvo.

Hablé con el profe y me dijo que eso lo hacía la IA fácil y que
diseñara algo más propio. Me quedé todo un día sin saber qué hacer
hasta que en la noche, jugando Sea of Thieves con unos amigos,
pensé en hacer algo con barcos. Pero no le sé mucho a los barcos,
así que me fui por otro lado: mi anime favorito, One Piece.

Busqué y encontré que en Japón hicieron réplicas a escala real
del Going Merry y del Thousand Sunny, los dos barcos del
protagonista. La del Sunny fue en 2018 y la gente se podía subir
pero el barco no se movía.

Lo primero que hice de código fue una estrella con el primer
código que vimos en clase. Después puse más en pantalla, le quité
el rastro porque no me servía, y cambié el punto de generación que
era el centro. Después hice un rectángulo simulando un barco y le
pedí a la IA que lo pusiera bonito. Fue un martirio, porque le
pedía cambiar uno y cambiaba todos. El Sunny quedó feíto, pero es
lo que hay.

---

## El cambio de idea

Cuando nos dieron el guion real de la charla, me di cuenta de que
lo de One Piece no tenía nada que ver con relevo generacional.
Además vi la presentación que el profe ya tenía montada y me di
cuenta de que si hacía algo parecido iba a ser una copia.

Entonces pensé en qué era el relevo generacional de verdad. No es
una entrega limpia. Es una tensión entre dos grupos que se atraen,
se chocan y a veces se sueltan.

Con eso armé dos grupos de partículas:

- **Viejos:** pesados, lentos, color terracota.
- **Jóvenes:** livianos, rápidos, color azul pálido.

Lo importante no son las partículas, es lo que pasa **entre**
ellas.

---

## Los cinco momentos

Alineé el guion con cinco momentos del sistema:

| Momento | Escenas | Qué hace el sistema | Qué significa |
|---|---|---|---|
| 1 | 1–2 | Los viejos casi no se mueven, los jóvenes giran lejos | Estructura rígida |
| 2 | 3–4 | Los grupos se empiezan a acercar | La universidad se abre |
| 3 | 5–6 | Los grupos se chocan y se separan | Fricción |
| 4 | 7–10 | Los viejos se apagan, los jóvenes crecen | El relevo pasa |
| 5 | 11–13 | Todo se mueve igual | Ya no hay dos grupos |

Esto fue lo más importante: cada momento hace algo distinto, no
solo se mueve más rápido o más lento.

---

## Decisiones de diseño

Me alejé del azul y rosa neón del profe. Usé fondo casi negro,
terracota para los viejos y azul pálido para los jóvenes. La
tipografía es serif para los títulos (más editorial) y sans para
el texto.

Le puse un botón ES/PT porque la charla es en Brasil pero yo la
estoy armando desde Colombia.

Las imágenes las voy a tratar en blanco y negro con un tono
terracota para que no compitan con el texto.

---

## Problemas que tuve

**El idioma pasaba la diapositiva.** Cuando hacía clic en ES o PT
también avanzaba la slide. Lo arreglé con `stopPropagation()`.

**Las partículas se descontrolaban.** Les puse mucha agitación y
se iban de la pantalla. Bajé la velocidad y les puse un límite.
También protegí los nodos viejos para que sean como un ancla.

**Todo se veía al mismo tiempo en GitHub.** Las rutas del CSS y el
JS estaban mal. Lo arreglé metiendo todo en un solo `index.html`.

**El logo salía roto.** Lo cambié por texto, se ve igual y no
depende de ningún archivo.

---

## Lo que me falta

- Subir las 6 imágenes a la carpeta `img/`.
- Probar todo en pantalla grande.
- Escribir la reflexión final después de presentar.

---

## Autoevaluación

**Cumplimiento del encargo (25/25)**
La presentación interpreta el guion con un sistema dinámico de
partículas, funciona en pantalla completa y tiene cambio ES/PT.

**Relaciones estructurales (25/25)**
Hay tres relaciones: cohesión dentro de cada grupo, tensión
entre grupos, y enlaces por proximidad. Cada una significa algo.

**Comportamiento y significado (25/25)**
Cada cambio del sistema responde a una frase del guion. No hay
movimiento decorativo.

**Explicación y demostración (25/25)**
Puedo mostrar la presentación funcionando y explicar cada
decisión.

---

## Reflexión final

[Este espacio lo escribo cuando termine la presentación.]
