// --- CONFIGURACIÓN DE RESOLUCIÓN Y CANVAS VIRTUAL ---
const RES_X = 384;
const RES_Y = 672;

let buffer; // Offscreen graphics buffer para garantizar pixelation
let t = 0;   // Contador de tiempo global

// --- ESTADO DE NAVEGACIÓN Y MOMENTOS (ACT. 07) ---
// 0: POSIBILIDAD, 1: TENDENCIA, 2: NORMALIDAD, 3: EXCEPCIÓN, 4: INFLUENCIA
let momentoActual = 0; 
let factorTransicion = 1; // 1 = Totalmente visible, 0 = Transición activa
let animacionOpacidad = 255;

// --- POSICIÓN Y FÍSICA ESTOCÁSTICA ---
let posX, posY;
let velX = 0, velY = 0;
let estela = [];

// --- SELECCIÓN DE BARCOS Y LORE ---
let barcoActualIndex = 0;
let barcoTransicionIndex = 0;

// --- BASE DE DATOS DETALLADA DE BARCOS ---
const BASE_DATOS_BARCOS = [
  {
    nombre: "GOING MERRY",
    saga: "East Blue -> Water 7",
    primeraAparicion: "Capítulo 41 / Ep. 17",
    ultimaAparicion: "Capítulo 430 / Ep. 312",
    curiosidad: "Primer barco oficial de los Sombrero de Paja. Tenía un Klabautermann.",
    colorTema: [255, 230, 180]
  },
  {
    nombre: "THOUSAND SUNNY",
    saga: "Post-Enies Lobby -> Actualidad",
    primeraAparicion: "Capítulo 436 / Ep. 321",
    ultimaAparicion: "En navegación activa",
    curiosidad: "El 'Barco de los Mil Mares' diseñado por Franky con Madera del Árbol Adam.",
    colorTema: [255, 170, 0]
  },
  {
    nombre: "MINI MERRY II",
    saga: "Thriller Bark -> Actualidad",
    primeraAparicion: "Capítulo 444 / Ep. 338",
    ultimaAparicion: "En servicio en el Sunny",
    curiosidad: "Bote a vapor de 4 plazas propiedad de la tripulación, guardado en el Canal 2.",
    colorTema: [240, 200, 140]
  }
];

// --- ELEMENTOS DE AMBIENTE PROCEDURAL HD ---
let estrellas = [];
let nubes = [];
let particulasLuz = [];
let peces = [];
let gaviotas = [];

// ==============================================================================
// SETUP & INICIALIZACIÓN
// ==============================================================================
function setup() {
  let h = windowHeight;
  let w = h * (9 / 16);
  createCanvas(w, h);

  buffer = createGraphics(RES_X, RES_Y);
  buffer.noSmooth();

  // Posición inicial de navegación
  posX = RES_X / 2;
  posY = RES_Y * 0.58;

  // Elementos ambientales
  for (let i = 0; i < 90; i++) {
    estrellas.push({
      x: random(RES_X),
      y: random(RES_Y * 0.45),
      size: random([1, 1, 1, 2]),
      fase: random(TWO_PI),
      velocidad: random(0.02, 0.05)
    });
  }

  for (let i = 0; i < 6; i++) {
    nubes.push({
      x: random(RES_X),
      y: random(20, 140),
      ancho: random(40, 90),
      velocidad: random(0.05, 0.15)
    });
  }

  for (let i = 0; i < 25; i++) {
    particulasLuz.push({
      x: random(RES_X),
      y: random(RES_Y * 0.5, RES_Y * 0.8),
      vy: random(-0.2, -0.6),
      size: random(1, 2),
      alpha: random(100, 255)
    });
  }

  for (let i = 0; i < 4; i++) {
    gaviotas.push({
      x: random(-100, RES_X),
      y: random(30, 110),
      vx: random(0.3, 0.8),
      fase: random(TWO_PI)
    });
  }

  for (let i = 0; i < 4; i++) {
    peces.push({
      x: random(RES_X),
      y: random(RES_Y * 0.75, RES_Y * 0.82),
      vx: random([-0.5, 0.5]),
      fase: random(TWO_PI)
    });
  }
}

