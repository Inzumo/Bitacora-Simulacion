# Bitacora-Simulacion

Reto de Diseño N°3

El objetivo fue encontrar la tensión expresiva del instrumento. En lugar de ajustar valores al azar, me enfoqué en la pieza LesAlpx de Floating Points para traducir su dinámica: la respiración entre un orden orgánico/cohesión armónica y su expansión caótica/volcánica.

FICHA DE FUERZASA. Fuerza Radial (Atracción / Repulsión)Ecuación: $\vec{F}_{\text{radial}} = \frac{k_{\text{radial}}}{\Vert{}\vec{r}\Vert{}^2 + 0.01} \cdot \hat{r}$Parámetros: radialEnabled (0/1), radialStrength ($-20.0$ a $+20.0$).Diseño: Con $k < 0$ genera atracción al cursor. Mapeé $k = +18.0$ a la Barra Espaciadora para generar disparos expansivos rítmicos.B. Fuerza de VórticeEcuación: $\vec{F}_{\text{vortex}} = \frac{k_{\text{vortex}}}{\Vert{}\vec{r}\Vert{}} \cdot (-r_y, r_x, 0)$Parámetros: vortexEnabled (0/1), vortexStrength ($-10.0$ a $+10.0$).Diseño: Aporta un vector tangencial para evitar el colapso estático y dar movimiento fluido.C. Drag (Fricción)Ecuación: $\vec{v}_{t+\Delta t} = \vec{v}_t \cdot \max(0, 1 - C_{\text{drag}} \cdot \Delta t \cdot 10)$Parámetros: dragEnabled (0/1), dragCoefficient ($0.0$ a $0.5$).Diseño: Disipa energía para recuperar estabilidad tras cada repulsión.
