// ¡Pasa pa' Atrás! — Platanus Hack 26: Caracas
// Maneja un Encava por Caracas: recoge pasajeros en las paradas, llévalos a su
// destino y esquiva baches, tráfico, policías acostados y la matraca de la alcabala.

const W = 400;
const H = 300;
const LY = [205, 231, 257]; // línea del suelo de cada carril (0 = izquierdo, 2 = junto a la acera)
const KEY = 'pasa-pa-atras-v1';
const DOOR = 11; // centro de la puerta respecto al centro del bus
const DOCK = 40; // tolerancia (px) entre la puerta y el centro de la parada, hacia adelante o atrás

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

// --- Entrada: un solo jugador, acepta joystick/botones de P1 o P2 ---
const nk = (k) => (k.length === 1 ? k.toLowerCase() : k);
const K2A = {};
for (const [c, ks] of Object.entries(CABINET_KEYS)) for (const k of ks) K2A[nk(k)] = c;
const held = {};
const pressed = {};
addEventListener('keydown', (e) => {
  const c = K2A[nk(e.key)];
  if (!c) return;
  if (!held[c]) pressed[c] = 1;
  held[c] = 1;
  if (AC && AC.state !== 'running') AC.resume();
});
addEventListener('keyup', (e) => {
  const c = K2A[nk(e.key)];
  if (c) held[c] = 0;
});
const hd = (d) => held['P1_' + d] || held['P2_' + d];
const pr = (d) => {
  let r = 0;
  for (const c of d === 'S' ? ['START1', 'START2'] : ['P1_' + d, 'P2_' + d]) if (pressed[c]) { pressed[c] = 0; r = 1; }
  return r;
};

// --- Fuente pixel 5x7 (cada fila = 5 bits en base 32) ---
const FC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!¡?¿.,'-+:/%$xÁÑ()><*= ";
const FD = 'ehjlphe4c4444eeh1248vv2421he26aiv22vgu11he68guhhev124888ehhehheehhf12cehhhvhhuhhuhhuehggghesihhhisvgguggvvggugggehgnhhfhhhvhhhe44444e72222ichikokihggggggvhrllhhhhhpljhhehhhhheuhhugggehhhliduhhukihfgge11uv444444hhhhhhehhhhha4hhhlllahha4ahhhhha444v1248gv44444044044444eh124044048ghe00000cc0000c48c480000000v000044v4400cc0cc001248g0op248j34fke5u40ha4ah024ehvhhdi0hplj248884284222488421248248g8424level400v0v000000000';

// Ruta Propatria → Petare (Línea 1 del Metro de Caracas) y más allá
const STOPS = ['PROPATRIA', 'PEREZ BONALDE', 'PLAZA SUCRE', 'GATO NEGRO', 'AGUA SALUD', 'CAÑO AMARILLO', 'CAPITOLIO', 'LA HOYADA', 'PARQUE CARABOBO', 'BELLAS ARTES', 'COLEGIO DE INGENIEROS', 'PLAZA VENEZUELA', 'SABANA GRANDE', 'CHACAITO', 'CHACAO', 'ALTAMIRA', 'MIRANDA', 'LOS DOS CAMINOS', 'LOS CORTIJOS', 'LA URBINA', 'PETARE', 'PALO VERDE', 'GUARENAS', 'GUATIRE'];
const NM = (i) => STOPS[i % STOPS.length];
const SHOPS = ['AREPERA', 'PANADERIA', 'FARMACIA', 'BODEGA', 'LICORERIA', 'FERRETERIA', 'CHICHA', 'TEQUEÑOS', 'EMPANADAS', 'PELUQUERIA', 'CAFE', 'CACHAPAS', 'ZAPATERIA', 'MERCADITO'];
const COLECTOR = ["¡PASA PA'TRAS!", '¡HAY PUESTO!', "¡ECHENSE PA'TRAS!", '¡CORRANSE, PUES!', '¡SUBE, SUBE!'];
const THANKS = ['¡GRACIAS, MI PANA!', '¡CHEVERE, CHOFER!', '¡FINO!', '¡DIOS LE PAGUE!', '¡EPA, QUE RAPIDO!'];
const HURRY = ['¡CHAMO, APURATE!', '¡QUE LADILLA!', '¡VOY TARDE!', '¡DALE, CHOFER!', '¡MUEVE ESE PEROL!'];
const CRASH = ['¡EPA, CHOFER!', '¡MOSCA, PANA!', '¡AY, MI MADRE!', '¡QUE VAINA!'];
const TIPS = ['FRENA EN EL CUADRO AMARILLO DEL CARRIL DERECHO', 'LLEVA A CADA PASAJERO A SU PARADA', 'SI TE PASAS, ECHA PA\'TRAS CON LA PALANCA', 'CUIDADO CON LOS BACHES: PASA DESPACIO', 'EN LA ALCABALA: MAXIMO 40 KM/H', 'LA CORNETA APARTA A LOS CARROS', 'LAS AREPAS DAN TIEMPO, EL CAFE DA TURBO'];
const DIM = 0x8d8da6;
const SOFT = 0xbbbbcc;
const GOLD = 0xffd400;
const GREEN = 0x8ac926;
const LINE = 0x3a3a55;
const PODIO = [0xffd400, 0xd8dee9, 0xe08a4a]; // oro, plata, bronce
const PC = [0xff595e, 0xffca3a, 0x8ac926, 0x4cc9f0, 0xc77dff, 0xff8fd8, 0xf4a261, 0xffffff];
const VT = [['o0', 20], ['o1', 20], ['o2', 20], ['n0', 21], ['n1', 21], ['n2', 21], ['n3', 21], ['n4', 21], ['s0', 23], ['s1', 23], ['s2', 23], ['pp', 24], ['jp', 19], ['mo', 11], ['mo', 11], ['tr', 32]];

let AVL, S, C, AC, MG, NB, bus, wa, wb, bsh, hg, camX = 0;
const G = { ph: 'title', rank: [], time: 0, mt: 0, ms: 0, mc: 4 };
const ents = [];
const macs = [];
const L = {};
const h = {};

const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let seed = 11;
const sr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const lane = (y) => (y < 218 ? 0 : y < 244 ? 1 : 2);
const mult = () => 1 + Math.min(4, (G.combo / 3) | 0);

new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#15151c',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { create, update },
});

// ---------------------------------------------------------------- gráficos
const R = (c, x, y, w = 1, hh = 1) => {
  C.fillStyle = c;
  C.fillRect(x, y, w, hh);
};
function mk(k, w, hh, f) {
  const t = S.textures.createCanvas(k, w, hh);
  C = t.getContext();
  f();
  t.refresh();
}
function ci(c, cx, cy, r) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r) R(c, cx + x, cy + y);
}
function ptxt(s, x, y, c, o = 0) {
  C.fillStyle = c;
  for (const ch of s) {
    const i = FC.indexOf(ch);
    if (i >= 0) {
      for (let r = 0; r < 7; r++) {
        const b = parseInt(FD[i * 7 + r], 32);
        for (let k = 0; k < 5; k++) if ((b >> (4 - k)) & 1) C.fillRect(x + k - o, y + r - o, 1 + 2 * o, 1 + 2 * o);
      }
    }
    x += 6;
  }
}

function person(k, sk, sh, pa, ha, ex) {
  for (let f = 0; f < 2; f++) {
    mk(k + f, 10, 18, () => {
      R(ha, 2, 0, 5, 2);
      R(sk, 2, 2, 5, 4);
      R(ha, 2, 2, 1, 2);
      R('#222', 3, 3);
      R('#222', 5, 3);
      if (ex == 1) { R(ha, 1, 1, 1, 7); R(ha, 7, 1, 1, 7); }
      if (ex == 2) { R('#c1121f', 2, 0, 5, 2); R('#c1121f', 6, 1, 3, 1); }
      if (ex == 3) { R('#d9b26f', 0, 1, 9, 1); R('#d9b26f', 2, 0, 5, 1); }
      if (ex == 4) R('#111', 1, 0, 6, 2);
      R(sh, 1, 6, 7, 6);
      R(sk, 0, 7, 1, 4);
      if (f) R(sk, 8, 2, 1, 5);
      else R(sk, 8, 7, 1, 4);
      R(pa, 2, 12, 5, 5);
      C.clearRect(4, 14, 1, 3);
      R('#222', 2, 17, 2, 1);
      R('#222', 5, 17, 2, 1);
      if (ex == 5) R('#8b4513', 7, 8, 2, 4);
    });
  }
}

function car(k, w, col, extra) {
  mk(k, w, 16, () => {
    const gl = '#24486b';
    const ww = ((w - 24) / 2) | 0;
    R(col, 1, 6, w - 2, 6);
    R(col, 0, 7, w, 4);
    R(col, 9, 1, w - 18, 5);
    R(gl, 11, 2, ww, 4);
    R(gl, (w / 2 | 0) + 1, 2, ww, 4);
    R('#0004', 1, 10, w - 2, 2);
    R('#fff59d', w - 2, 7, 2, 2);
    R('#e63946', 0, 7, 1, 2);
    ci('#111', 9, 13, 3);
    ci('#111', w - 9, 13, 3);
    R('#aaa', 9, 13);
    R('#aaa', w - 9, 13);
    R('#c9ccd2', 0, 9, 2, 2);
    R('#c9ccd2', w - 2, 9, 2, 2);
    if (extra) extra();
  });
}

// sedán moderno: techo curvo, capó inclinado, luces finas
function modern(k, col) {
  mk(k, 42, 16, () => {
    const gl = '#1b2838';
    R(col, 2, 7, 38, 5); R(col, 1, 8, 40, 3);
    R(col, 14, 2, 12, 1); R(col, 11, 3, 18, 1); R(col, 9, 4, 23, 1); R(col, 7, 5, 28, 2);
    R(gl, 14, 3, 5, 1); R(gl, 12, 4, 7, 2); R(gl, 21, 3, 6, 1); R(gl, 21, 4, 9, 2);
    R('#fff4', 3, 8, 36, 1);
    R('#0005', 2, 11, 38, 1);
    R('#fff', 39, 8, 2, 1); R('#e63946', 1, 8, 1, 2);
    ci('#111', 10, 13, 3); ci('#111', 32, 13, 3);
    R('#c9ccd2', 10, 13); R('#c9ccd2', 32, 13);
  });
}
// camioneta nueva (SUV): alta, esquinas redondeadas, molduras negras
function suv(k, col) {
  mk(k, 46, 20, () => {
    const gl = '#1b2838';
    R(col, 2, 8, 42, 7); R(col, 1, 9, 44, 5);
    R(col, 6, 2, 29, 6); R(col, 7, 1, 26, 1); R(col, 35, 5, 6, 3);
    R('#333', 8, 0, 22, 1);
    R(gl, 8, 3, 8, 4); R(gl, 18, 3, 8, 4); R(gl, 28, 3, 5, 4); R(gl, 33, 4, 1, 3);
    R('#2a2a2a', 1, 13, 44, 2);
    R('#fff', 43, 9, 2, 2); R('#e63946', 1, 9, 1, 3);
    ci('#111', 10, 16, 4); ci('#111', 36, 16, 4);
    ci('#c9ccd2', 10, 16, 1); ci('#c9ccd2', 36, 16, 1);
  });
}