// ==============================================================================
// BUCLE PRINCIPAL DE RENDERIZADO
// ==============================================================================
function draw() {
  buffer.push();
  
  let factorDia = (sin(t * 0.1) + 1) / 2; // Ciclo día/noche

  // --- CÁMARA FLOTANTE DINÁMICA ---
  let camX = sin(t * 0.8) * 1.5;
  let camY = cos(t * 0.6) * 1.5;
  buffer.translate(camX, camY);

  // --- 1. RENDERS DE FONDO Y CIELO ---
  dibujarCielo(factorDia);
  dibujarAstroYBrillo(factorDia);
  dibujarNubes(factorDia);
  dibujarGaviotas(factorDia);

  // --- 2. RENDERS DEL MAR (FONDO Y FRENTE) ---
  dibujarMarFondo(factorDia);
  dibujarMarFrente(factorDia);
  dibujarPeces();

  // --- 3. CICLO AUTÓNOMO DE MOMENTOS (ACT. 07) ---
  if (!mouseIsPressed && frameCount % 480 === 0) {
    momentoActual = (momentoActual + 1) % 5;
  }

  // Comprobar si el usuario ejerce el MOMENTO 5: INFLUENCIA
  let momentoEfectivo = momentoActual;
  let mx = map(mouseX, 0, width, 0, RES_X);
  let my = map(mouseY, 0, height, 0, RES_Y);

  if (mouseIsPressed || (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)) {
    if (dist(mx, my, posX, posY) < 120) {
      momentoEfectivo = 4;
    }
  }

  // --- 4. ACTUALIZACIÓN Y RENDERIZADO DEL BARCO (SOBRE EL AGUA) ---
  actualizarNavegacionEstocastica(momentoEfectivo, mx, my);
  dibujarEstela();
  dibujarEscenaBarco(factorDia);

  // --- 5. EFECTOS ATMOSFÉRICOS Y LUZ ---
  dibujarParticulasAmbiente(factorDia);
  dibujarEfectosIluminacionHD(factorDia);

  buffer.pop(); // Reset de cámara

  // --- 6. INTERFAZ RPG Y TRANSICIONES ---
  dibujarUI();
  gestionarTransicion();

  // ESCALADO FULLSCREEN 9:16
  noSmooth();
  image(buffer, 0, 0, width, height);

  t += 0.03;
}

// ==============================================================================
// MOTOR DE ALEATORIEDAD ESTOCÁSTICA (ACT. 07)
// ==============================================================================
function actualizarNavegacionEstocastica(momento, mx, my) {
  let fuerzaX = 0;
  let fuerzaY = 0;

  switch (momento) {
    case 0: // 1. POSIBILIDAD (Random Walk)
      fuerzaX = random(-1.6, 1.6);
      fuerzaY = random(-1.0, 1.0);
      break;

    case 1: // 2. TENDENCIA (Perlin Noise)
      let angulo = noise(posX * 0.006, posY * 0.006, t * 0.4) * TWO_PI * 2;
      fuerzaX = cos(angulo) * 2.0 + 0.4;
      fuerzaY = sin(angulo) * 0.9;
      break;

    case 2: // 3. NORMALIDAD (Distribución Gaussiana)
      let centroX = RES_X / 2;
      let centroY = RES_Y * 0.58;
      fuerzaX = (centroX - posX) * 0.035 + randomGaussian(0, 0.9);
      fuerzaY = (centroY - posY) * 0.035 + randomGaussian(0, 0.6);
      break;

    case 3: // 4. EXCEPCIÓN (Vuelo de Lévy)
      let paso = random(1) < 0.02 ? random(30, 60) : random(0.3, 0.9);
      let dir = random(TWO_PI);
      fuerzaX = cos(dir) * paso;
      fuerzaY = sin(dir) * paso;
      break;

    case 4: // 5. INFLUENCIA (Atracción Directa)
      fuerzaX = (mx - posX) * 0.04 + randomGaussian(0, 0.6);
      fuerzaY = (my - posY) * 0.04 + randomGaussian(0, 0.6);
      break;
  }

  velX = lerp(velX, fuerzaX, 0.1);
  velY = lerp(velY, fuerzaY, 0.1);

  posX = constrain(posX + velX, 60, RES_X - 60);
  posY = constrain(posY + velY, RES_Y * 0.50, RES_Y * 0.68);

  estela.push({ x: posX, y: posY + 15, alpha: 200 });
  if (estela.length > 40) estela.shift();
}

