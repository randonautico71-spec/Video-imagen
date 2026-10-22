/* BIBLIOTECA DE FIGURAS. Cada figura vive en una caja de 100x100 y se compone de partes con su COLOR REAL
   (hoja verde, tronco marron, agua azul...). El modo 'luz' aclara ese color; 'solido' lo rellena con degradado.
   Para anadir una figura: VE.trazo.definir('nombre', { desc, partes:[{ d|circ|arco|union|creciente|gen, color, relleno, ancho,
   copias:{n,centro}, espejo }] }). Se revisan siempre en demo/figuras.html antes de usarlas. */
(function (VE) {
  const D = VE.trazo.definir, A = VE.trazo.arco, PI = Math.PI;
  const VERDE = '#4CC96A', VERDE2 = '#8BE6A0', MARRON = '#B07A4A', AGUA = '#4DB8FF', ROSA = '#FF8FC0', ORO = '#FFC84A', BLANCO = '#EAF4FF';

  D('sol', { desc: 'sol con 12 rayos', partes: [
    { circ: [50, 50, 17], color: ORO },
    { gen: () => Array.from({ length: 12 }, (_, i) => { const a = i / 12 * PI * 2, r0 = 25, r1 = i % 2 ? 33 : 41; return [[50 + Math.cos(a) * r0, 50 + Math.sin(a) * r0], [50 + Math.cos(a) * r1, 50 + Math.sin(a) * r1]]; }), color: '#FFB020' }] });

  D('luna', { desc: 'luna creciente con craters', partes: [
    { creciente: [[50, 50], 36, [66, 42], 30], color: '#F4E9B8' },
    { circ: [34, 56, 4], color: '#D9CC98' }, { circ: [42, 70, 2.6], color: '#D9CC98' }, { circ: [30, 40, 2.2], color: '#D9CC98' }] });

  D('estrella', { desc: 'estrella de 5 puntas', partes: [{ gen: () => { const o = []; for (let i = 0; i <= 10; i++) { const r = i % 2 ? 19 : 44, a = i / 10 * PI * 2 - PI / 2; o.push([50 + Math.cos(a) * r, 52 + Math.sin(a) * r]); } return [{ pts: o, cerrada: true }]; }, color: '#FFE08A' }] });

  D('destello', { desc: 'destello de 4 puntas', partes: [
    { d: 'M50 4 C52 36 64 48 96 50 C64 52 52 64 50 96 C48 64 36 52 4 50 C36 48 48 36 50 4 Z', color: '#FFF0B0' }] });

  D('hoja', { desc: 'hoja con nervios', partes: [
    { d: 'M50 6 C74 22 86 48 79 72 C74 86 62 94 50 95 C38 94 26 86 21 72 C14 48 26 22 50 6 Z', color: VERDE },
    { d: 'M50 12 L50 99', color: VERDE2, ancho: 0.8 },
    { d: 'M50 74 C58 68 66 62 72 52 M50 56 C56 50 62 44 66 34 M50 74 C42 68 34 62 28 52 M50 56 C44 50 38 44 34 34', color: VERDE2, ancho: 0.6 }] });

  D('flor', { desc: 'flor de 6 petalos con tallo y hoja', partes: [
    { d: 'M50 50 C40 38 40 20 50 10 C60 20 60 38 50 50 Z', color: ROSA, copias: { n: 6, centro: [50, 38] }, orden: 1 },
    { circ: [50, 38, 7.5], color: ORO, orden: 2 },
    { d: 'M50 74 C51 84 49 92 50 99', color: VERDE, ancho: 1.1, orden: 0 },
    { d: 'M50 88 C60 82 70 82 76 86 C70 94 58 94 50 88 Z', color: VERDE, orden: 0 }] });

  D('loto', { desc: 'flor de loto sobre el agua', partes: [
    { d: 'M50 24 C60 42 60 64 50 80 C40 64 40 42 50 24 Z', color: '#FFB3DA', orden: 2 },
    { d: 'M50 80 C44 62 40 44 24 36 C22 56 32 72 50 80 Z', color: ROSA, espejo: true, orden: 1 },
    { d: 'M50 80 C36 74 22 62 12 52 C10 66 24 80 50 80 Z', color: '#FF7AB8', espejo: true, orden: 0 },
    { d: 'M8 86 C30 80 70 80 92 86', color: AGUA, ancho: 0.9 }, { d: 'M20 93 C38 89 62 89 80 93', color: AGUA, ancho: 0.6 }] });

  D('arbol', { desc: 'arbol frondoso', partes: [
    { union: [[50, 32, 22], [31, 44, 16], [69, 44, 16], [40, 24, 14], [60, 24, 14]], color: '#58D07A', orden: 1 },
    { d: 'M45 97 C47 82 47 70 44 58 M55 97 C53 82 53 70 56 58', color: MARRON, ancho: 1.1, relleno: false, orden: 0 },
    { d: 'M50 76 C50 66 45 58 38 50 M50 70 C52 62 57 56 64 48', color: '#9A6A3E', ancho: 0.7, orden: 2 },
    { d: 'M38 97 C44 94 56 94 62 97', color: MARRON, ancho: 0.8 }] });

  D('pino', { desc: 'pino de tres pisos', partes: [
    { d: 'M50 4 L66 34 L58 34 L74 62 L64 62 L83 88 L17 88 L36 62 L26 62 L42 34 L34 34 Z', color: '#3FB86C', orden: 1 },
    { d: 'M45 88 L45 98 L55 98 L55 88', color: MARRON, relleno: false, orden: 0 }] });

  D('montana', { desc: 'montanas con nieve', partes: [
    { d: 'M4 92 L32 40 L47 62 L63 28 L96 92 Z', color: '#8FA3C7', orden: 0 },
    { d: 'M54 44 L63 28 L72 44 L66 41 L63 48 L59 41 Z', color: BLANCO, orden: 1 },
    { d: 'M26 52 L32 40 L38 52 L34 50 L32 55 L29 50 Z', color: BLANCO, orden: 1 }] });

  D('nube', { desc: 'nube', partes: [{ union: [[28, 62, 16], [46, 48, 21], [68, 52, 18], [80, 66, 14], [54, 70, 16]], color: '#CFE3FF' },
    { d: 'M30 78 C44 82 66 82 80 76', color: '#9FC2F0', ancho: 0.6 }] });

  D('gota', { desc: 'gota de agua', partes: [
    { d: 'M50 6 C62 30 78 46 78 63 C78 80 66 94 50 94 C34 94 22 80 22 63 C22 46 38 30 50 6 Z', color: AGUA },
    { d: 'M36 64 C36 73 41 80 48 82', color: '#BDE6FF', ancho: 0.7 }] });

  D('ola', { desc: 'tres lineas de agua', partes: [
    { d: 'M4 38 C16 28 28 28 40 38 S64 48 76 38 S92 30 96 34', color: AGUA, ancho: 1 },
    { d: 'M4 56 C16 46 28 46 40 56 S64 66 76 56 S92 48 96 52', color: '#6CC8FF', ancho: 1 },
    { d: 'M4 74 C16 64 28 64 40 74 S64 84 76 74 S92 66 96 70', color: '#8FD6FF', ancho: 1 }] });

  D('pajaro', { desc: 'ave en vuelo', partes: [
    { d: 'M6 52 C20 34 38 34 50 54 C62 34 80 34 94 52 C80 46 64 48 50 62 C36 48 20 46 6 52 Z', color: '#CFE0FF' }] });

  D('mariposa', { desc: 'mariposa', partes: [
    { d: 'M50 46 C58 18 90 10 93 34 C95 52 72 56 50 48 Z', color: '#B88CFF', espejo: true, orden: 1 },
    { d: 'M50 52 C66 56 84 66 78 84 C72 96 54 80 50 58 Z', color: '#FF9ED2', espejo: true, orden: 1 },
    { d: 'M50 38 L50 78', color: '#E9D8FF', ancho: 1.2, orden: 2 },
    { d: 'M50 38 C47 28 43 24 38 22', color: '#E9D8FF', ancho: 0.7, espejo: true, orden: 2 },
    { circ: [72, 32, 5], color: '#FFD27A', espejo: true, orden: 2 }] });

  D('pez', { desc: 'pez', partes: [
    { d: 'M8 50 C24 26 58 24 74 50 C58 76 24 74 8 50 Z', color: '#FF9F5A', orden: 1 },
    { d: 'M74 50 L94 32 C90 44 90 56 94 68 Z', color: '#FF7F4A', orden: 0 },
    { d: 'M42 32 C46 20 56 20 60 32', color: '#FFB27A', ancho: 0.8, orden: 0 },
    { circ: [24, 46, 3], color: BLANCO, orden: 2 },
    { arco: [56, 50, 10, 14, PI * 0.6, PI * 1.4], color: '#FFC28F', ancho: 0.6, orden: 2 }] });

  D('arcoiris', { desc: 'arcoiris de 6 bandas', partes: ['#FF5A5A', '#FFA64D', '#FFE14D', '#5BE07A', '#4DA3FF', '#A87CFF'].map((c, i) =>
    ({ arco: [50, 84, 44 - i * 6, 44 - i * 6, PI, PI * 2], color: c, ancho: 1.1, orden: i })) });

  D('corazon', { desc: 'corazon', partes: [
    { d: 'M50 90 C20 68 7 48 11 31 C15 14 38 11 50 30 C62 11 85 14 89 31 C93 48 80 68 50 90 Z', color: '#FF6B8B' }] });

  D('seta', { desc: 'seta de bosque', partes: [
    { d: 'M8 58 C8 28 28 10 50 10 C72 10 92 28 92 58 C70 66 30 66 8 58 Z', color: '#FF6A5C', orden: 1 },
    { d: 'M38 62 C37 74 37 86 34 95 L66 95 C63 86 63 74 62 62', color: '#F2E3C8', orden: 0 },
    { circ: [30, 38, 6], color: BLANCO, orden: 2 }, { circ: [56, 28, 5], color: BLANCO, orden: 2 }, { circ: [72, 46, 6], color: BLANCO, orden: 2 }] });

  D('helecho', { desc: 'helecho', partes: [{ gen: () => {
    const sub = [], tallo = []; for (let i = 0; i <= 40; i++) { const t = i / 40; tallo.push([50 + Math.sin(t * 1.6) * 16 * t, 98 - t * 92]); } sub.push(tallo);
    for (let i = 3; i < 40; i += 2) { const [x, y] = tallo[i], t = i / 40, L = (1 - t) * 30 + 5;
      sub.push([[x, y], [x - L * 0.55, y - L * 0.38], [x - L, y - L * 0.1]]); sub.push([[x, y], [x + L * 0.55, y - L * 0.38], [x + L, y - L * 0.1]]); }
    return sub; }, color: VERDE }] });

  D('mandala', { desc: 'mandala de petalos concentricos', partes: [
    { d: 'M50 50 C44 40 44 28 50 20 C56 28 56 40 50 50 Z', color: '#FF8FC0', copias: { n: 12, centro: [50, 50] }, orden: 0 },
    { d: 'M50 22 C42 14 42 8 50 3 C58 8 58 14 50 22 Z', color: '#B88CFF', copias: { n: 12, centro: [50, 50], desde: PI / 12 }, orden: 1 },
    { circ: [50, 50, 8], color: ORO, orden: 3 }, { circ: [50, 50, 30], color: '#6CC8FF', ancho: 0.6, relleno: false, orden: 0 }, { circ: [50, 50, 47], color: '#8FD6FF', ancho: 0.6, relleno: false, orden: 0 }] });

  D('espiral', { desc: 'espiral', partes: [{ gen: () => { const o = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * PI * 6, r = 3 + i / 160 * 42; o.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]); } return [o]; }, color: '#B88CFF' }] });

  D('meditando', { desc: 'persona sentada meditando, de frente', partes: [
    { circ: [50, 16, 8], color: '#F2D1B0', orden: 1 },
    { d: 'M46.5 24 L46.5 29 M53.5 24 L53.5 29', color: '#F2D1B0', ancho: 0.7, relleno: false, orden: 1 },
    { d: 'M36 33 C42 29.5 58 29.5 64 33', color: '#9CB4FF', relleno: false, orden: 0 },
    { d: 'M36 33 C33 44 35 54 40 62', color: '#9CB4FF', espejo: true, relleno: false, orden: 0 },
    { d: 'M36 33 C29 42 26 54 24 67', color: '#9CB4FF', espejo: true, relleno: false, orden: 0 },
    { d: 'M41 38 C35 46 32 56 30 67', color: '#9CB4FF', espejo: true, relleno: false, ancho: 0.8, orden: 0 },
    { circ: [26.5, 70, 3.4], color: '#F2D1B0', espejo: true, orden: 2 },
    { d: 'M40 62 C28 65 14 71 10 81 C20 92 40 95 50 91', color: '#7C94E8', espejo: true, relleno: false, orden: 0 },
    { d: 'M14 83 C30 79 44 84 56 91', color: '#7C94E8', espejo: true, relleno: false, ancho: 0.8, orden: 0 },
    { d: 'M40 62 L60 62', color: '#9CB4FF', relleno: false, ancho: 0.7, orden: 0 }] });

  D('sendero', { desc: 'camino sinuoso hacia el horizonte', partes: [
    { d: 'M14 98 C30 86 62 80 58 62 C55 48 44 44 48 30 C50 24 50 20 50 16', color: '#D9B98A', ancho: 1.1 },
    { d: 'M56 98 C70 90 86 84 76 66 C70 54 56 54 54 40 C53 30 52 22 51 16', color: '#D9B98A', ancho: 1.1 },
    { d: 'M30 96 C44 88 70 82 66 64 C63 52 52 49 51 36', color: '#EBCFA0', ancho: 0.5, abierta: true },
    { d: 'M30 19 C40 17 60 17 70 19', color: '#9FB6E8', ancho: 0.6 }] });

  D('mata', { desc: 'mata de hierba', partes: [
    { d: 'M50 98 C49 74 40 52 28 32', color: VERDE }, { d: 'M50 98 C50 70 48 44 46 14', color: '#6EDC8A' }, { d: 'M50 98 C52 72 58 50 70 30', color: VERDE },
    { d: 'M48 98 C42 80 30 66 14 56', color: '#5BCB7A' }, { d: 'M52 98 C60 80 72 68 88 60', color: '#5BCB7A' },
    { d: 'M49 98 C46 78 36 60 24 44', color: '#7EE09A', ancho: 0.8 }, { d: 'M51 98 C55 76 64 58 78 44', color: '#7EE09A', ancho: 0.8 }, { d: 'M50 98 C51 82 54 66 58 52', color: '#6EDC8A', ancho: 0.7 }] });

  D('luciernaga', { desc: 'luciernaga con abdomen luminoso y alas', partes: [
    { arco: [60, 54, 15, 11, 0, PI * 2, 48, 0.0], color: '#F6FF8A', orden: 3 },
    { arco: [40, 50, 13, 9, 0, PI * 2, 48, 0.0], color: '#7A5A38', orden: 2 },
    { circ: [25, 48, 7], color: '#5A4228', orden: 2 },
    { arco: [48, 34, 22, 9, 0, PI * 2, 48, -0.35], color: '#DDEFFF', ancho: 0.7, relleno: false, orden: 1 },
    { arco: [52, 30, 20, 8, 0, PI * 2, 48, -0.12], color: '#BFD9FF', ancho: 0.6, relleno: false, orden: 1 },
    { d: 'M22 42 C18 32 12 28 6 28 M26 41 C26 30 24 22 20 16', color: '#DDEFFF', ancho: 0.7, orden: 0 },
    { d: 'M34 58 L30 72 M42 58 L40 74 M50 58 L52 72', color: '#8A6A3A', ancho: 0.7, orden: 0 }] });

  D('constelacion', { desc: 'constelacion con estrellas unidas', partes: [
    { d: 'M10 70 L28 44 L48 52 L64 24 L88 36', color: '#9FB6E8', ancho: 0.6 },
    { circ: [10, 70, 3], color: '#FFF0B0' }, { circ: [28, 44, 3.6], color: '#FFF0B0' }, { circ: [48, 52, 3], color: '#FFF0B0' }, { circ: [64, 24, 4.2], color: '#FFF0B0' }, { circ: [88, 36, 3], color: '#FFF0B0' }] });

  D('ojo', { desc: 'ojo sereno', partes: [
    { d: 'M6 50 C24 24 76 24 94 50 C76 76 24 76 6 50 Z', color: '#9CB4FF' }, { circ: [50, 50, 14], color: '#6EE7F9' }, { circ: [50, 50, 5], color: BLANCO }] });
})(window.VE = window.VE || {});