// perfil de los cerros de los barrios (lo usan la ciudad y sus luces)
const P512 = (Math.PI * 2) / 512;
const HF = (x) => 60 - 10 * Math.sin(2 * x * P512 + 0.3) - 6 * Math.sin(5 * x * P512 + 1) - 3 * Math.sin(9 * x * P512 + 2);
// estrella con destello en cruz
function star(x, y, c, big) {
  R(c, x, y);
  if (big) { R('#cfe3ff', x - 1, y); R('#cfe3ff', x + 1, y); R('#cfe3ff', x, y - 1); R('#cfe3ff', x, y + 1); }
}

function textures() {
  const Y = '#ffd400', B = '#1f4fbf', Rd = '#e63946', dk = '#26262b', gl = '#1d3557', g2 = '#5d8fc4', ch = '#c9ccd2';

  // fuente con borde negro (el tinte multiplica: el borde sigue negro)
  mk('font', 140, 27, () => {
    for (let i = 0; i < FC.length; i++) {
      const x = (i % 20) * 7 + 1;
      const y = ((i / 20) | 0) * 9 + 1;
      ptxt(FC[i], x, y, '#000', 1);
      ptxt(FC[i], x, y, '#fff');
    }
  });
  S.cache.bitmapFont.add('f', Phaser.GameObjects.RetroFont.Parse(S, { image: 'font', width: 7, height: 9, chars: FC, charsPerRow: 20 }));

  // El Encava ENT-610 "tuneado": blanco, vidrios negros, rayas fucsia y verde lima,
  // trompa con parachoques fucsia, espejos "oreja", sirenas en el techo y rines cromados
  mk('bus', 104, 46, () => {
    const wh = '#f6f6f2', gs = '#121218', gr = '#2a2f3d', pk = '#ff2d8a', lm = '#9be22d', rf = '#3a4660';
    // techo: aire acondicionado y luces tipo sirena
    R('#e2e2de', 38, 5, 20, 2);
    for (const x of [24, 78]) { R('#555', x, 5, 5, 2); R('#8fdcff', x + 1, 3, 3, 2); R('#fff', x + 1, 3); }
    // carrocería y cabina con parabrisas inclinado
    R(wh, 2, 8, 84, 31);
    R(wh, 3, 7, 82, 1);
    for (let y = 8; y < 39; y++) {
      const e = y < 24 ? 93 + ((y - 8) >> 2) : 102;
      R(wh, 86, y, e - 85, 1);
      if (y > 9 && y < 23) R(gs, 87, y, e - 89, 1);
    }
    R(gs, 84, 8, 9, 2); // visera negra
    R(lm, 88, 11, 5, 1); R(pk, 89, 12, 4, 1); // calcomanía en el parabrisas
    R('#d9d9d4', 94, 24, 8, 1);
    // franja de ventanas polarizadas
    R(gs, 4, 11, 82, 13);
    for (const x of [16, 28, 40, 52, 72]) R(gr, x, 11, 1, 13);
    for (let x = 6; x < 80; x += 12) { R(rf, x + 4, 12, 2, 1); R(rf, x + 3, 13, 2, 1); R(rf, x + 2, 14, 2, 1); }
    R(lm, 3, 24, 83, 1);
    // rayas en curva subiendo hacia atrás
    for (let x = 3; x < 86; x++) {
      for (let y = 25; y < 37; y++) {
        const v = (((y - 0.3 * x) % 24) + 24) % 24;
        if (v < 7) R(pk, x, y);
        else if (v >= 8 && v < 10) R(lm, x, y);
      }
    }
    // puerta de dos hojas, detrás de la rueda delantera
    R(wh, 58, 24, 11, 15);
    R('#bdbdb8', 58, 11, 1, 28); R('#bdbdb8', 68, 11, 1, 28); R(gr, 63, 11, 1, 27);
    R(gs, 59, 26, 4, 10); R(gs, 64, 26, 4, 10);
    // faldón, trompa y luces
    R(pk, 2, 37, 92, 2);
    R('#222', 2, 39, 90, 1);
    for (let k = 0; k < 4; k++) R('#444', 101, 27 + k * 2, 2, 1);
    R('#fff59d', 101, 35, 2, 2); R('#ff9f1c', 100, 35, 1, 2);
    R(pk, 86, 38, 17, 2); R('#222', 94, 40, 10, 1);
    R('#e63946', 2, 25, 2, 6); R(ch, 0, 34, 3, 4);
    // espejo "oreja"
    R(wh, 88, 5, 13, 2); R(wh, 100, 6, 2, 4); R(wh, 99, 10, 5, 9); R(gs, 99, 11, 1, 7);
    ci('#111', 20, 40, 8);
    ci('#111', 78, 40, 8);
  });
  for (let f = 0; f < 2; f++) {
    mk('w' + f, 13, 13, () => {
      ci('#151515', 6, 6, 6);
      ci('#e9ecf0', 6, 6, 4);
      ci('#b8bcc4', 6, 6, 2);
      if (f) { R('#8a9099', 4, 4); R('#8a9099', 8, 8); R('#8a9099', 8, 4); R('#8a9099', 4, 8); }
      else { R('#8a9099', 6, 3, 1, 7); R('#8a9099', 3, 6, 7, 1); }
      R('#fff', 4, 3); R('#555', 6, 6);
    });
  }
  mk('sh', 32, 6, () => { R('#000', 4, 0, 24, 6); R('#000', 0, 1, 32, 4); });

  // gente de Caracas: [piel, camisa, pantalón, pelo, extra]
  [
    ['#8d5524', '#7b1e2b', '#222', '#1a1a1a', 0], // camiseta vinotinto
    ['#c68642', '#f5f5f5', '#1f3a6e', '#2b1a10', 5], // escolar con morral
    ['#e0ac69', '#e76f51', '#4a4e69', '#9a9a9a', 5], // señora con cartera
    ['#5c3a21', '#2a9d8f', '#3d405b', '#111', 2], // gorra roja
    ['#f1c27d', Y, B, '#3b1f0e', 1], // pelo largo
    ['#c68642', '#f1e3c2', '#6b4f3a', '#777', 3], // liquiliqui y sombrero llanero
    ['#8d5524', B, '#222', '#111', 5], // universitario
    ['#e0ac69', '#e9c46a', '#264653', '#ddd', 2],
  ].forEach((p, i) => person('p' + i, ...p));
  person('gn', '#c68642', '#4b5320', '#4b5320', '#111', 4); // guardia de la alcabala

  // tráfico
  ['#d62828', '#3a6ea5', '#6b8e23'].forEach((c, i) => car('o' + i, 40, c));
  ['#e5e5e5', '#9aa3ad', '#1f4fbf', '#b5172e', '#26262b'].forEach((c, i) => modern('n' + i, c));
  ['#f1f1f1', '#2b2d42', '#7f8c8d'].forEach((c, i) => suv('s' + i, c));
  car('pp', 48, '#f4f1de', () => { R(Y, 19, 0, 10, 1); R('#f77f00', 1, 8, 46, 1); }); // carrito por puesto
  mk('jp', 38, 18, () => { // Toyota "machito"
    R('#c1440e', 3, 6, 34, 8);
    R('#f4f1de', 8, 0, 20, 6);
    R('#24486b', 10, 1, 7, 4); R('#24486b', 19, 1, 7, 4);
    R('#c1440e', 28, 3, 2, 3);
    R('#555', 34, 11, 4, 3);
    ci('#111', 2, 9, 3);
    ci('#111', 10, 15, 3); ci('#111', 30, 15, 3);
    R('#aaa', 10, 15); R('#aaa', 30, 15);
    R('#fff59d', 36, 7, 2, 2);
  });
  mk('mo', 22, 20, () => { // motorizado
    ci('#111', 4, 16, 3); ci('#111', 17, 16, 3);
    R('#888', 4, 16); R('#888', 17, 16);
    R('#d62828', 5, 12, 11, 3);
    R('#222', 6, 11, 6, 1);
    R('#999', 16, 8, 1, 6);
    R('#1d3557', 7, 4, 5, 7); R('#1d3557', 11, 6, 5, 2);
    R('#333', 8, 11, 4, 3); R('#333', 11, 13, 2, 3);
    ci(Y, 9, 2, 2);
    R('#222', 10, 2, 2, 1);
  });
  mk('tr', 64, 30, () => { // camión de víveres
    R('#f6f1e1', 1, 2, 44, 21);
    R('#ccc', 1, 22, 44, 1);
    ptxt('VIVERES', 2, 9, '#d62828');
    R('#277da1', 46, 8, 16, 16); R('#277da1', 62, 14, 2, 10);
    R('#24486b', 52, 10, 9, 6);
    R('#222', 1, 23, 62, 3);
    R('#fff59d', 62, 17, 2, 2);
    ci('#111', 11, 25, 4); ci('#111', 53, 25, 4);
    R('#aaa', 11, 25); R('#aaa', 53, 25);
  });

  // calle
  mk('bh', 18, 8, () => { R('#5a5a62', 2, 0, 14, 8); R('#5a5a62', 0, 2, 18, 4); R('#141417', 3, 1, 12, 6); R('#141417', 1, 3, 16, 2); R('#2a3a4a', 5, 3, 6, 2); });
  mk('bp', 8, 80, () => { for (let y = 0; y < 80; y++) R((y / 5 | 0) % 2 ? '#222' : Y, 1, y, 6, 1); R('#0005', 7, 0, 1, 80); });
  mk('sl', 3, 78, () => { for (let y = 0; y < 78; y++) R((y / 6 | 0) % 2 ? Rd : '#fff', 0, y, 3, 1); });
  mk('cn', 6, 8, () => { R('#f77f00', 2, 0, 2, 2); R('#f77f00', 1, 2, 4, 2); R('#fff', 1, 4, 4, 1); R('#f77f00', 0, 5, 6, 2); R('#222', 0, 7, 6, 1); });
  mk('bo', 54, 40, () => { // alcabala
    R('#cfcfcf', 4, 14, 40, 26);
    R('#2d6a4f', 0, 10, 48, 4);
    R('#1b4332', 1, 0, 51, 10);
    ptxt('ALCABALA', 3, 1, '#fff');
    R(gl, 8, 18, 14, 8);
    R('#6b4f3a', 28, 20, 10, 20);
    R(Rd, 44, 28, 8, 12); R('#fff', 44, 32, 8, 2);
  });
  mk('st', 28, 34, () => { // parada
    R('#8d99ae', 5, 9, 2, 25);
    R('#fff', 0, 0, 12, 10); R(B, 1, 1, 10, 8);
    R('#fff', 2, 3, 8, 3); R(B, 3, 4, 2, 1); R(B, 6, 4, 2, 1); R('#fff', 3, 6); R('#fff', 8, 6);
    R('#6b4f3a', 11, 22, 16, 2); R('#6b4f3a', 11, 26, 16, 2);
    R('#333', 12, 28, 1, 6); R('#333', 25, 28, 1, 6);
  });
  mk('by', 46, 22, () => { R(Y, 0, 0, 46, 1); R(Y, 0, 21, 46, 1); R(Y, 0, 0, 1, 22); R(Y, 45, 0, 1, 22); ptxt('BUS', 14, 8, Y); });

  // pickups
  mk('ar', 12, 9, () => { R('#d4a373', 1, 0, 10, 4); R('#d4a373', 0, 1, 12, 3); R('#8b5a2b', 3, 1); R('#8b5a2b', 7, 2); R('#8b5a2b', 9, 1); R('#fdfcdc', 0, 4, 12, 1); R('#f4978e', 1, 5, 10, 1); R('#d4a373', 0, 6, 12, 2); R('#d4a373', 1, 8, 10, 1); });
  mk('bl', 12, 7, () => { R('#2d6a4f', 0, 0, 12, 7); R('#95d5b2', 1, 1, 10, 5); R('#2d6a4f', 5, 2, 2, 3); R('#2d6a4f', 2, 2); R('#2d6a4f', 9, 4); });
  mk('cf', 9, 10, () => { R('#ddd', 2, 0, 1, 2); R('#ddd', 4, 1, 1, 2); R('#fff', 1, 3, 6, 7); R('#fff', 7, 4, 2, 1); R('#fff', 8, 5, 1, 2); R('#fff', 7, 7, 2, 1); R('#6f4e37', 2, 3, 4, 1); R('#caa', 1, 9, 6, 1); });

  mk('tip', 7, 10, () => {
    R(Y, 2, 0, 3, 1); R(Y, 1, 1, 5, 4); R(Y, 2, 5, 3, 1);
    R('#fff', 2, 1, 1, 2);
    R('#ccc', 2, 6, 3, 1); R('#888', 2, 7, 3, 1); R('#ccc', 2, 8, 3, 1); R('#888', 3, 9);
  });

  // guacamayas
  for (let f = 0; f < 2; f++) {
    mk('m' + f, 16, 9, () => {
      R(Rd, 2, 3, 2, 2); R('#fff', 1, 3); R('#222', 0, 4);
      R(Rd, 4, 4, 6, 2); R(B, 10, 5, 5, 1); R(Rd, 10, 4, 3, 1);
      if (f) { R(Y, 5, 6, 3, 2); R(B, 6, 8, 2, 1); }
      else { R(Y, 5, 1, 3, 3); R(B, 6, 0, 2, 1); }
    });
  }

  // cielo de atardecer caraqueño
  mk('sk', W, 190, () => {
    const c = ['#2b1d5c', '#3d2470', '#5a2a7a', '#7e2f7d', '#a8357a', '#cf4a6b', '#e8685a', '#f48c4c', '#f9ad4a', '#fcd06a'];
    c.forEach((k, i) => {
      R(k, 0, i * 19, W, 19);
      if (i) for (let y = i * 19 - 2; y < i * 19; y++) for (let x = y & 1; x < W; x += 2) R(k, x, y);
    });
    for (let i = 0; i < 110; i++) R(sr() < 0.5 ? '#fff5' : '#fffa', sr() * W | 0, (sr() * sr() * 80) | 0);
    // Cruz del Sur
    [[70, 9, 1], [68, 31, 1], [59, 19, 1], [79, 21, 1], [73, 25, 0]].forEach(([x, y, b]) => star(x, y, '#fff', b));
    ci('#ffe29a', 300, 100, 26);
    for (let y = 104; y < 128; y += 5) R(c[y / 19 | 0], 272, y, 56, 2);
  });
  // estrellas que titilan (dos capas en contrafase)
  for (let f = 0; f < 2; f++) mk('sa' + f, W, 80, () => { for (let i = 0; i < 22; i++) star(sr() * W | 0, (sr() * sr() * 75) | 0, '#fff', sr() < 0.3); });
  // montañas lejanas, azul grisáceo y morado pálido
  [['fa', '#b3a3c4', '#c5b6d3', 34, 1.7], ['fb', '#8784ab', '#9c98bd', 42, 4.2]].forEach(([k, c, hl, b, ph]) =>
    mk(k, 512, 70, () => {
      for (let x = 0; x < 512; x++) {
        const y = (b - 9 * Math.sin(x * P512 * 2 + ph) - 5 * Math.sin(x * P512 * 3 + ph * 2) - 2 * Math.sin(x * P512 * 7)) | 0;
        R(c, x, y, 1, 70 - y);
        R(hl, x, y);
      }
    }),
  );
  mk('cl', 512, 40, () => {
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 80 + (sr() * 30 | 0);
      const y = 14 + (sr() * 16 | 0);
      for (let j = 0; j < 5; j++) ci('#ffd2b8', x + j * 7, y - (j % 2) * 3 - 1, 4 + (j % 3));
      for (let j = 0; j < 5; j++) ci('#f29e8e', x + j * 7, y - (j % 2) * 3 + 1, 4 + (j % 3));
      C.clearRect(x - 10, y + 4, 60, 12);
    }
  });
  // El Ávila con el Hotel Humboldt
  mk('av', 512, 110, () => {
    const P = (Math.PI * 2) / 512;
    const f = (x) => 52 - 20 * Math.sin(x * P + 1) - 9 * Math.sin(2 * x * P + 2.1) - 5 * Math.sin(5 * x * P + 0.4) - 2 * Math.sin(11 * x * P);
    let mx = 0, my = 999;
    for (let x = 0; x < 512; x++) {
      const y = f(x) | 0;
      if (y < my) { my = y; mx = x; }
      R('#36614f', x, y, 1, 110 - y);
      R('#4f8467', x, y, 1, 2);
      if (sr() < 0.12) R('#2c5244', x, y + 4 + (sr() * 8 | 0), 1, 20 + (sr() * 30 | 0));
    }
    for (let y = 50; y < 110; y++) R(`rgba(250,170,130,${((y - 50) / 60) * 0.4})`, 0, y, 512, 1);
    R('#e9e9e9', mx - 3, my - 15, 7, 16);
    for (let i = 0; i < 6; i++) R('#8aa', mx - 2, my - 13 + i * 2, 5, 1);
    R('#ccc', mx - 4, my - 16, 9, 1);
    R('#ccc', mx, my - 21, 1, 5);
    // antena de televisión en otro pico
    const ax = (mx + 200) % 512, ay = f(ax) | 0;
    for (let k = 0; k < 18; k++) R(k % 6 < 3 ? '#d62828' : '#eee', ax - (k < 8 ? 1 : 0), ay - k, k < 8 ? 3 : 1, 1);
    R('#ccc', ax - 3, ay - 12, 2, 2);
    AVL = [ax, ay - 19];
  });
  mk('avl', 512, 110, () => { R('#ff3b3b', AVL[0] - 1, AVL[1], 2, 2); R('#ff3b3b55', AVL[0] - 2, AVL[1] - 1, 4, 4); });
  // barrios, Parque Central y chaguaramos
  mk('ct', 512, 96, () => {
    const P = (Math.PI * 2) / 512;
    const hc = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#e5e5e5', '#c1440e', '#8ab17d', '#d1495b', '#5e9ad6', '#f6bd60'];
    const hf = HF;
    for (let x = 0; x < 512; x++) R('#9c5b3c', x, hf(x) | 0, 1, 96);
    for (let x = 0; x < 508; x += 3 + (sr() * 4 | 0)) {
      for (let y = (hf(x) | 0) + 1; y < 96; y += 4 + (sr() * 3 | 0)) {
        const w = Math.min(3 + (sr() * 4 | 0), 512 - x);
        R(hc[sr() * 10 | 0], x, y, w, 4);
        R('#3a2418', x + 1, y + 1, 1, 2);
        if (sr() < 0.3) R('#ffe08a', x + w - 2, y + 1);
      }
    }
    for (let i = 0; i < 9; i++) {
      const bw = 10 + (sr() * 14 | 0), bh = 20 + (sr() * 30 | 0), x = sr() * (500 - bw) | 0;
      R('#6c7a89', x, 96 - bh, bw, bh);
      for (let y = 98 - bh; y < 96; y += 3) for (let k = x + 1; k < x + bw - 1; k += 2) R(sr() < 0.35 ? '#ffd27f' : '#4a5663', k, y);
    }
    // Torres de Parque Central: fuste nervado, corona escalonada y antena
    for (const x of [298, 320]) {
      R('#2f3a4c', x, 12, 15, 84);
      for (let k = x + 1; k < x + 15; k += 3) R('#3f4d63', k, 12, 1, 84);
      for (let y = 14; y < 96; y += 3) for (let k = x + 2; k < x + 14; k += 3) if (sr() < 0.25) R('#ffd27f', k, y);
      R('#2f3a4c', x + 2, 8, 11, 4);
      R('#2f3a4c', x + 5, 5, 5, 3);
      R('#8da2bd', x, 12, 15, 1);
      R('#999', x + 7, 0, 1, 5);
      R('#ff3b3b', x + 7, 0);
    }
    for (let i = 0; i < 7; i++) {
      const x = 10 + (sr() * 490 | 0), ty = 58 + (sr() * 10 | 0), gr = '#2d6a4f';
      R('#cfc6b0', x, ty, 1, 96 - ty);
      R(gr, x - 4, ty, 9, 1); R(gr, x - 2, ty - 1, 5, 1); R(gr, x - 6, ty + 1, 3, 1); R(gr, x + 4, ty + 1, 3, 1); R(gr, x - 7, ty + 2); R(gr, x + 7, ty + 2);
    }
  });
  // luces de ranchos (dos capas que titilan en contrafase)
  for (let f = 0; f < 2; f++) {
    mk('lt' + f, 512, 96, () => {
      for (let i = 0; i < 130; i++) {
        const x = sr() * 512 | 0, y0 = (HF(x) | 0) + 2;
        R(['#ffe08a', '#fff', '#ffb347'][sr() * 3 | 0], x, y0 + (sr() * (94 - y0) | 0));
      }
    });
  }
  // postes de luz con cableado colgando
  mk('lp', 256, 64, () => {
    for (let x = 0; x < 256; x++) {
      const u = ((x - 21 + 256) % 256) / 256;
      R('#1a1a1a', x, (12 + 13 * Math.sin(Math.PI * u)) | 0);
      R('#1a1a1a', x, (16 + 10 * Math.sin(Math.PI * u)) | 0);
    }
    for (let k = 0; k < 9; k++) R('#1a1a1a', 150 + (k > 5 ? k - 5 : 0), 26 + k); // cable suelto
    R('#5c5f66', 20, 10, 2, 54); R('#44474d', 19, 58, 4, 6);
    R('#5c5f66', 20, 10, 12, 2); R('#ddd', 30, 12, 6, 2); R('#fff3b0', 31, 14, 4, 1);
    for (let y = 15; y < 22; y++) R(`rgba(255,230,140,${0.25 - (y - 15) * 0.03})`, 30 - (y - 15), y, 6 + 2 * (y - 15), 1);
  });
  // fachadas: tiendas con rejas, mural de Cruz-Diez y mural tricolor
  mk('wl', 1024, 26, () => {
    R('#a39e93', 0, 20, 1024, 5);
    R('#77736b', 0, 25, 1024, 1);
    let x = 0, n = 0;
    while (x < 1024) {
      let t = n++ % 4;
      const s = SHOPS[sr() * SHOPS.length | 0];
      let w = t < 2 ? s.length * 6 + 26 : 40 + (sr() * 30 | 0);
      if (x + w > 994) { w = 1024 - x; t = 2; }
      R(['#f2cc8f', '#81b29a', '#e07a5f', '#f4f1de', '#a8dadc', '#e9c46a'][sr() * 6 | 0], x, 2, w, 18);
      R('#0003', x, 2, 1, 18);
      if (t < 2) {
        R(['#d62828', '#1f4fbf', '#2a9d8f', '#6a4c93'][sr() * 4 | 0], x + 3, 0, w - 6, 9);
        ptxt(s, x + 13, 1, '#fff');
        R('#3a2a20', x + 4, 11, 7, 9);
        R('#24486b', x + 14, 11, w - 20, 6);
        for (let k = x + 15; k < x + w - 6; k += 2) R('#222', k, 11, 1, 6);
      } else if (t == 2) {
        const cs = [Rd, B, Y, '#2a9d8f', '#111', '#fff'];
        for (let k = 0; k < w; k++) R(cs[(k + (k >> 3)) % 6], x + k, 3, 1, 16);
      } else {
        R(Y, x, 3, w, 5); R(B, x, 8, w, 6); R(Rd, x, 14, w, 5);
        for (let i = 0; i < 8; i++) {
          const a = Math.PI * (0.15 + i * 0.1);
          R('#fff', (x + w / 2 + Math.cos(a) * 9) | 0, (12 - Math.sin(a) * 3) | 0);
        }
      }
      x += w;
    }
  });
  mk('rd', 128, 80, () => {
    R('#3b3b42', 0, 0, 128, 80);
    for (let i = 0; i < 900; i++) R(['#45454d', '#34343b', '#4c4c55', '#2f2f35'][sr() * 4 | 0], sr() * 128 | 0, sr() * 80 | 0);
    // parches de asfalto
    for (let i = 0; i < 2; i++) {
      const x = sr() * 100 | 0, y = 4 + (sr() * 64 | 0), w = 8 + (sr() * 10 | 0), hh = 4 + (sr() * 4 | 0);
      R('#35353c', x - 1, y - 1, w + 2, hh + 2); R('#404048', x, y, w, hh);
      for (let k = 0; k < 12; k++) R('#4a4a52', x + (sr() * w | 0), y + (sr() * hh | 0));
    }
    // manchas de aceite y marcas de neumáticos
    for (let i = 0; i < 5; i++) { const x = sr() * 120 | 0, y = 6 + (sr() * 70 | 0); ci('#2a2a30', x, y, 1 + (sr() * 2 | 0)); R('#26262c', x - 2, y, 5, 1); }
    for (const y of [20, 24, 46, 50, 72]) { const x = sr() * 90 | 0; R('#323238', x, y, 25 + (sr() * 30 | 0), 1); }
    // grietas
    for (let i = 0; i < 6; i++) { let x = sr() * 128 | 0, y = sr() * 78 | 0; for (let k = 0; k < 9; k++) { R('#28282e', x, y); x++; y += (sr() * 3 | 0) - 1; } }
    R('#2a2a30', 0, 0, 128, 1);
    // bordes y líneas de carril gastadas
    for (let x = 0; x < 128; x++) {
      for (const y of [1, 77]) if (sr() > 0.08) R(sr() < 0.2 ? '#a9a497' : '#d9d4c5', x, y);
      for (const y of [26, 52]) if (x % 32 < 18 && sr() > 0.1) R(sr() < 0.25 ? '#b8b8b8' : '#e9e9e9', x, y - (sr() < 0.08));
    }
  });
  // estela de velocidad detrás de cada raya
  mk('spd', 128, 80, () => {
    for (let x = 0; x < 128; x += 32) for (const y of [26, 52]) for (let k = 0; k < 14; k++) R(`rgba(233,233,233,${0.55 - k * 0.04})`, x + 18 + k, y);
    for (let i = 0; i < 10; i++) { const x = sr() * 100 | 0, y = 4 + (sr() * 72 | 0); for (let k = 0; k < 20; k++) R(`rgba(255,255,255,${0.18 - k * 0.009})`, x + k, y); }
  });
  mk('wk', 128, 26, () => {
    R('#b9b2a3', 0, 0, 128, 26);
    for (let x = 0; x < 128; x += 16) R(x % 32 ? '#222' : '#ffd400', x, 0, 16, 3);
    R('#6b665c', 0, 3, 128, 1);
    for (const y of [11, 18]) R('#a39c8f', 0, y, 128, 1);
    for (let x = 0; x < 128; x += 16) R('#a39c8f', x, 4, 1, 22);
    for (let i = 0; i < 40; i++) R(sr() < 0.5 ? '#aaa293' : '#8f887a', sr() * 128 | 0, 5 + (sr() * 20 | 0));
    // tapa de registro
    ci('#6b6b6b', 40, 15, 4); ci('#555', 40, 15, 3); R('#6b6b6b', 37, 15, 7, 1); R('#6b6b6b', 40, 12, 1, 7);
    // alcantarilla en el brocal
    R('#1a1a1a', 88, 0, 12, 4); for (let k = 89; k < 100; k += 2) R('#555', k, 0, 1, 4);
    // basura: periódico y lata
    R('#e8e4d8', 66, 20, 4, 3); R('#aaa', 67, 21, 2, 1);
    R('#d62828', 110, 9, 3, 2); R('#ccc', 113, 9, 1, 2);
    // grieta
    for (let k = 0; k < 7; k++) R('#8a8375', 18 + k, 6 + (k >> 1));
  });
}

