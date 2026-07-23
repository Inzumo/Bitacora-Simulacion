// --- CONFIGURACIÓN DE RESOLUCIÓN Y CANVAS VIRTUAL ---
const RES_X = 384;
const RES_Y = 672;

let buffer; // Offscreen graphics buffer para garantizar pixelation
let t = 0;   // Contador de tiempo global para animaciones sinusoidales y noise

// --- ESTADO DE NAVEGACIÓN Y TRANSICIÓN ---
let barcoActualIndex = 0;
let barcoTransicionIndex = 0;
let factorTransicion = 1; // 1 = Totalmente visible, 0 = Transición activa
let animacionOpacidad = 255;

// --- ELEMENTOS DE AMBIENTE PROCEDURAL ---
let estrellas = [];
let nubes = [];
let particulasLuz = [];
let peces = [];
let gaviotas = [];

// --- BASE DE DATOS FILTRADA: SOLO BARCOS PROPIEDAD DE LUFFY ---
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

// ==============================================================================
// SETUP & INICIALIZACIÓN
// ==============================================================================
function setup() {
  let h = windowHeight;
  let w = h * (9 / 16);
  createCanvas(w, h);

  buffer = createGraphics(RES_X, RES_Y);
  buffer.noSmooth();

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
  
  // Factor del ciclo día/noche (0 = Noche profunda, 1 = Día soleado)
  let factorDia = (sin(t * 0.1) + 1) / 2;

  // --- CÁMARA FLOTANTE DINÁMICA ---
  let camX = sin(t * 0.8) * 1.5;
  let camY = cos(t * 0.6) * 1.5;
  buffer.translate(camX, camY);

  // --- RENDERS DE ESCENA ---
  dibujarCielo(factorDia);
  dibujarAstroYBrillo(factorDia);
  dibujarNubes(factorDia);
  dibujarGaviotas(factorDia);
  dibujarMarFondo(factorDia);

  // --- RENDERIZADO DE BARCOS ---
  dibujarEscenaBarco(factorDia);

  dibujarMarFrente(factorDia);
  dibujarPeces();
  dibujarParticulasAmbiente(factorDia);
  dibujarEfectosIluminacionHD(factorDia);

  buffer.pop(); // Reset de cámara

  // --- INTERFAZ RPG ---
  dibujarUI();
  gestionarTransicion();

  // --- ESCALADO AL CANVAS ---
  noSmooth();
  image(buffer, 0, 0, width, height);

  t += 0.03;
}

// ==============================================================================
// AMBIENTE DÍA / NOCHE (CIELO, SOL, LUNA, MAR)
// ==============================================================================