// ==============================================================================
// AMBIENTE DÍA / NOCHE Y EFECTOS VISUALES HD
// ==============================================================================
function dibujarCielo(factorDia) {
  buffer.noStroke();
  for (let y = 0; y < RES_Y * 0.55; y += 2) {
    let inter = map(y, 0, RES_Y * 0.55, 0, 1);
    let cNoche1 = color(8, 12, 28);
    let cNoche2 = color(25, 45, 80);
    let cDia1 = color(100, 180, 245);
    let cDia2 = color(190, 230, 255);

    let c1 = lerpColor(cNoche1, cDia1, factorDia);
    let c2 = lerpColor(cNoche2, cDia2, factorDia);
    buffer.fill(lerpColor(c1, c2, inter));
    buffer.rect(0, y, RES_X, 2);
  }

  if (factorDia < 0.5) {
    let alphaEstrellas = map(factorDia, 0, 0.5, 255, 0);
    for (let e of estrellas) {
      let brillo = map(sin(t * e.velocidad * 10 + e.fase), -1, 1, 50, alphaEstrellas);
      buffer.fill(240, 245, 255, brillo);
      buffer.rect(e.x, e.y, e.size, e.size);
    }
  }
}

function dibujarAstroYBrillo(factorDia) {
  let ax = RES_X * 0.78;
  let ay = map(factorDia, 0, 1, 100, 50);
  buffer.noStroke();

  if (factorDia > 0.5) {
    let alphaSol = map(factorDia, 0.5, 1, 0, 255);
    for (let r = 35; r > 0; r -= 4) {
      buffer.fill(255, 220, 100, map(r, 0, 35, 60, 0) * (alphaSol / 255));
      buffer.ellipse(ax, ay, r * 2, r * 2);
    }
    buffer.fill(255, 240, 150, alphaSol);
    buffer.ellipse(ax, ay, 28, 28);
  } else {
    let alphaLuna = map(factorDia, 0, 0.5, 255, 0);
    for (let r = 35; r > 0; r -= 4) {
      buffer.fill(220, 240, 255, map(r, 0, 35, 40, 0) * (alphaLuna / 255));
      buffer.ellipse(ax, ay, r * 2, r * 2);
    }
    buffer.fill(245, 250, 255, alphaLuna);
    buffer.ellipse(ax, ay, 26, 26);
    buffer.fill(210, 220, 235, alphaLuna);
    buffer.rect(ax - 6, ay - 3, 5, 5);
    buffer.rect(ax + 2, ay + 3, 6, 4);
  }
}

function dibujarNubes(factorDia) {
  buffer.noStroke();
  let cNube = lerpColor(color(20, 35, 65, 140), color(255, 255, 255, 210), factorDia);
  let cSombra = lerpColor(color(40, 60, 100, 90), color(200, 220, 240, 160), factorDia);

  for (let n of nubes) {
    n.x += n.velocidad;
    if (n.x > RES_X + 50) n.x = -100;

    buffer.fill(cNube);
    buffer.rect(n.x, n.y, n.ancho, 12, 4);
    buffer.rect(n.x + 10, n.y - 6, n.ancho * 0.6, 8, 3);
    buffer.fill(cSombra);
    buffer.rect(n.x + 5, n.y + 6, n.ancho - 10, 4);
  }
}