// ---------------------------------------------------------------- audio
function tone(f, t, d, type = 'square', v = 0.1, f2) {
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g);
  g.connect(MG);
  o.start(t);
  o.stop(t + d + 0.02);
}
function noise(t, d, v, fq = 3000) {
  const s = AC.createBufferSource();
  const f = AC.createBiquadFilter();
  const g = AC.createGain();
  s.buffer = NB;
  f.type = 'highpass';
  f.frequency.value = fq;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  s.connect(f);
  f.connect(g);
  g.connect(MG);
  s.start(t);
  s.stop(t + d);
}
const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
function sfx(k) {
  if (!AC || AC.state !== 'running') return;
  const t = AC.currentTime;
  if (k == 'horn') {
    // corneta musical de autobús: "La Cucaracha"
    [392, 392, 392, 523, 659].forEach((f, i) => {
      const s = t + [0, 0.1, 0.2, 0.3, 0.48][i];
      const d = i < 3 ? 0.08 : 0.17;
      tone(f, s, d, 'square', 0.06);
      tone(f * 1.006, s, d, 'sawtooth', 0.05);
    });
  } else if (k == 'board') { tone(660, t, 0.06, 'square', 0.06); tone(990, t + 0.06, 0.08, 'square', 0.06); }
  else if (k == 'cash') { tone(1046, t, 0.07, 'square', 0.07); tone(1568, t + 0.07, 0.25, 'square', 0.07); }
  else if (k == 'pick') [784, 988, 1175].forEach((f, i) => tone(f, t + i * 0.05, 0.08, 'triangle', 0.12));
  else if (k == 'bache') { tone(140, t, 0.25, 'sine', 0.35, 40); noise(t, 0.12, 0.15, 400); }
  else if (k == 'crash') { noise(t, 0.4, 0.35, 300); tone(110, t, 0.3, 'sawtooth', 0.15, 35); }
  else if (k == 'whistle') { tone(2500, t, 0.14, 'sine', 0.12); tone(2500, t + 0.2, 0.45, 'sine', 0.12, 2300); }
  else if (k == 'turbo') tone(160, t, 0.5, 'sawtooth', 0.1, 900);
  else if (k == 'tick') tone(1200, t, 0.05, 'square', 0.05);
  else if (k == 'bad') tone(330, t, 0.35, 'square', 0.07, 140);
  else if (k == 'lane') tone(500, t, 0.03, 'triangle', 0.05);
  else if (k == 'sel') tone(880, t, 0.06, 'square', 0.05);
  else if (k == 'over') [523, 466, 392, 330, 262].forEach((f, i) => tone(f, t + i * 0.16, 0.2, 'square', 0.07));
}