function dibujarCielo(factorDia) {
  buffer.noStroke();
  for (let y = 0; y < RES_Y * 0.55; y += 2) {
    let inter = map(y, 0, RES_Y * 0.55, 0, 1);
    
    // Colores de Noche
    let cNoche1 = color(8, 12, 28);
    let cNoche2 = color(25, 45, 80);
    
    // Colores de Día
    let cDia1 = color(100, 180, 245);
    let cDia2 = color(190, 230, 255);

    let c1 = lerpColor(cNoche1, cDia1, factorDia);
    let c2 = lerpColor(cNoche2, cDia2, factorDia);
    let c = lerpColor(c1, c2, inter);
    
    buffer.fill(c);
    buffer.rect(0, y, RES_X, 2);
  }

  // Estrellas (Visibles solo de noche)
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
  let ay = map(factorDia, 0, 1, 100, 50); // Movimiento sutil de altura

  buffer.noStroke();

  if (factorDia > 0.5) {
    // SOL
    let alphaSol = map(factorDia, 0.5, 1, 0, 255);
    for (let r = 35; r > 0; r -= 4) {
      buffer.fill(255, 220, 100, map(r, 0, 35, 60, 0) * (alphaSol / 255));
      buffer.ellipse(ax, ay, r * 2, r * 2);
    }
    buffer.fill(255, 240, 150, alphaSol);
    buffer.ellipse(ax, ay, 28, 28);
  } else {
    // LUNA
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
    
    let c = lerpColor(cBase1, cBase2, inter);
    buffer.fill(c);
    buffer.rect(0, y, RES_X, 3);

    // Reflejo dinámico del Astro
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
  // Ajuste sutil de sombra en bordes según la hora
  buffer.noFill();
  let alphaVignette = map(factorDia, 0, 1, 80, 30);
  for (let i = 0; i < 15; i++) {
    let a = map(i, 0, 15, alphaVignette, 0);
    buffer.stroke(5, 8, 18, a);
    buffer.rect(i, i, RES_X - i * 2, RES_Y - i * 2);
  }
}

// ==============================================================================
// GESTIÓN DE RENDERIZADO Y FÍSICA DEL BARCO
// ==============================================================================

function dibujarEscenaBarco(factorDia) {
  let elevacionOla = sin(t * 2) * 5 + noise(t) * 3;
  let anguloMecido = cos(t * 1.4) * 0.05 + (noise(t * 0.5) - 0.5) * 0.03;

  buffer.push();
  buffer.translate(RES_X * 0.5, RES_Y * 0.58 + elevacionOla);
  buffer.rotate(anguloMecido);

  // Sombra del barco sobre el mar
  buffer.noStroke();
  buffer.fill(5, 15, 35, map(factorDia, 0, 1, 130, 80));
  buffer.ellipse(0, 22, 120, 18);

  // Espuma de la proa
  if (elevacionOla > 2) {
    buffer.fill(240, 250, 255, 200);
    buffer.rect(-55, 15, 110, 3, 2);
  }

  // Tinte dinámico día/noche sobre los sprites
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

// ==============================================================================
// RENDERIZADO PIXEL ART DE LOS BARCOS DE LUFFY
// ==============================================================================

// --- 1. GOING MERRY ---
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

  // JOLLY ROGER DE LUFFY
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

  // MASCARÓN DE PROA: CABEZA DE OVEJA
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

// --- 2. THOUSAND SUNNY ---
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

  // MASCARÓN: SOL / LEÓN
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

// --- 3. MINI MERRY II ---
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
// INTERFAZ DE USUARIO (UI) ESTILO RPG
// ==============================================================================

function dibujarUI() {
  let data = BASE_DATOS_BARCOS[barcoActualIndex];

  buffer.fill(10, 16, 28, 235);
  buffer.stroke(data.colorTema[0], data.colorTema[1], data.colorTema[2]);
  buffer.strokeWeight(2);
  buffer.rect(12, RES_Y - 175, RES_X - 24, 160, 6);

  buffer.stroke(40, 60, 90);
  buffer.strokeWeight(1);
  buffer.rect(16, RES_Y - 171, RES_X - 32, 152, 4);

  buffer.noStroke();
  buffer.fill(data.colorTema);
  buffer.textSize(14);
  buffer.textStyle(BOLD);
  buffer.textAlign(LEFT);
  buffer.text(data.nombre, 26, RES_Y - 148);

  buffer.fill(180, 195, 210);
  buffer.textSize(9);
  buffer.textStyle(NORMAL);
  buffer.text(`NAVIO ${barcoActualIndex + 1} DE ${BASE_DATOS_BARCOS.length}`, RES_X - 110, RES_Y - 148);

  buffer.fill(230, 240, 255);
  buffer.textSize(9);
  buffer.text(`• Saga: ${data.saga}`, 26, RES_Y - 130);
  buffer.text(`• Debut: ${data.primeraAparicion}`, 26, RES_Y - 116);
  buffer.text(`• Cierre: ${data.ultimaAparicion}`, 26, RES_Y - 102);

  buffer.fill(170, 195, 220);
  buffer.textStyle(ITALIC);
  buffer.text(`"${data.curiosidad}"`, 26, RES_Y - 84, RES_X - 52, 38);

  let parpadeo = sin(t * 6) * 120 + 135;
  buffer.fill(0, 220, 255, parpadeo);
  buffer.textStyle(BOLD);
  buffer.textAlign(CENTER);
  buffer.text("► HAZ CLIC PARA CAMBIAR EL BARCO DE LUFFY ◄", RES_X / 2, RES_Y - 24);
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