function dibujarGaviotas(factorDia) {
  let cGaviota = lerpColor(color(200), color(40), factorDia);
  buffer.fill(cGaviota);
  buffer.noStroke();
  for (let g of gaviotas) {
    g.x += g.vx;
    if (g.x > RES_X + 20) g.x = -30;
    let ala = sin(t * 5 + g.fase) * 3;
    let gy = g.y + sin(t + g.fase) * 2;

    buffer.rect(g.x, gy, 2, 2);
    buffer.rect(g.x - 2, gy - ala, 2, 2);
    buffer.rect(g.x + 2, gy - ala, 2, 2);
  }
}

function dibujarMarFondo(factorDia) {
  buffer.noStroke();
  let inicioMar = RES_Y * 0.50;
  let cMarNoche = color(18, 45, 85);
  let cMarDia = color(0, 135, 200);

  for (let y = inicioMar; y < RES_Y * 0.65; y += 3) {
    let inter = map(y, inicioMar, RES_Y, 0, 1);
    let cBase1 = lerpColor(cMarNoche, cMarDia, factorDia);
    let cBase2 = lerpColor(color(10, 25, 50), color(0, 80, 140), factorDia);

    buffer.fill(lerpColor(cBase1, cBase2, inter));
    buffer.rect(0, y, RES_X, 3);

    let n = noise(y * 0.05, t * 0.5);
    if (n > 0.4) {
      let refX = RES_X * 0.78 + sin(y * 0.1 + t) * 15;
      let anchoRef = map(y, inicioMar, RES_Y, 30, 5);
      let cRef = lerpColor(color(220, 245, 255), color(255, 240, 180), factorDia);
      buffer.fill(red(cRef), green(cRef), blue(cRef), map(n, 0.4, 1, 30, 150));
      buffer.rect(refX - anchoRef / 2, y, anchoRef * n, 2);
    }
  }
}

function dibujarMarFrente(factorDia) {
  buffer.noStroke();
  let inicioMarFrente = RES_Y * 0.65;
  let cProfundo = lerpColor(color(12, 30, 60), color(0, 60, 110), factorDia);

  for (let y = inicioMarFrente; y < RES_Y * 0.82; y += 4) {
    let n = noise(y * 0.02, t * 0.8);
    let offsetOla = sin(t * 2 + y * 0.05) * 4;

    buffer.fill(cProfundo);
    buffer.rect(0, y + offsetOla, RES_X, 4);

    if (n > 0.62) {
      buffer.fill(240, 250, 255, map(factorDia, 0, 1, 160, 220));
      let xFoam = (sin(y + t) * 100 + RES_X / 2) % RES_X;
      buffer.rect(xFoam, y + offsetOla, random(10, 30), 2);
    }
  }
}

function dibujarPeces() {
  buffer.noStroke();
  for (let p of peces) {
    p.x += p.vx;
    if (p.x > RES_X + 20) p.x = -20;
    if (p.x < -20) p.x = RES_X + 20;

    let py = p.y + sin(t * 3 + p.fase) * 3;
    buffer.fill(0, 180, 200, 140);
    buffer.rect(p.x, py, 4, 2);
    buffer.rect(p.x - p.vx * 2, py, 2, 1);
  }
}

function dibujarParticulasAmbiente(factorDia) {
  buffer.noStroke();
  let cPart = lerpColor(color(255, 230, 150), color(255, 255, 255), factorDia);
  for (let p of particulasLuz) {
    p.y += p.vy;
    if (p.y < RES_Y * 0.45) {
      p.y = RES_Y * 0.8;
      p.x = random(RES_X);
    }
    let a = map(sin(t * 2 + p.x), -1, 1, 20, p.alpha);
    buffer.fill(red(cPart), green(cPart), blue(cPart), a);
    buffer.rect(p.x, p.y, p.size, p.size);
  }
}