// joropo chiptune en 6/8: arpa, bajo y maracas
const CH = [[62, 66, 69, 74], [67, 71, 74, 79], [69, 73, 76, 79]];
const PROG = [0, 0, 1, 2, 0, 1, 2, 0];
function music() {
  if (!AC || AC.state !== 'running' || G.ph == 'pause') return;
  if (G.mt < AC.currentTime) G.mt = AC.currentTime + 0.05;
  while (G.mt < AC.currentTime + 0.2) {
    const st = G.ms++;
    const s = st % 6;
    const ch = CH[PROG[((st / 6) | 0) % 8]];
    const t = G.mt;
    if (s == 0 || s == 3) tone(mf(ch[0] - 24 + (s ? 7 : 0)), t, 0.25, 'triangle', 0.1);
    tone(mf(ch[[0, 1, 2, 3, 2, 1][s]] + (st % 12 < 6 ? 12 : 0)), t, 0.12, 'square', 0.022);
    noise(t, 0.04, [0.05, 0.015, 0.03, 0.05, 0.015, 0.03][s], 6000);
    G.mt += G.ph == 'play' && G.t < 10 ? 0.095 : 0.115;
  }
}

// ---------------------------------------------------------------- texto
function T(x, y, s, sc = 1, tint = 0xffffff, ox = 0, d = 500) {
  return S.add.bitmapText(x, y, 'f', String(s)).setLetterSpacing(-1).setScale(sc).setTint(tint).setOrigin(ox, 0).setDepth(d);
}
function pop(x, y, s, tint, sc = 1) {
  const t = T(x, y, s, sc, tint, 0.5, 620);
  t.x = Math.min(W - t.width / 2 - 2, Math.max(t.width / 2 + 2, x));
  S.tweens.add({ targets: t, y: y - 22, alpha: 0, delay: 500, duration: 800, onComplete: () => t.destroy() });
}
function say(s, tint = 0xffffff, x = G.bx + 30) {
  const y = G.by - 60 - (G.sy++ % 3) * 12;
  const w = s.length * 6 + 5;
  const X = Math.min(W - w / 2 - 2, Math.max(w / 2 + 2, x));
  const b = S.add.rectangle(X, y + 4, w, 12, 0x111111, 0.8).setDepth(610).setStrokeStyle(1, tint);
  const t = T(X, y, s, 1, tint, 0.5, 611);
  S.tweens.add({ targets: [b, t], y: '-=10', alpha: 0, delay: 1100, duration: 400, onComplete: () => { b.destroy(); t.destroy(); } });
}

