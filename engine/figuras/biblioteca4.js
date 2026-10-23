/* BIBLIOTECA 4: fusion nuclear (nucleos, isotopos, tokamak, estelerador, laser, imanes, manta de litio, mediciones y energia cotidiana).
   Mismo estilo de trazos de luz que biblioteca3; pensada para fondo oscuro. */
(function (VE) {
  const D = VE.trazo.definir, PI = Math.PI;
  const ORO = '#FFC84A', AZ = '#6CC8FF', VI = '#B88CFF', ROSA = '#FF8FC0', VERDE = '#5BE07A', BL = '#EAF4FF', AM = '#FFB86B', GR = '#9FB6E8', RJ = '#FF7A6B';
  const P = (x, y, r = 11) => [{ circ: [x, y, r], color: ROSA, relleno: false, ancho: 1.2, orden: 2 }, { d: `M${x - r * .5} ${y} L${x + r * .5} ${y} M${x} ${y - r * .5} L${x} ${y + r * .5}`, color: ROSA, relleno: false, ancho: 0.8, orden: 2 }];
  const N = (x, y, r = 11) => [{ circ: [x, y, r], color: AZ, relleno: false, ancho: 1.2, orden: 2 }, { circ: [x, y, r * 0.3], color: AZ, orden: 3 }];

  D('proton', { desc: 'proton: esfera con signo mas', partes: [...P(50, 50, 26)] });
  D('neutron', { desc: 'neutron: esfera neutra', partes: [...N(50, 50, 26)] });
  D('hidrogeno', { desc: 'hidrogeno: un proton y un electron en orbita', partes: [...P(50, 50, 9), { circ: [50, 50, 34], color: GR, relleno: false, ancho: 0.6, orden: 0 }, { circ: [84, 50, 3.4], color: BL, orden: 4 }] });
  D('deuterio', { desc: 'deuterio: proton y neutron', partes: [...P(36, 50, 18), ...N(64, 50, 18)] });
  D('tritio', { desc: 'tritio: un proton y dos neutrones', partes: [...P(32, 56, 16), ...N(62, 36, 16), ...N(66, 70, 16)] });
  D('helio4', { desc: 'helio: dos protones y dos neutrones', partes: [...P(38, 38, 15), ...N(62, 38, 15), ...N(38, 62, 15), ...P(62, 62, 15)] });
  D('uranio', { desc: 'nucleo pesado: muchas piezas', partes: [{ gen: () => { const o = []; let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 26; i++) { const a = r() * PI * 2, d = Math.sqrt(r()) * 34, x = 50 + Math.cos(a) * d, y = 50 + Math.sin(a) * d; o.push([[x, y], [x + .6, y + .3]]); } return o; }, color: AM, ancho: 6 }, { circ: [50, 50, 40], color: AM, relleno: false, ancho: 0.7, orden: 0 }] });
  D('litio', { desc: 'litio: nucleo de seis piezas y dos capas de electrones', partes: [...P(44, 44, 8), ...N(58, 44, 8), ...P(50, 56, 8), ...N(40, 58, 8), ...P(60, 58, 8), { circ: [50, 50, 28], color: GR, relleno: false, ancho: 0.6, orden: 0 }, { circ: [50, 50, 44], color: GR, relleno: false, ancho: 0.6, orden: 0 }, { circ: [78, 50, 3], color: BL, orden: 4 }, { circ: [22, 50, 3], color: BL, orden: 4 }, { circ: [50, 6, 3], color: BL, orden: 4 }] });
  D('balanza', { desc: 'balanza de dos platos', partes: [
    { d: 'M50 16 L50 82 M30 84 L70 84 M16 30 L84 30', color: GR, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M16 30 L8 56 L26 56 Z M84 30 L76 56 L94 56 Z', color: AZ, relleno: false, ancho: 0.9, orden: 1 }, { circ: [50, 16, 3], color: ORO, orden: 3 }] });
  D('tokamak', { desc: 'tokamak: camara en forma de rosquilla con bobinas y un anillo de plasma', partes: [
    { arco: [50, 56, 44, 22, 0, PI * 2, 90, 0], color: GR, ancho: 1.2, relleno: false, orden: 0 },
    { arco: [50, 56, 20, 8, 0, PI * 2, 70, 0], color: GR, ancho: 1, relleno: false, orden: 0 },
    { arco: [50, 56, 32, 15, 0, PI * 2, 90, 0], color: AM, ancho: 1.6, orden: 3 },
    { gen: () => Array.from({ length: 14 }, (_, i) => { const a = i / 14 * PI * 2, x = 50 + Math.cos(a) * 32, y = 56 + Math.sin(a) * 15, o = []; for (let j = 0; j <= 24; j++) { const b = j / 24 * PI * 2; o.push([x + Math.cos(b) * 5.5, y + Math.sin(b) * 11]); } return o; }), color: AZ, ancho: 0.6 }] });
  D('estelerador', { desc: 'estelerador: anillo retorcido con bobinas de forma curva', partes: [
    { gen: () => [0, 1].map(k => { const o = []; for (let i = 0; i <= 160; i++) { const t = i / 160 * PI * 2, w = 6 * Math.cos(5 * t + k * PI); o.push([50 + (32 + w) * Math.cos(t) * 1.25, 52 + (15 + w * .5) * Math.sin(t) + 5 * Math.sin(5 * t + k * PI)]); } return o; }), color: AM, ancho: 1.3 },
    { gen: () => Array.from({ length: 10 }, (_, i) => { const t = i / 10 * PI * 2, x = 50 + 32 * Math.cos(t) * 1.25, y = 52 + 15 * Math.sin(t), o = []; for (let j = 0; j <= 20; j++) { const b = j / 20 * PI * 2; o.push([x + Math.cos(b) * (5 + 2 * Math.sin(3 * t)), y + Math.sin(b) * 10]); } return o; }), color: VI, ancho: 0.6 }] });
  D('capsula_laser', { desc: 'capsula diminuta rodeada de rayos laser que convergen', partes: [
    { circ: [50, 50, 6], color: ORO, orden: 3 }, { circ: [50, 50, 11], color: GR, relleno: false, ancho: 0.8, orden: 1 },
    { gen: () => Array.from({ length: 16 }, (_, i) => { const a = i / 16 * PI * 2; return [[50 + Math.cos(a) * 46, 50 + Math.sin(a) * 46], [50 + Math.cos(a) * 15, 50 + Math.sin(a) * 15]]; }), color: '#FF8F8F', ancho: 0.9 }] });
  D('iman', { desc: 'iman en herradura con lineas de campo', partes: [
    { d: 'M26 18 L26 52 C26 82 74 82 74 52 L74 18 L60 18 L60 52 C60 62 40 62 40 52 L40 18 Z', color: RJ, relleno: false, ancho: 1.4, orden: 1 },
    { d: 'M26 18 L40 18 M60 18 L74 18', color: BL, relleno: false, ancho: 2, orden: 2 },
    { gen: () => [8, 14, 20].map(r => { const o = []; for (let i = 0; i <= 30; i++) { const a = PI - i / 30 * PI; o.push([50 + Math.cos(a) * (10 + r), 14 - Math.sin(a) * r * 1.2]); } return o; }), color: AZ, ancho: 0.6 }] });
  D('campo', { desc: 'lineas de campo magnetico alrededor de un punto', partes: [
    { gen: () => [14, 24, 34, 44].map(r => { const o = []; for (let i = 0; i <= 50; i++) { const a = i / 50 * PI * 2; o.push([50 + Math.cos(a) * r * 1.1, 50 + Math.sin(a) * r * .8]); } return o; }), color: AZ, ancho: 0.8 },
    { circ: [50, 50, 5], color: ORO, orden: 3 }] });
  D('barril', { desc: 'barril de petroleo', partes: [
    { d: 'M26 24 L26 78 C26 88 74 88 74 78 L74 24', color: AM, relleno: false, ancho: 1.3, orden: 1 }, { arco: [50, 24, 24, 7, 0, PI * 2, 40, 0], color: AM, ancho: 1, relleno: false, orden: 1 },
    { d: 'M26 44 C26 52 74 52 74 44 M26 62 C26 70 74 70 74 62', color: GR, relleno: false, ancho: 0.8, orden: 0 }] });
  D('clip', { desc: 'un clip pequeno', partes: [{ d: 'M38 22 L38 72 C38 90 64 90 64 72 L64 30 C64 16 50 16 50 30 L50 66', color: GR, relleno: false, ancho: 1.6, orden: 1 }] });
  D('turbina', { desc: 'turbina con aspas', partes: [
    { gen: () => [0, 1, 2].map(k => { const o = []; for (let i = 0; i <= 20; i++) { const t = i / 20, a = k * PI * 2 / 3 + t * 0.7; o.push([50 + Math.cos(a) * 8 + Math.cos(a - 0.5) * t * 36, 50 + Math.sin(a) * 8 + Math.sin(a - 0.5) * t * 36]); } return o; }), color: AZ, ancho: 1.4 },
    { circ: [50, 50, 6], color: ORO, orden: 3 }, { circ: [50, 50, 40], color: GR, relleno: false, ancho: 0.6, orden: 0 }] });
  D('bateria', { desc: 'bateria', partes: [
    { d: 'M24 32 L72 32 L72 68 L24 68 Z M72 42 L80 42 L80 58 L72 58', color: VERDE, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M32 40 L32 60 M42 40 L42 60 M52 40 L52 60', color: VERDE, relleno: false, ancho: 2.2, orden: 2 }] });
  D('termometro', { desc: 'termometro muy caliente', partes: [
    { d: 'M42 16 C42 10 58 10 58 16 L58 62 C68 68 68 90 50 90 C32 90 32 68 42 62 Z', color: GR, relleno: false, ancho: 1.3, orden: 1 }, { circ: [50, 76, 8], color: RJ, orden: 3 }, { d: 'M50 76 L50 26', color: RJ, relleno: false, ancho: 2, orden: 3 },
    { d: 'M62 24 L70 24 M62 36 L70 36 M62 48 L70 48', color: GR, relleno: false, ancho: 0.8, orden: 0 }] });
  D('llama', { desc: 'llama', partes: [{ d: 'M50 10 C58 30 76 40 72 62 C70 80 58 90 50 90 C40 90 28 80 28 62 C28 50 36 44 40 34 C44 40 46 44 48 44 C52 34 46 22 50 10 Z', color: AM, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M50 56 C56 64 60 70 56 80 C52 84 46 82 44 76 C42 68 48 64 50 56 Z', color: ORO, relleno: false, ancho: 1, orden: 2 }] });
  D('cronometro', { desc: 'cronometro', partes: [
    { circ: [50, 56, 34], color: GR, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M44 14 L56 14 M50 14 L50 22 M76 28 L82 22', color: GR, relleno: false, ancho: 1.2, orden: 1 }, { d: 'M50 56 L50 34', color: ORO, relleno: false, ancho: 1.6, orden: 3 }, { d: 'M50 56 L64 62', color: AM, relleno: false, ancho: 1, orden: 2 }, { circ: [50, 56, 3], color: ORO, orden: 4 }] });
  D('calendario', { desc: 'calendario con una casilla marcada', partes: [
    { d: 'M18 24 L82 24 L82 84 L18 84 Z M18 40 L82 40 M34 16 L34 30 M66 16 L66 30', color: GR, relleno: false, ancho: 1.2, orden: 1 }, { gen: () => { const o = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) o.push([[26 + c * 14, 52 + r * 10], [27 + c * 14, 52 + r * 10]]); return o; }, color: GR, ancho: 2.6 }, { circ: [54, 62, 6], color: ORO, relleno: false, ancho: 1.2, orden: 3 }] });
  D('muro_neutrones', { desc: 'pared de ladrillos golpeada por neutrones', partes: [
    { d: 'M60 10 L60 90 M60 10 L92 10 L92 90 L60 90 M60 30 L92 30 M60 50 L92 50 M60 70 L92 70 M76 10 L76 30 M68 30 L68 50 M84 30 L84 50 M76 50 L76 70 M68 70 L68 90 M84 70 L84 90', color: GR, relleno: false, ancho: 0.9, orden: 0 },
    { gen: () => [24, 44, 62, 80].map(y => [[8, y], [52, y]]), color: AZ, ancho: 1 }, ...[24, 44, 62, 80].map(y => ({ circ: [54, y, 3], color: AZ, orden: 3 }))] });
  D('ciclo', { desc: 'flechas circulares: se fabrica y se consume', partes: [
    { arco: [50, 50, 32, 32, 0.4, PI - 0.4, 40, 0], color: VERDE, ancho: 1.4, relleno: false, orden: 1 }, { arco: [50, 50, 32, 32, PI + 0.4, PI * 2 - 0.4, 40, 0], color: VERDE, ancho: 1.4, relleno: false, orden: 1 },
    { d: 'M20 56 L26 66 L34 58 M80 44 L74 34 L66 42', color: VERDE, relleno: false, ancho: 1.4, orden: 2 }] });
  D('colina', { desc: 'colina con un hoyo en la cima: la barrera que los nucleos deben vencer', partes: [
    { d: 'M4 88 C24 88 28 34 40 30 C44 28 46 40 50 40 C54 40 56 28 60 30 C72 34 76 88 96 88', color: GR, relleno: false, ancho: 1.3, orden: 1 }, { circ: [12, 80, 3.6], color: ROSA, orden: 3 }, { circ: [88, 80, 3.6], color: ROSA, orden: 3 }] });
  D('barras_q', { desc: 'dos barras: poca energia que entra, mucha que sale', partes: [
    { d: 'M20 86 L20 70 L36 70 L36 86 Z', color: AZ, ancho: 1, orden: 1 }, { d: 'M62 86 L62 24 L78 24 L78 86 Z', color: ORO, ancho: 1, orden: 1 }, { d: 'M10 86 L90 86', color: GR, relleno: false, ancho: 1, orden: 0 }, { d: 'M38 56 L58 40', color: GR, relleno: false, ancho: 0.8, orden: 0 }] });
  D('chimenea', { desc: 'fabrica con chimenea y humo', partes: [
    { d: 'M14 86 L14 56 L40 56 L40 40 L66 40 L66 56 L86 56 L86 86 Z M72 56 L72 30 L82 30 L82 56', color: GR, relleno: false, ancho: 1.2, orden: 1 }, { d: 'M76 24 C70 16 82 12 76 4 M84 22 C80 14 90 10 86 4', color: GR, relleno: false, ancho: 0.8, orden: 0 }] });
  D('aerogenerador', { desc: 'aerogenerador', partes: [
    { d: 'M50 44 L46 92 L54 92 Z', color: GR, relleno: false, ancho: 1, orden: 0 }, { circ: [50, 42, 4], color: ORO, orden: 3 }, { d: 'M50 42 L50 8 M50 42 L80 60 M50 42 L20 60', color: AZ, relleno: false, ancho: 1.6, orden: 1 }] });
  D('rayo', { desc: 'rayo', partes: [{ d: 'M58 6 L30 50 L48 50 L38 94 L72 40 L52 40 Z', color: ORO, relleno: false, ancho: 1.4, orden: 1 }] });
  D('tubo', { desc: 'tubo fluorescente', partes: [{ d: 'M14 42 L86 42 L86 58 L14 58 Z', color: BL, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M8 46 L14 46 M8 54 L14 54 M86 46 L92 46 M86 54 L92 54', color: GR, relleno: false, ancho: 1, orden: 0 }, { d: 'M20 50 L80 50', color: VI, relleno: false, ancho: 3, orden: 2 }] });
  D('globo', { desc: 'globo de fiesta', partes: [{ union: [[50, 38, 24]], color: ROSA, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M46 62 L54 62 L50 68 Z M50 68 C44 78 56 84 50 94', color: ROSA, relleno: false, ancho: 1, orden: 1 }] });
  D('casa', { desc: 'casa con ventana encendida', partes: [{ d: 'M16 50 L50 20 L84 50 M24 46 L24 84 L76 84 L76 46', color: GR, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M40 62 L60 62 L60 76 L40 76 Z', color: AM, ancho: 1, orden: 2 }] });
  D('mundo_unido', { desc: 'tierra con puntos de luz repartidos: paises colaborando', partes: [
    { circ: [50, 50, 36], color: AZ, relleno: false, ancho: 1.2, orden: 0 }, { arco: [50, 50, 36, 12, 0, PI * 2, 60, 0], color: AZ, ancho: 0.6, relleno: false, orden: 0 }, { arco: [50, 50, 12, 36, 0, PI * 2, 60, 0], color: AZ, ancho: 0.6, relleno: false, orden: 0 },
    ...[[30, 36], [66, 32], [74, 58], [40, 68], [54, 48]].map(p => ({ circ: [p[0], p[1], 3], color: ORO, orden: 3 }))] });
  D('pared_ruta', { desc: 'camino de obstaculos y una meta: lo que falta', partes: [{ d: 'M6 80 L30 80 L30 64 L54 64 L54 48 L78 48 L78 32 L94 32', color: GR, relleno: false, ancho: 1.2, orden: 1 }, { d: 'M86 32 L86 14 L96 18 L86 22', color: ORO, relleno: false, ancho: 1, orden: 3 }, { circ: [14, 72, 3.5], color: AZ, orden: 3 }] });
})(window.VE);