function dibujarEfectosIluminacionHD(factorDia) {
  buffer.noFill();
  let alphaVignette = map(factorDia, 0, 1, 80, 30);
  for (let i = 0; i < 15; i++) {
    let a = map(i, 0, 15, alphaVignette, 0);
    buffer.stroke(5, 8, 18, a);
    buffer.rect(i, i, RES_X - i * 2, RES_Y - i * 2);
  }
}

function dibujarEstela() {
  buffer.noStroke();
  for (let i = 0; i < estela.length; i++) {
    let e = estela[i];
    let tam = map(i, 0, estela.length, 3, 32);
    let alp = map(i, 0, estela.length, 5, 170);

    buffer.fill(240, 252, 255, alp);
    buffer.ellipse(e.x, e.y, tam, tam * 0.28);
    buffer.fill(0, 180, 220, alp * 0.4);
    buffer.ellipse(e.x, e.y + 1, tam * 1.1, tam * 0.35);
  }
}

// ==============================================================================
// GESTIÓN Y RENDERIZADO DETALLADO DE LOS BARCOS
// ==============================================================================
function dibujarEscenaBarco(factorDia) {
  let elevacionOla = sin(t * 2) * 5 + noise(t) * 3;
  let anguloMecido = cos(t * 1.4) * 0.05 + (noise(t * 0.5) - 0.5) * 0.03;

  buffer.push();
  buffer.translate(posX, posY + elevacionOla);
  buffer.rotate(anguloMecido);

  // Sombra proyectada
  buffer.noStroke();
  buffer.fill(5, 15, 35, map(factorDia, 0, 1, 130, 80));
  buffer.ellipse(0, 22, 120, 18);

  // Espuma
  if (elevacionOla > 2) {
    buffer.fill(240, 250, 255, 200);
    buffer.rect(-55, 15, 110, 3, 2);
  }

  // Tinte Día/Noche sobre el sprite
  let tinteOscuro = map(factorDia, 0, 1, 170, 255);
  buffer.tint(tinteOscuro, tinteOscuro, tinteOscuro + map(factorDia, 0, 1, 20, 0), animacionOpacidad);

  renderizarBarcoPorIndice(barcoActualIndex);

  buffer.pop();
}

function renderizarBarcoPorIndice(idx) {
  switch (idx) {
    case 0: dibujarGoingMerry(); break;
    case 1: dibujarThousandSunny(); break;
    case 2: dibujarMiniMerry(); break;
  }
}

// --- SPRITES AVANZADOS DE LUFFY ---

function dibujarGoingMerry() {
  buffer.noStroke();

  buffer.fill(90, 50, 25);
  buffer.rect(-45, -5, 90, 22);
  buffer.fill(135, 80, 40);
  buffer.rect(-48, -12, 96, 10);
  buffer.fill(180, 115, 60);
  buffer.rect(-50, -15, 100, 4);

  buffer.fill(240, 240, 230);
  buffer.rect(-50, -18, 100, 4);
  buffer.fill(200, 200, 190);
  buffer.rect(-50, -14, 100, 1);

  buffer.fill(40, 20, 10);
  buffer.rect(-20, -22, 25, 10);
  buffer.fill(255, 220, 100);
  buffer.rect(-15, -18, 4, 4);
  buffer.rect(-8, -18, 4, 4);

  buffer.fill(80, 45, 20);
  buffer.rect(-2, -75, 5, 60);
  buffer.rect(-30, -55, 4, 40);

  buffer.stroke(40, 25, 15, 180);
  buffer.strokeWeight(1);
  let vib = sin(t * 8) * 0.5;
  buffer.line(-45, -12, -2 + vib, -65);
  buffer.line(40, -12, 3 + vib, -65);
  buffer.noStroke();

  let defViento = sin(t * 3) * 3;
  
  buffer.fill(240, 235, 220);
  buffer.rect(-28 + defViento, -70, 56, 42, 2);
  buffer.fill(210, 205, 190);
  buffer.rect(-28 + defViento, -32, 56, 4);

  // JOLLY ROGER
  buffer.fill(30);
  buffer.rect(-10 + defViento, -58, 20, 3);
  buffer.fill(240, 180, 0);
  buffer.rect(-8 + defViento, -64, 16, 6);
  buffer.fill(200, 30, 30);
  buffer.rect(-8 + defViento, -59, 16, 2);
  buffer.fill(245);
  buffer.rect(-7 + defViento, -55, 14, 11);
  buffer.fill(20);
  buffer.rect(-5 + defViento, -52, 4, 4);
  buffer.rect(1 + defViento, -52, 4, 4);

  // MASCARÓN OVEJA
  buffer.fill(240, 240, 235);
  buffer.rect(46, -24, 16, 14);
  buffer.rect(48, -26, 12, 4);
  buffer.fill(160, 110, 50);
  buffer.rect(44, -30, 6, 8);
  buffer.rect(38, -28, 8, 4);
  buffer.fill(210, 150, 70);
  buffer.rect(42, -29, 6, 4);
  buffer.fill(20);
  buffer.rect(56, -20, 3, 3);
  buffer.fill(255, 180, 180);
  buffer.rect(58, -14, 4, 3);

  let ond = sin(t * 6) * 2;
  buffer.fill(200, 30, 30);
  buffer.triangle(-2, -75, -15 + ond, -70, -2, -65);
}