// ---------------------------------------------------------------- escena
function create() {
  S = this;
  textures();
  try {
    AC = S.sound.context;
    MG = AC.createGain();
    MG.gain.value = 0.6;
    MG.connect(AC.destination);
    NB = AC.createBuffer(1, AC.sampleRate / 2, AC.sampleRate);
    const d = NB.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) {
    AC = null;
  }

  const tl = (y, hh, k, d) => S.add.tileSprite(0, y, W, hh, k).setOrigin(0).setDepth(d);
  S.add.image(0, 0, 'sk').setOrigin(0).setDepth(0);
  L.s0 = S.add.image(0, 0, 'sa0').setOrigin(0).setDepth(0.1);
  L.s1 = S.add.image(0, 0, 'sa1').setOrigin(0).setDepth(0.1);
  L.fa = tl(52, 70, 'fa', 0.5).setAlpha(0.55);
  L.cl = tl(36, 40, 'cl', 1);
  L.fb = tl(62, 70, 'fb', 1.5).setAlpha(0.8);
  L.av = tl(66, 110, 'av', 2);
  L.al = tl(66, 110, 'avl', 2.1);
  L.ct = tl(80, 96, 'ct', 4);
  L.l0 = tl(80, 96, 'lt0', 4.1);
  L.l1 = tl(80, 96, 'lt1', 4.1);
  L.wl = tl(156, 26, 'wl', 5);
  L.lp = tl(118, 64, 'lp', 5.5);
  L.rd = tl(182, 80, 'rd', 6);
  L.sp = tl(182, 80, 'spd', 6.1);
  L.wk = tl(262, 26, 'wk', 6);
  S.add.rectangle(0, 288, W, 12, 0x15151c).setOrigin(0).setDepth(400);

  bsh = S.add.image(0, 0, 'sh').setOrigin(0.5, 1).setScale(3.2, 1.2).setAlpha(0.35);
  bus = S.add.image(0, 0, 'bus').setOrigin(0.5, 1);
  wa = S.add.image(0, 0, 'w0');
  wb = S.add.image(0, 0, 'w0');

  // HUD: etiquetas atenuadas, valores clave grandes, lo secundario más pequeño
  const hc = (h.hud = S.add.container(0, 0).setDepth(499));
  const lb = (x, t) => hc.add(T(x, 2, t, 1, DIM));
  hc.add([S.add.rectangle(0, 0, W, 28, 0x0b0b14, 0.82).setOrigin(0), S.add.rectangle(0, 28, W, 1, LINE).setOrigin(0)]);
  for (const x of [44, 140, 244]) hc.add(S.add.rectangle(x, 4, 1, 20, LINE).setOrigin(0));
  lb(6, 'TIEMPO');
  hc.add((h.t = T(6, 10, '60', 2)));
  lb(52, 'BOLIVARES');
  hc.add((h.b = T(52, 10, '0', 2, GOLD)));
  hc.add((h.c = T(0, 15, 'x1', 1, GREEN)));
  lb(148, 'PASAJEROS');
  lb(252, 'TURBO');
  h.cf = [0, 1, 2].map((i) => S.add.image(252 + i * 11, 13, 'cf').setOrigin(0));
  hc.add(h.cf);
  lb(298, 'KM/H');
  hc.add((h.k = T(298, 10, '0', 2, SOFT)));
  // destino: píldora oscura con el chip de color del pasajero
  hc.add((h.ib = S.add.rectangle(4, 31, 10, 13, 0x0b0b14, 0.88).setOrigin(0).setStrokeStyle(1, LINE)));
  hc.add((h.i = T(18, 33, '', 1, 0xffffff)));
  hc.add((h.id = T(0, 33, '', 1, GOLD)));
  hc.add((hg = S.add.graphics()));
  // alcabala: banda roja
  h.w = S.add.container(0, 0);
  h.w.add([S.add.rectangle(W / 2, 56, 170, 15, 0xb00020, 0.92).setStrokeStyle(1, 0xffffff), T(W / 2, 52, '¡ALCABALA! MAX 40 KM/H', 1, 0xffffff, 0.5)]);
  hc.add(h.w);

  // título: logo → START → paneles informativos
  const tc = (h.title = S.add.container(0, 0).setDepth(700));
  const ts = "¡PASA PA' ATRÁS!";
  tc.add(S.add.rectangle(W / 2, 37, 392, 62, 0x000000, 0.6));
  tc.add([T(202, 14, ts, 3, 0xe63946, 0.5), T(201, 13, ts, 3, 0x1f4fbf, 0.5), T(200, 12, ts, 3, GOLD, 0.5)]);
  tc.add(T(W / 2, 50, 'EL ENCAVA MAS ARRECHO DE CARACAS', 1, 0xdddddd, 0.5));
  tc.add(S.add.rectangle(W / 2, 92, 196, 24, 0x000000, 0.7).setStrokeStyle(1, GOLD));
  tc.add((h.ps = T(W / 2, 84, 'PRESIONA START', 2, GOLD, 0.5)));
  tc.add(S.add.rectangle(W / 2, 145, 392, 62, 0x0b0b14, 0.82));
  tc.add(S.add.rectangle(W / 2, 120, 1, 52, LINE).setOrigin(0.5, 0));
  tc.add([T(12, 118, 'CONTROLES', 1, GREEN), T(212, 118, 'MEJORES CHOFERES', 1, GREEN)]);
  [['DERECHA', 'ACELERAR'], ['IZQUIERDA', 'FRENAR / RETRO'], ['ARRIBA/ABAJO', 'CAMBIAR CARRIL'], ['B1 / B2', 'CORNETA / TURBO']].forEach(([k, a], i) =>
    tc.add([T(12, 131 + i * 10, k, 1, GOLD), T(96, 131 + i * 10, a, 1, 0xffffff)]),
  );
  h.rk = rows(tc, 212, 388, 131);
  tc.add((h.tb = S.add.rectangle(W / 2, 190, 10, 15, 0x0b0b14, 0.85).setStrokeStyle(1, LINE)));
  tc.add((h.tbi = S.add.image(0, 185, 'tip').setOrigin(0)));
  tc.add((h.tip = T(W / 2 + 6, 186, '', 1, 0x4cc9f0, 0.5)));
  setTip(TIPS[0]);
  S.tweens.add({ targets: h.ps, alpha: 0.25, duration: 450, yoyo: true, repeat: -1 });

  // pausa
  h.pause = S.add.container(0, 0).setDepth(700).setVisible(0);
  h.pause.add([S.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6), T(W / 2, 120, 'PAUSA', 3, GOLD, 0.5), T(W / 2, 160, 'START PARA SEGUIR', 1, DIM, 0.5)]);

  // fin de partida: puntaje protagonista, estadísticas secundarias, nombre
  const o = (h.ov = S.add.container(0, 0).setDepth(700).setVisible(0));
  o.add(S.add.rectangle(W / 2, H / 2, W, H, 0x0b0b12, 0.88));
  o.add(T(W / 2, 14, '¡SE ACABO EL PASAJE!', 2, GOLD, 0.5));
  o.add(T(W / 2, 40, 'BOLIVARES GANADOS', 1, DIM, 0.5));
  o.add((h.sb = T(W / 2, 50, '0', 3, GOLD, 0.5)));
  h.sv = ['PASAJEROS', 'DISTANCIA', 'COMBO MAX'].map((l, i) => T(80 + i * 120, 98, '', 1, 0xffffff, 0.5));
  ['PASAJEROS', 'DISTANCIA', 'COMBO MAX'].forEach((l, i) => o.add(T(80 + i * 120, 88, l, 1, DIM, 0.5)));
  o.add(h.sv);
  o.add(S.add.rectangle(W / 2, 114, 300, 1, LINE));
  o.add((h.nl = T(W / 2, 122, '', 1, GREEN, 0.5)));
  h.L = [0, 1, 2].map((i) => T(170 + i * 30, 142, 'A', 3, 0xffffff, 0.5));
  o.add(h.L);
  o.add((h.ng = S.add.graphics()));
  h.or = rows(o, 140, 260, 136);
  o.add((h.ot = T(W / 2, 196, '', 1, DIM, 0.5)));

  getStore()
    .get(KEY)
    .then((r) => {
      if (r && r.found && Array.isArray(r.value)) G.rank = r.value.filter((v) => v && typeof v.n == 'string' && typeof v.s == 'number').slice(0, 5);
      rankText();
    })
    .catch(() => {});
  toTitle();
}

function update(time, dms) {
  const dt = Math.min(dms, 50) / 1000;
  G.time = time;
  G.bx = Math.round(110 + G.lean);
  camX = G.wx - G.bx;
  if (G.ph == 'play') play(dt);
  else if (G.ph == 'title') {
    G.wx += 90 * dt;
    if ((G.tt -= dt) < 0) { G.tt = 3.5; setTip(TIPS[G.ti++ % TIPS.length]); }
    if (pr('S') | pr('1')) startGame();
  } else if (G.ph == 'pause') {
    if (pr('S')) { G.ph = 'play'; h.pause.setVisible(0); S.tweens.resumeAll(); }
  } else if (G.ph == 'over') nameEntry();
  else if (G.ph == 'rank' && time > G.lock && (pr('S') | pr('1'))) toTitle();
  render(dt, time);
  music();
  for (const k in pressed) delete pressed[k];
}

function reset() {
  for (const e of ents) e.sp.forEach((s) => s.img.destroy());
  ents.length = 0;
  Object.assign(G, {
    t: 60, bs: 0, combo: 0, maxc: 0, deliv: 0, v: 0, wx: 0, ln: 2, by: LY[2], lean: 0, tb: 0, cafe: 1,
    inv: 0, stun: 0, jy: 0, jv: 0, pax: [], hc: 0, sx: [330], ns: 0, nh: 380, na: 2600, ct: 1.5,
    lv: 0, bt: 0, rt: 0, cc: 0, lt: 99, sy: 0, sm: 0, warn: 0, tt: 3.5, ti: 1,
  });
}

function toTitle() {
  reset();
  G.ph = 'title';
  h.ov.setVisible(0);
  h.hud.setVisible(0);
  h.title.setVisible(1);
  rankText();
}

function startGame() {
  reset();
  sfx('sel');
  G.ph = 'play';
  h.title.setVisible(0);
  h.hud.setVisible(1);
  pop(W / 2, 58, 'FRENA EN EL CUADRO AMARILLO', 0xffd400);
  pop(W / 2, 70, 'PARA RECOGER PASAJEROS', 0xffd400);
}

// 5 filas de ranking (nombre a la izquierda, puntaje a la derecha) dentro de un container
function rows(c, xl, xr, y) {
  return [0, 1, 2, 3, 4].map((i) => {
    const r = [T(xl, y + i * 9, ''), T(xr, y + i * 9, '', 1, 0xffffff, 1)];
    c.add(r);
    return r;
  });
}
function fillRank(rs) {
  rs.forEach(([n, v], i) => {
    const r = G.rank[i];
    const c = i < 3 ? PODIO[i] : SOFT;
    n.setText(r ? `${i + 1}. ${r.n}` : '').setTint(c);
    v.setText(r ? r.s + ' BS' : '').setTint(c);
  });
  if (!G.rank.length) rs[0][0].setText('SE BUSCA CHOFER').setTint(0xffffff), rs[2][0].setText('¡SE EL PRIMERO!').setTint(GOLD);
}
function rankText() {
  fillRank(h.rk);
}
function setTip(t) {
  h.tip.setText(t);
  const w = h.tip.width + 16;
  h.tb.setSize(w + 8, 15);
  h.tbi.x = W / 2 - w / 2 + 2;
}

// ---------------------------------------------------------------- juego
function play(dt) {
  if (pr('S')) {
    G.ph = 'pause';
    h.pause.setVisible(1);
    S.tweens.pauseAll();
    return;
  }
  G.t -= dt;
  if (G.t < 10 && Math.ceil(G.t) != G.lt) { G.lt = Math.ceil(G.t); sfx('tick'); }
  if (G.t <= 0) { G.t = 0; return gameOver(); }
  const lv = Math.min(6, (G.wx / 3500) | 0);
  if (lv > G.lv) { G.lv = lv; pop(W / 2, 60, '¡HORA PICO! NIVEL ' + (lv + 1), 0xffd400, 2); }

  // manejo
  if (G.stun > 0) {
    G.stun -= dt;
    G.v *= Math.pow(0.02, dt);
  } else {
    const mx = G.tb > 0 ? 330 : 220;
    if (hd('R') || (G.tb > 0 && !hd('L'))) {
      G.v = Math.min(mx, G.v + (G.tb > 0 ? 500 : G.v < 0 ? 300 : 150) * dt);
      G.rt = 0;
    } else if (hd('L')) {
      if (G.v > 0) { G.v = Math.max(0, G.v - 330 * dt); G.rt = 0; }
      else if ((G.rt += dt) > 0.35) G.v = Math.max(-75, G.v - 140 * dt);
    } else {
      G.rt = 0;
      G.v -= Math.sign(G.v) * Math.min(Math.abs(G.v), 45 * dt);
    }
    if (G.v > mx) G.v = Math.max(mx, G.v - 200 * dt);
    if (pr('U') && G.ln > 0) { G.ln--; sfx('lane'); }
    if (pr('D') && G.ln < 2) { G.ln++; sfx('lane'); }
    if (pr('1') && G.hc <= 0) horn();
    if (pr('2') && G.cafe > 0 && G.tb <= 0) {
      G.cafe--;
      G.tb = 2.5;
      sfx('turbo');
      say('¡CAFECITO TURBO!', 0xffd400);
    }
  }
  G.hc -= dt;
  G.tb -= dt;
  G.inv -= dt;
  G.wx += G.v * dt;
  if (G.wx < 0) { G.wx = 0; G.v = Math.max(0, G.v); }
  G.by += (LY[G.ln] - G.by) * Math.min(1, dt * 12);
  G.lean += ((G.v > 0 ? G.v * 0.12 : G.v * 0.3) - G.lean) * Math.min(1, dt * 2);
  if (G.jv || G.jy) {
    G.jv += 800 * dt;
    G.jy += G.jv * dt;
    if (G.jy >= 0) { G.jy = 0; G.jv = 0; }
  }

  // humo negro del tubo de escape (y llamas con turbo)
  if ((G.sm -= dt) < 0 && G.v > 0 && (hd('R') || G.tb > 0)) {
    G.sm = 0.07;
    const r = S.add.rectangle(G.bx - 53, G.by + G.jy - 5, 3, 3, G.tb > 0 ? pick([0xffa500, 0xffd400, 0xe63946]) : 0x3a3a3a).setDepth(10 + G.by);
    S.tweens.add({ targets: r, x: r.x - 20 - G.v * 0.4, y: r.y - rnd(4, 12), scale: 2.5, alpha: 0, duration: 600, onComplete: () => r.destroy() });
  }

  world(dt);
  stops(dt);
  passengers(dt);
  cars(dt);
  hudUpd();
}

function horn() {
  G.hc = 1.2;
  sfx('horn');
  say('¡PI-PI-PI-PIIII!', 0xffd400, G.bx + 40);
  const ln = lane(G.by);
  for (const e of ents) {
    if (e.k == 'car' && e.ln == ln && e.wx > G.wx && e.wx - G.wx < 170) {
      const o = [ln - 1, ln + 1].filter((l) => l >= 0 && l < 3 && free(l, e.wx, e.hw + 30, e));
      if (o.length) e.ln = pick(o);
      else e.tv += 60;
    }
  }
}

function free(l, x, d, me) {
  if (lane(G.by) == l && Math.abs(G.wx - x) < d + 48) return 0;
  for (const e of ents) if (e.k == 'car' && e !== me && e.ln == l && Math.abs(e.wx - x) < d + e.hw) return 0;
  return 1;
}

function money(n, s) {
  G.bs = Math.max(0, G.bs + n);
  pop(G.bx + 20, G.by - 40, s + ' ' + n + ' BS', 0xff595e);
}
function patAll(n) {
  for (const p of G.pax) p.pat += n;
}
function shake(i) {
  S.cameras.main.shake(180, i);
}

function add(e, k, dx, dy, d, ox = 0.5, oy = 1) {
  const img = S.add.image(-200, dy, k).setOrigin(ox, oy).setDepth(d || 10 + dy);
  e.sp.push({ img, dx, dy });
  return img;
}

function stopX(i) {
  while (G.sx.length <= i) G.sx.push(G.sx[G.sx.length - 1] + rnd(560, 900));
  return G.sx[i];
}

function nearStop(x) {
  let d = 1e9;
  for (let i = Math.max(0, G.ns - 3); i < G.ns + 3; i++) d = Math.min(d, Math.abs(stopX(i) - x));
  return d;
}