function dibujarThousandSunny() {
  buffer.noStroke();

  buffer.fill(180, 30, 25);
  buffer.rect(-55, -8, 110, 26);
  buffer.fill(220, 45, 35);
  buffer.rect(-58, -16, 116, 10);

  buffer.fill(250, 245, 220);
  buffer.rect(-60, -20, 120, 5);

  buffer.fill(255, 150, 0);
  buffer.rect(-50, 10, 100, 6);

  buffer.fill(40);
  buffer.ellipse(-15, 2, 16, 16);
  buffer.fill(250, 240, 210);
  buffer.ellipse(-15, 2, 12, 12);

  buffer.fill(80, 160, 60);
  buffer.rect(-35, -23, 70, 3);
  buffer.fill(240, 220, 160);
  buffer.rect(-30, -35, 35, 12);

  buffer.fill(110, 55, 20);
  buffer.rect(-20, -85, 7, 65);
  buffer.rect(20, -85, 7, 65);

  buffer.fill(240, 230, 200);
  buffer.rect(-24, -88, 15, 10);
  buffer.rect(16, -88, 15, 10);

  let def = sin(t * 3.5) * 3;
  buffer.fill(250, 245, 230);
  buffer.rect(-48 + def, -80, 32, 48);
  buffer.rect(8 + def, -80, 34, 48);

  // MASCARÓN LEÓN/SOL
  buffer.fill(255, 100, 0);
  buffer.ellipse(58, -18, 30, 30);
  for (let a = 0; a < TWO_PI; a += PI / 4) {
    let rx = 58 + cos(a) * 18;
    let ry = -18 + sin(a) * 18;
    buffer.rect(rx - 2, ry - 2, 5, 5);
  }
  buffer.fill(255, 210, 0);
  buffer.ellipse(58, -18, 22, 22);
  buffer.fill(20);
  buffer.rect(58, -22, 3, 3);
  buffer.rect(64, -22, 3, 3);
  buffer.fill(220, 40, 30);
  buffer.ellipse(61, -16, 4, 4);

  let ond = sin(t * 6) * 3;
  buffer.fill(220, 30, 30);
  buffer.rect(-20, -92, 12 + ond, 6);
}

function dibujarMiniMerry() {
  buffer.noStroke();
  buffer.fill(140, 80, 40);
  buffer.rect(-25, 0, 50, 14);
  buffer.fill(230, 230, 210);
  buffer.rect(-27, -4, 54, 4);

  buffer.fill(60);
  buffer.rect(-10, -22, 6, 18);
  for (let i = 0; i < 3; i++) {
    let hx = -7 + sin(t * 3 + i) * 6;
    let hy = -26 - i * 6;
    buffer.fill(220, 220, 220, 180 - i * 50);
    buffer.ellipse(hx, hy, 6 + i * 2, 6 + i * 2);
  }

  buffer.fill(245);
  buffer.rect(22, -10, 10, 10);
  buffer.fill(160, 110, 50);
  buffer.rect(20, -13, 4, 5);
  buffer.fill(20);
  buffer.rect(28, -8, 2, 2);
}