// genera paradas, baches, policías acostados, pickups y alcabalas por delante
function world(dt) {
  const edge = camX + W + 70;
  while (stopX(G.ns) < edge) {
    const i = G.ns++;
    const wx = stopX(i);
    const e = { k: 'stop', i, wx, sp: [], wait: [] };
    add(e, 'by', 0, 247, 7, 0.5, 0.5).setAlpha(0.85);
    add(e, 'st', 0, 283, 0, 0.21, 1);
    e.tag = T(0, 289, NM(i), 1, 0xffd400, 0.5, 401);
    e.sp.push({ img: e.tag, dx: 0, dy: 289 });
    const n = i < 2 ? 2 : Math.random() < 0.2 ? 0 : ri(1, 3);
    for (let k = 0; k < n; k++) {
      const p = { k: 'ped', wx: wx + 6 + k * 9, sp: [], v: ri(0, 7), w: 1 };
      add(p, 'p' + p.v + '0', 0, 283 - (k % 2));
      e.wait.push(p);
      ents.push(p);
    }
    ents.push(e);
  }
  while (G.nh < edge) {
    const x = G.nh;
    G.nh += rnd(170, 330) * (1 - G.lv * 0.07);
    if (Math.abs(x - G.na) < 260) continue;
    const r = Math.random();
    const l = ri(0, 2);
    const ns = nearStop(x);
    if (r < 0.5) {
      if (ns < 80) continue;
      const e = { k: 'bache', wx: x, ln: l, sp: [] };
      add(e, 'bh', 0, LY[l] - 3, 8, 0.5, 0.5);
      ents.push(e);
    } else if (r < 0.87 || G.lv < 1 || ns < 100) {
      const t = pick(['ar', 'ar', 'bl', 'bl', 'bl', 'cf']);
      const e = { k: 'pick', t, wx: x, ln: l, sp: [] };
      add(e, 'sh', 0, LY[l] - 1, 8).setScale(0.4, 1).setAlpha(0.3);
      add(e, t, 0, LY[l] - 12, 10 + LY[l]);
      e.sp[1].bob = 1;
      ents.push(e);
    } else {
      const e = { k: 'bump', wx: x, sp: [] };
      add(e, 'bp', 0, 182, 7, 0.5, 0);
      ents.push(e);
    }
  }
  if (G.na < edge) {
    let a = G.na;
    if (nearStop(a) < 170) a += 340;
    const e = { k: 'alc', wx: a, sp: [] };
    add(e, 'sl', 0, 182, 7, 0.5, 0);
    add(e, 'bo', -34, 183, 190);
    e.g = add(e, 'gn0', 0, 184, 192);
    add(e, 'cn', 6, 188);
    add(e, 'cn', 6, 266);
    ents.push(e);
    G.na = a + rnd(3200, 4800) * (1 - G.lv * 0.06);
  }

  // colisiones con objetos de la calle
  const bl = lane(G.by);
  G.warn = 0;
  for (const e of ents) {
    if (e.k == 'bache' && !e.hit && e.ln == bl && Math.abs(e.wx - G.wx) < 44 && G.jy > -2) {
      e.hit = 1;
      if (Math.abs(G.v) > 60) {
        G.v *= 0.45;
        G.jv = -110;
        money(-10, '¡BACHE!');
        patAll(-1.5);
        shake(0.008);
        sfx('bache');
        if (G.pax.length && Math.random() < 0.6) say('¡AY, MI ESPALDA!', 0xff8fd8);
      } else G.jv = -35;
    } else if (e.k == 'bump' && !e.hit && G.wx + 40 >= e.wx) {
      e.hit = 1;
      if (Math.abs(G.v) > 125) {
        G.jv = -170;
        G.v *= 0.6;
        money(-15, '¡POLICIA ACOSTADO!');
        patAll(-2);
        shake(0.012);
        sfx('bache');
      } else { G.jv = -45; sfx('lane'); }
    } else if (e.k == 'pick' && e.ln == bl && Math.abs(e.wx - G.wx) < 48 && G.jy > -12) {
      e.dead = 1;
      sfx('pick');
      if (e.t == 'ar') { G.t += 4; pop(G.bx, G.by - 50, '¡AREPA! +4 SEG', 0xffd400); }
      else if (e.t == 'bl') { G.bs += 20; pop(G.bx, G.by - 50, '+20 BS', 0x8ac926); }
      else { G.cafe = Math.min(3, G.cafe + 1); pop(G.bx, G.by - 50, '¡CAFE! +TURBO', 0xffd400); }
    } else if (e.k == 'alc') {
      const d = e.wx - (G.wx + 50);
      if (d > 0 && d < 480) G.warn = 1;
      e.g.setTexture('gn' + (d > -60 && d < 240 ? 1 : 0));
      if (!e.hit && d <= 0) {
        e.hit = 1;
        if (G.v * 0.4 > 40) {
          const f = Math.min(G.bs, 50 + G.lv * 15);
          G.bs -= f;
          G.t = Math.max(1, G.t - 4);
          G.stun = 1.5;
          G.combo = 0;
          shake(0.01);
          sfx('whistle');
          say('¡ALTO! ¡DOCUMENTOS!', 0x8ac926, G.bx + 60);
          pop(W / 2, 64, '¡MATRACA! -' + f + ' BS  -4 SEG', 0xff595e, 2);
        } else {
          G.bs += 10;
          pop(G.bx + 30, G.by - 40, '¡SIGA, SIGA! +10 BS', 0x8ac926);
        }
      }
    }
    if (e.k != 'stop' && !e.w && e.k != 'car' && e.wx - camX < -260) e.dead = 1;
  }

  // tráfico
  if ((G.ct -= dt) < 0) {
    G.ct = rnd(1.0, 2.4) / (1 + G.lv * 0.15);
    spawnCar();
  }
}

function spawnCar() {
  let n = 0;
  for (const e of ents) if (e.k == 'car') n++;
  if (n >= 3 + G.lv) return;
  const [k, hw] = pick(VT);
  const mo = k == 'mo';
  const ln = ri(0, 2);
  const tv = (mo ? rnd(150, 200) : [rnd(140, 175), rnd(105, 140), rnd(70, 100)][ln]) + G.lv * 6;
  const wx = G.v > tv + 5 ? camX + W + hw + 20 : camX - hw - 20;
  if (!free(ln, wx, hw + 60)) return;
  const e = { k: 'car', wx, ln, y: LY[ln], v: tv, tv, hw, mo, lc: rnd(1, 3), sp: [], rel: 1 };
  add(e, 'sh', 0, 1).setScale(hw / 14, 1).setAlpha(0.3);
  add(e, k, 0, 0);
  ents.push(e);
}

function cars(dt) {
  const bl = lane(G.by);
  for (const e of ents) {
    if (e.k != 'car') continue;
    let gap = 1e9, bv = 0;
    for (const o of ents) {
      if (o.k == 'car' && o !== e && o.ln == e.ln && o.wx > e.wx) {
        const d = o.wx - o.hw - e.wx - e.hw;
        if (d < gap) { gap = d; bv = o.v; }
      }
    }
    if (bl == e.ln && G.wx > e.wx) {
      const d = G.wx - 48 - e.wx - e.hw;
      if (d < gap) { gap = d; bv = G.v; }
    }
    let tv = e.tv;
    if (gap < 40) {
      tv = Math.max(0, Math.min(tv, bv - 20 + gap));
      if (bv < 40 && (e.lc -= dt) < 0) {
        e.lc = 1;
        const l = e.ln + pick([-1, 1]);
        if (l >= 0 && l < 3 && free(l, e.wx, e.hw + 20, e)) e.ln = l;
      }
    }
    if (e.mo && (e.lc -= dt) < 0) {
      e.lc = rnd(1, 3);
      const l = e.ln + pick([-1, 1]);
      if (l >= 0 && l < 3 && free(l, e.wx, e.hw + 15, e)) e.ln = l;
    }
    e.v += Math.max(-250 * dt, Math.min(90 * dt, tv - e.v));
    e.wx += e.v * dt;
    e.y += (LY[e.ln] - e.y) * Math.min(1, dt * 6);
    e.sp[0].img.setDepth(9.5 + e.y);
    e.sp[1].img.setDepth(10 + e.y);
    if (G.inv <= 0 && G.jy > -8 && Math.abs(e.y - G.by) < 10 && Math.abs(e.wx - G.wx) < e.hw + 46) crash(e);
    if (e.wx - camX < -200 || e.wx - camX > W + 300) e.dead = 1;
  }
}

function crash(e) {
  G.inv = 1.3;
  G.combo = 0;
  if (e.wx > G.wx) {
    G.v = Math.min(G.v, e.v * 0.5);
    e.wx = G.wx + e.hw + 48;
    e.v += 50;
  } else {
    e.v = 0;
    e.wx = G.wx - e.hw - 48;
  }
  money(-20, '¡CHOQUE!');
  patAll(-2);
  shake(0.012);
  sfx('crash');
  say(pick(CRASH), 0xff595e);
}

function stops(dt) {
  const door = G.wx + DOOR;
  const inLane = lane(G.by) == 2 && Math.abs(G.by - LY[2]) < 3;
  let dock = null;
  for (const e of ents) {
    if (e.k != 'stop') continue;
    const near = Math.abs(e.wx - door) < DOCK;
    const want = e.wait.length || G.pax.some((p) => p.d == e.i);
    e.tag.setTint(near && inLane ? 0x8ac926 : want ? 0xffd400 : 0x777777);
    const close = e.wx - G.wx < 260 && e.wx - G.wx > -40;
    for (const p of e.wait) p.sp[0].img.setTexture('p' + p.v + (close && (G.time / 250 | 0) % 2 ? 1 : 0));
    if (near && inLane && Math.abs(G.v) < 14) dock = e;
    if (e.wx - camX < -260 && !G.pax.some((p) => p.d == e.i)) {
      e.dead = 1;
      e.wait.forEach((p) => (p.dead = 1));
    }
  }
  if (!dock) { G.bt = 0.15; return; }
  if ((G.bt -= dt) > 0) return;
  G.bt = 0.32;
  const pi = G.pax.findIndex((p) => p.d == dock.i);
  if (pi >= 0) deliver(pi, dock);
  else if (dock.wait.length && G.pax.length < 8) board(dock);
}

function board(e) {
  const p = e.wait.shift();
  p.w = 0;
  const hops = ri(1, G.lv > 1 ? 4 : 3);
  const mx = (9 + hops * 6) * (1 - G.lv * 0.06);
  const col = PC[G.cc++ % 8];
  G.pax.push({ d: e.i + hops, hops, pat: mx, mx, col, v: p.v });
  S.tweens.add({ targets: p, wx: G.wx + DOOR, duration: 220, onComplete: () => (p.dead = 1) });
  sfx('board');
  if (G.pax.length > 6 || !e.said) say(G.pax.length > 6 ? "¡PA'TRAS, QUE CABE UNO MAS!" : pick(COLECTOR), 0xffffff);
  e.said = 1;
  pop(G.bx + DOOR, G.by - 30 - (G.sy % 3) * 9, '¡A ' + NM(e.i + hops) + '!', col);
  G.sy++;
}

function deliver(pi, e) {
  const p = G.pax.splice(pi, 1)[0];
  const fr = Math.max(0, p.pat / p.mx);
  const base = 10 + p.hops * 10;
  const tip = fr > 0.5 ? Math.round(base * fr * 0.6) : 0;
  G.combo++;
  G.maxc = Math.max(G.maxc, G.combo);
  const tot = (base + tip) * mult();
  G.bs += tot;
  G.deliv++;
  G.t += tip ? 4 : 2;
  pop(G.bx + DOOR, G.by - 34, '+' + tot + ' BS', 0x8ac926, 2);
  pop(G.bx + DOOR, G.by - 14, tip ? '¡PROPINA! +4 SEG' : '+2 SEG', 0xffd400);
  say(pick(THANKS), p.col);
  sfx('cash');
  const q = { k: 'ped', wx: G.wx + DOOR, sp: [] };
  add(q, 'p' + p.v + '0', 0, 283);
  ents.push(q);
  S.tweens.add({ targets: q, wx: e.wx - rnd(14, 34), duration: 500 });
  S.tweens.add({ targets: q.sp[0].img, alpha: 0, delay: 900, duration: 400, onComplete: () => (q.dead = 1) });
}