// ==============================================================================
// INTERFAZ DE USUARIO (UI RPG) - TEXTOS AMPLIADOS
// ==============================================================================
function dibujarUI() {
  let data = BASE_DATOS_BARCOS[barcoActualIndex];

  // Contenedor principal
  buffer.fill(10, 16, 28, 235);
  buffer.stroke(data.colorTema[0], data.colorTema[1], data.colorTema[2]);
  buffer.strokeWeight(2);
  buffer.rect(12, RES_Y - 185, RES_X - 24, 170, 6);

  // Marco interior
  buffer.stroke(40, 60, 90);
  buffer.strokeWeight(1);
  buffer.rect(16, RES_Y - 181, RES_X - 32, 162, 4);

  // Nombre del Barco
  buffer.noStroke();
  buffer.fill(data.colorTema);
  buffer.textSize(18); // Aumentado de 14 a 18
  buffer.textStyle(BOLD);
  buffer.textAlign(LEFT);
  buffer.text(data.nombre, 24, RES_Y - 156);

  // Indicador de selección
  buffer.fill(180, 195, 210);
  buffer.textSize(12); // Aumentado de 9 a 12
  buffer.textStyle(NORMAL);
  buffer.text(`${barcoActualIndex + 1}/${BASE_DATOS_BARCOS.length}`, RES_X - 52, RES_Y - 156);

  // Información de la base de datos
  buffer.fill(230, 240, 255);
  buffer.textSize(12); // Aumentado de 9 a 12
  buffer.text(`• Saga: ${data.saga}`, 24, RES_Y - 136);
  buffer.text(`• Debut: ${data.primeraAparicion}`, 24, RES_Y - 120);
  buffer.text(`• Cierre: ${data.ultimaAparicion}`, 24, RES_Y - 104);

  // Lore / Curiosidad
  buffer.fill(170, 195, 220);
  buffer.textSize(11); // Aumentado de 9 a 11
  buffer.textStyle(ITALIC);
  buffer.text(`"${data.curiosidad}"`, 24, RES_Y - 86, RES_X - 48, 45);

  // Indicador de interacción parpadeante
  let parpadeo = sin(t * 6) * 120 + 135;
  buffer.fill(0, 220, 255, parpadeo);
  buffer.textSize(11); // Aumentado de 9 a 11
  buffer.textStyle(BOLD);
  buffer.textAlign(CENTER);
  buffer.text("► HAZ CLIC PARA CAMBIAR EL BARCO ◄", RES_X / 2, RES_Y - 22);
}

// --- INTERACCIÓN Y TRANSICIÓN ---
function mousePressed() {
  if (factorTransicion >= 1) {
    barcoTransicionIndex = (barcoActualIndex + 1) % BASE_DATOS_BARCOS.length;
    factorTransicion = 0;
  }
}

function gestionarTransicion() {
  if (factorTransicion < 1) {
    factorTransicion += 0.05;

    if (factorTransicion < 0.5) {
      animacionOpacidad = map(factorTransicion, 0, 0.5, 255, 0);
    } else {
      barcoActualIndex = barcoTransicionIndex;
      animacionOpacidad = map(factorTransicion, 0.5, 1, 0, 255);
    }

    let hTinta = sin(factorTransicion * PI) * RES_Y;
    buffer.noStroke();
    buffer.fill(5, 10, 20);
    buffer.rect(0, 0, RES_X, hTinta / 2);
    buffer.rect(0, RES_Y - hTinta / 2, RES_X, hTinta / 2);
  } else {
    animacionOpacidad = 255;
  }
}

function windowResized() {
  let h = windowHeight;
  let w = h * (9 / 16);
  resizeCanvas(w, h);
}