function passengers(dt) {
  const k = G.pax.length > 6 ? 1.5 : 1; // apretados se impacientan más rápido
  for (let i = G.pax.length - 1; i >= 0; i--) {
    const p = G.pax[i];
    const d = stopX(p.d) - (G.wx + DOOR);
    p.pat -= dt * k;
    if (!p.ann && d < 260 && d > 0) { p.ann = 1; say(pick(['¡LA PARADA, CHOFER!', '¡EN LA PROXIMA!', '¡ME QUEDO EN ' + NM(p.d) + '!']), p.col); }
    if (!p.pass && d < -DOCK - 15) { p.pass = 1; p.pat -= 3; say('¡SE PASO, CHOFER!', 0xff595e); }
    if (!p.imp && p.pat < p.mx * 0.3) { p.imp = 1; say(pick(HURRY), p.col); }
    if (p.pat <= 0) {
      G.pax.splice(i, 1);
      G.combo = 0;
      sfx('bad');
      say(pick(['¡ME BAJO AQUI!', '¡MEJOR ME VOY A PIE!']), 0xff595e);
      const q = { k: 'ped', wx: G.wx + DOOR, sp: [] };
      add(q, 'p' + p.v + '0', 0, 283);
      ents.push(q);
      S.tweens.add({ targets: q.sp[0].img, alpha: 0, delay: 700, duration: 400, onComplete: () => (q.dead = 1) });
    }
  }
}

function hudUpd() {
  h.t.setText(Math.ceil(G.t)).setTint(G.t < 10 && (G.time / 200 | 0) % 2 ? 0xff595e : 0xffffff);
  h.b.setText(G.bs);
  h.c.setText('x' + mult()).setVisible(mult() > 1).x = h.b.x + h.b.width + 3;
  h.k.setText(Math.abs(G.v * 0.4) | 0).setTint(G.warn && G.v * 0.4 > 40 ? 0xff595e : SOFT);
  h.cf.forEach((c, i) => c.setAlpha(i < G.cafe ? 1 : 0.2));
  h.w.setVisible(G.warn && (G.time / 300 | 0) % 3 > 0);

  // próxima bajada (o próxima parada con gente esperando)
  let best = null, bd = 1e9, chip = 0, txt = '';
  for (const p of G.pax) {
    const d = stopX(p.d) - G.wx - DOOR;
    if (d > -200 && d < bd) { bd = d; best = p; }
  }
  if (best) { chip = best.col; txt = 'BAJA EN ' + NM(best.d); }
  else {
    const e = ents.find((e) => e.k == 'stop' && e.wait.length && e.wx > G.wx);
    if (e) { chip = 0xffffff; bd = e.wx - G.wx - DOOR; txt = 'RECOGE EN ' + NM(e.i); }
  }
  const near = txt && Math.abs(bd) < DOCK;
  h.i.setText(txt);
  h.id.setText(!txt ? '' : near ? '¡FRENA AQUI!' : Math.max(0, bd / 9 | 0) + ' M').setTint(near ? GREEN : GOLD);
  h.id.x = h.i.x + h.i.width + 6;
  h.id.setVisible(!near || (G.time / 200 | 0) % 2);
  h.ib.setVisible(!!txt).setSize(h.id.x + h.id.width, 13);

  hg.clear();
  if (txt) hg.fillStyle(chip).fillRect(8, 34, 7, 7);
  for (let i = 0; i < 8; i++) {
    const x = 148 + i * 11;
    const p = G.pax[i];
    hg.fillStyle(i < 6 ? 0x2a2a35 : 0x4a1a1a).fillRect(x, 11, 10, 12);
    if (p) {
      const f = Math.max(0, p.pat / p.mx);
      hg.fillStyle(p.col).fillRect(x + 3, 12, 4, 3).fillRect(x + 2, 16, 6, 6);
      hg.fillStyle(f > 0.5 ? 0x8ac926 : f > 0.25 ? 0xffca3a : 0xff595e).fillRect(x, 24, Math.ceil(10 * f), 2);
    }
  }
  const cnt = {};
  for (const p of G.pax) {
    const e = ents.find((e) => e.k == 'stop' && e.i == p.d);
    if (!e) continue;
    const k = (cnt[p.d] = (cnt[p.d] || 0) + 1);
    hg.fillStyle(p.col).fillRect(e.tag.x + e.tag.width / 2 + k * 5 - 2, 291, 4, 4);
  }
}

function render(dt, t) {
  const cx = Math.round(camX);
  L.rd.tilePositionX = L.wk.tilePositionX = L.wl.tilePositionX = L.lp.tilePositionX = L.sp.tilePositionX = cx;
  L.ct.tilePositionX = L.l0.tilePositionX = L.l1.tilePositionX = Math.round(cx * 0.35);
  L.av.tilePositionX = L.al.tilePositionX = Math.round(cx * 0.12);
  L.fb.tilePositionX = Math.round(cx * 0.07);
  L.fa.tilePositionX = Math.round(cx * 0.03);
  L.cl.tilePositionX = Math.round(cx * 0.05 + t * 0.004);
  // titileo de estrellas, luces de ranchos y luz de la antena
  const tw = Math.sin(t / 380) * 0.5 + 0.5, tw2 = Math.sin(t / 230 + 1) * 0.5 + 0.5;
  L.s0.alpha = 0.3 + 0.7 * tw;
  L.s1.alpha = 1 - 0.7 * tw;
  L.l0.alpha = 0.35 + 0.65 * tw2;
  L.l1.alpha = 1 - 0.65 * tw2;
  L.al.alpha = (t / 700 | 0) % 2;
  L.sp.alpha = Math.min(1, Math.max(0, ((G.ph == 'title' ? 90 : Math.abs(G.v)) - 40) / 180));

  const moving = Math.abs(G.ph == 'title' ? 90 : G.v) > 10;
  const by = Math.round(G.by + G.jy);
  bus.setPosition(G.bx, by - (moving && (t / 110 | 0) % 2 ? 1 : 0)).setDepth(10 + G.by).setVisible(G.inv <= 0 || (t / 70 | 0) % 2);
  const wt = 'w' + ((G.wx / 5) & 1);
  wa.setPosition(G.bx - 32, by - 6).setTexture(wt).setDepth(10.1 + G.by).setVisible(bus.visible);
  wb.setPosition(G.bx + 26, by - 6).setTexture(wt).setDepth(10.1 + G.by).setVisible(bus.visible);
  bsh.setPosition(G.bx, Math.round(G.by) + 2).setDepth(9.4 + G.by);

  for (let i = ents.length - 1; i >= 0; i--) {
    const e = ents[i];
    if (e.dead) {
      e.sp.forEach((s) => s.img.destroy());
      ents.splice(i, 1);
      continue;
    }
    for (const s of e.sp) {
      s.img.x = Math.round(e.wx + s.dx - camX);
      s.img.y = Math.round((e.rel ? e.y : 0) + s.dy + (s.bob ? Math.sin(t / 180 + e.wx) * 2 : 0));
    }
  }

  // guacamayas cruzando el cielo
  if (G.ph != 'pause') {
    if ((G.mc -= dt) < 0) {
      G.mc = rnd(9, 18);
      const y = rnd(40, 90);
      for (let i = 0; i < 3; i++) macs.push(S.add.image(W + 20 + i * 16, y + i * 5 - (i == 1 ? 8 : 0), 'm0').setDepth(4.5));
    }
    for (let i = macs.length - 1; i >= 0; i--) {
      const m = macs[i];
      m.x -= (45 + Math.max(0, G.v) * 0.05) * dt;
      m.setTexture('m' + ((t / 160 + i) & 1));
      if (m.x < -20) { m.destroy(); macs.splice(i, 1); }
    }
  }
}

// ---------------------------------------------------------------- fin y ranking
function gameOver() {
  G.ph = 'over';
  G.lock = G.time + 1200;
  G.nm = [0, 0, 0];
  G.np = 0;
  sfx('over');
  h.ov.setVisible(1);
  h.hud.setVisible(0);
  h.sb.setText(G.bs);
  [G.deliv, (G.wx / 9000).toFixed(1) + ' KM', 'x' + G.maxc].forEach((v, i) => h.sv[i].setText(v));
  h.nl.setText('ESCRIBE TU NOMBRE, CHOFER');
  h.ot.setText('ARRIBA/ABAJO: LETRA     B1: SIGUIENTE');
  h.or.forEach((r) => r.forEach((t) => t.setText('')));
  nameText();
}

const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function nameText() {
  const g = h.ng.clear();
  h.L.forEach((t, i) => {
    const on = i == G.np;
    t.setText(AZ[G.nm[i]]).setTint(on ? GOLD : 0xffffff).setVisible(1);
    g.fillStyle(on ? GOLD : LINE).fillRect(t.x - 10, 170, 20, 2);
    if (on) g.fillTriangle(t.x - 4, 138, t.x + 4, 138, t.x, 134).fillTriangle(t.x - 4, 175, t.x + 4, 175, t.x, 179);
  });
}

function nameEntry() {
  if (G.time > G.lock) {
    if (pr('U')) { G.nm[G.np] = (G.nm[G.np] + 1) % 26; sfx('lane'); }
    if (pr('D')) { G.nm[G.np] = (G.nm[G.np] + 25) % 26; sfx('lane'); }
    if (pr('L')) G.np = Math.max(0, G.np - 1);
    if (pr('R')) G.np = Math.min(2, G.np + 1);
    if (pr('1') | pr('S')) {
      sfx('sel');
      if (G.np < 2) G.np++;
      else return saveScore();
    }
  }
  nameText();
}

function saveScore() {
  const n = G.nm.map((c) => AZ[c]).join('');
  G.rank = G.rank.concat({ n, s: G.bs, d: G.deliv }).sort((a, b) => b.s - a.s).slice(0, 5);
  G.ph = 'rank';
  G.lock = G.time + 600;
  h.L.forEach((t) => t.setVisible(0));
  h.ng.clear();
  h.nl.setText('MEJORES CHOFERES');
  fillRank(h.or);
  h.ot.setText('START PARA VOLVER');
  rankText();
  getStore().set(KEY, G.rank).catch(() => {});
}

function getStore() {
  if (window.platanusArcadeStorage) return window.platanusArcadeStorage;
  return {
    async get(k) {
      try {
        const raw = localStorage.getItem(k);
        return raw === null ? { found: false, value: null } : { found: true, value: JSON.parse(raw) };
      } catch (e) {
        return { found: false, value: null };
      }
    },
    async set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    },
  };
}
