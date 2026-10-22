/* BIBLIOTECA 2: manos y mudras, cerebro, cosmos, brujula, caminante y animales (siluetas de luz con estrellas en los vertices). */
(function (VE) {
  const D = VE.trazo.definir, PI = Math.PI, A = VE.trazo.arco;
  const PIEL = '#F2D1B0', ORO = '#FFC84A', AZ = '#6CC8FF', VI = '#B88CFF', ROSA = '#FF8FC0', VERDE = '#4CC96A', BLANCO = '#EAF4FF';
  const nodos = (pts, col, r = 1.7) => pts.map(p => ({ circ: [p[0], p[1], r], color: col, ancho: 0.9, relleno: false, orden: 5 }));

  // ---------- manos ----------
  const MANO = 'M34 98 L33 52 L33 29 C33 21 43 21 43 29 L43 48 L43 22 C43 14 53 14 53 22 L53 48 L53 27 C53 19 63 19 63 27 L63 48 L63 38 C63 30 71 30 71 38 L71 58 L73 66 L70 98 Z';
  D('mano', { desc: 'mano abierta, palma al frente', partes: [
    { d: MANO, color: PIEL, orden: 1 },
    { d: 'M33 76 C25 71 18 62 14 52 C12 46 18 43 22 48 C26 54 30 60 33 63', color: PIEL, relleno: false, orden: 1 },
    { d: 'M38 70 C44 74 52 74 58 70', color: '#E8B890', ancho: 0.6, relleno: false, orden: 0 }] });

  D('anjali', { desc: 'manos juntas ante el pecho (anjali mudra)', partes: [
    { d: 'M50 4 C57 16 65 34 66 56 C67 72 62 86 54 92 L46 92 C38 86 33 72 34 56 C35 34 43 16 50 4 Z', color: PIEL, orden: 1 },
    { d: 'M50 6 L50 90', color: '#E8B890', ancho: 0.8, relleno: false, orden: 0 },
    { d: 'M45.5 14 C44.5 30 44.5 46 45 60 M54.5 14 C55.5 30 55.5 46 55 60 M41 26 C39 40 39 52 40 62 M59 26 C61 40 61 52 60 62', color: '#E8B890', ancho: 0.55, relleno: false, orden: 0 },
    { d: 'M40 62 C36 66 36 74 42 76 C46 76 47 70 46 66 M60 62 C64 66 64 74 58 76 C54 76 53 70 54 66', color: PIEL, ancho: 0.9, relleno: false, orden: 2 },
    { d: 'M44 92 L42 100 M56 92 L58 100 M38 84 C34 90 32 96 33 100 M62 84 C66 90 68 96 67 100', color: PIEL, relleno: false, orden: 0 },
    { circ: [50, 64, 2.2], color: ORO, orden: 3 }] });

  D('gyan', { desc: 'mudra de pulgar e indice unidos en anillo, otros tres dedos extendidos', partes: [
    { d: 'M34 98 L33 66 C33 56 38 50 43 47 L43 22 C43 14 53 14 53 22 L53 48 L53 27 C53 19 63 19 63 27 L63 48 L63 38 C63 30 71 30 71 38 L71 58 L73 66 L70 98 Z', color: PIEL, orden: 1 },
    { circ: [29, 44, 9], color: ORO, relleno: false, ancho: 1.2, orden: 3 },
    { d: 'M33 72 C27 68 24 62 24 55 M38 54 C34 52 33 50 33 47', color: PIEL, relleno: false, orden: 1 }] });

  // ---------- cerebro ----------
  D('cerebro', { desc: 'cerebro de perfil, estilizado', partes: [
    { union: [[34, 44, 17], [50, 34, 19], [68, 42, 18], [30, 60, 14], [48, 56, 18], [66, 60, 14]], color: ROSA, orden: 1 },
    { union: [[68, 72, 10], [80, 68, 6]], color: '#FFB3DA', orden: 0 },
    { d: 'M52 18 C46 30 54 40 48 54', color: '#FFD0E8', ancho: 0.7, relleno: false, orden: 2 },
    { d: 'M26 46 C34 40 38 50 46 46 M58 28 C66 32 62 42 72 44 M32 62 C40 56 46 62 54 56 M56 66 C62 62 68 66 74 62', color: '#FFD0E8', ancho: 0.6, relleno: false, orden: 2 },
    { d: 'M46 74 L48 92 L56 92 L56 74', color: '#FFB3DA', relleno: false, orden: 0 }] });

  // ---------- cosmos ----------
  D('galaxia', { desc: 'galaxia espiral de dos brazos', partes: [
    { gen: () => [0, PI].map(off => { const o = []; for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * PI * 2.6 + off, r = 5 + t * 40; o.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r * 0.9]); } return o; }), color: AZ, ancho: 1.1 },
    { gen: () => [0.6, PI + 0.6].map(off => { const o = []; for (let i = 0; i <= 100; i++) { const t = i / 100, a = t * PI * 2.6 + off, r = 7 + t * 34; o.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r * 0.9]); } return o; }), color: VI, ancho: 0.7 },
    { circ: [50, 50, 5], color: '#FFE08A', orden: 3 }, { circ: [50, 50, 10], color: '#FFB86B', ancho: 0.6, relleno: false, orden: 3 }] });

  D('atomo', { desc: 'atomo con tres orbitas', partes: [
    { circ: [50, 50, 5], color: ORO, orden: 3 },
    { arco: [50, 50, 44, 16, 0, PI * 2, 80, 0], color: AZ, ancho: 0.8, orden: 0 },
    { arco: [50, 50, 44, 16, 0, PI * 2, 80, PI / 3], color: VI, ancho: 0.8, orden: 0 },
    { arco: [50, 50, 44, 16, 0, PI * 2, 80, -PI / 3], color: ROSA, ancho: 0.8, orden: 0 },
    { circ: [94, 50, 3], color: AZ, orden: 2 }, { circ: [28, 31, 3], color: VI, orden: 2 }, { circ: [28, 69, 3], color: ROSA, orden: 2 }] });

  D('interferencia', { desc: 'ondas de dos fuentes cruzandose', partes: [
    ...Array.from({ length: 8 }, (_, i) => ({ circ: [28, 50, 7 + i * 6.5, 90], color: AZ, ancho: 0.5, relleno: false, orden: 0 })),
    ...Array.from({ length: 8 }, (_, i) => ({ circ: [72, 50, 7 + i * 6.5, 90], color: VI, ancho: 0.5, relleno: false, orden: 1 })),
    { circ: [28, 50, 2.4], color: BLANCO, orden: 3 }, { circ: [72, 50, 2.4], color: BLANCO, orden: 3 }] });

  // ---------- orientacion ----------
  D('brujula', { desc: 'brujula', partes: [
    { circ: [50, 50, 44], color: '#9FB6E8', relleno: false, ancho: 1.2, orden: 0 },
    { circ: [50, 50, 38], color: '#6C8CFF', relleno: false, ancho: 0.5, orden: 0 },
    { gen: () => Array.from({ length: 16 }, (_, i) => { const a = i / 16 * PI * 2 - PI / 2, r0 = i % 4 === 0 ? 30 : 34, r1 = 38; return [[50 + Math.cos(a) * r0, 50 + Math.sin(a) * r0], [50 + Math.cos(a) * r1, 50 + Math.sin(a) * r1]]; }), color: '#9FB6E8', ancho: 0.6, orden: 0 },
    { d: 'M50 12 L58 50 L42 50 Z', color: '#FF6B6B', orden: 2 }, { d: 'M50 88 L58 50 L42 50 Z', color: '#9FB6E8', orden: 2 },
    { circ: [50, 50, 3], color: ORO, orden: 4 }] });

  D('brujula_base', { desc: 'brujula sin aguja', partes: [
    { circ: [50, 50, 44], color: '#9FB6E8', relleno: false, ancho: 1.2, orden: 0 },
    { circ: [50, 50, 38], color: '#6C8CFF', relleno: false, ancho: 0.5, orden: 0 },
    { gen: () => Array.from({ length: 16 }, (_, i) => { const a = i / 16 * PI * 2 - PI / 2, r0 = i % 4 === 0 ? 30 : 34, r1 = 38; return [[50 + Math.cos(a) * r0, 50 + Math.sin(a) * r0], [50 + Math.cos(a) * r1, 50 + Math.sin(a) * r1]]; }), color: '#9FB6E8', ancho: 0.6, orden: 0 }] });

  D('caminante', { desc: 'figura caminando', partes: [
    { circ: [52, 14, 7], color: PIEL, orden: 1 },
    { d: 'M52 23 L49 54', color: '#9CB4FF', ancho: 1.3, relleno: false, orden: 0 },
    { d: 'M51 30 L38 44 L33 58 M51 30 L64 38 L72 48', color: '#9CB4FF', ancho: 1.1, relleno: false, orden: 0 },
    { d: 'M49 54 L37 74 L29 94 M49 54 L61 72 L72 90', color: '#9CB4FF', ancho: 1.2, relleno: false, orden: 0 }] });

  D('cumbre', { desc: 'monte con estrella en la cima', partes: [
    { d: 'M6 94 L38 44 L52 64 L68 24 L96 94 Z', color: '#8FA3C7', orden: 0 },
    { d: 'M60 38 L68 24 L76 40 L71 37 L68 43 L65 37 Z', color: BLANCO, orden: 1 },
    { gen: () => { const o = []; for (let i = 0; i <= 10; i++) { const r = i % 2 ? 4 : 10, a = i / 10 * PI * 2 - PI / 2; o.push([68 + Math.cos(a) * r, 12 + Math.sin(a) * r]); } return [{ pts: o, cerrada: true }]; }, color: '#FFE08A', orden: 3 }] });

  // ---------- animales: siluetas con estrellas ----------
  const leon = () => { const o = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * PI * 2, r = 41 + 4.5 * Math.sin(a * 20); o.push([50 + Math.cos(a) * r, 52 + Math.sin(a) * r]); } return [{ pts: o, cerrada: true }]; };
  D('leon', { desc: 'leon de frente con melena', partes: [
    { gen: leon, color: '#FFB020', orden: 0 },
    { arco: [50, 56, 22, 26, 0, PI * 2, 60], color: '#FFD27A', orden: 1 },
    { d: 'M44 64 L56 64 L50 71 Z', color: '#FF9FB0', orden: 2 }, { d: 'M50 71 L50 75 M50 75 C46 80 41 79 39 75 M50 75 C54 80 59 79 61 75', color: '#FFD27A', ancho: 0.8, relleno: false, orden: 2 },
    { arco: [41, 50, 3.4, 1.8, 0, PI * 2, 24, 0.15], color: BLANCO, orden: 3 }, { arco: [59, 50, 3.4, 1.8, 0, PI * 2, 24, -0.15], color: BLANCO, orden: 3 },
    { arco: [30, 26, 6, 6, PI, PI * 2, 20], color: '#FFB020', relleno: false, orden: 1 }, { arco: [70, 26, 6, 6, PI, PI * 2, 20], color: '#FFB020', relleno: false, orden: 1 },
    ...nodos([[41, 50], [59, 50], [50, 64]], '#FFF0B0', 1.4)] });

  D('oso', { desc: 'oso de frente', partes: [
    { circ: [26, 26, 10], color: '#C08A5A', orden: 0 }, { circ: [74, 26, 10], color: '#C08A5A', orden: 0 },
    { circ: [26, 26, 4.5], color: '#E0B488', relleno: false, ancho: 0.7, orden: 1 }, { circ: [74, 26, 4.5], color: '#E0B488', relleno: false, ancho: 0.7, orden: 1 },
    { circ: [50, 54, 30], color: '#C08A5A', orden: 1 },
    { arco: [50, 66, 14, 11, 0, PI * 2, 40], color: '#E0B488', orden: 2 }, { arco: [50, 60, 5.5, 3.6, 0, PI * 2, 24], color: '#6A4A30', orden: 3 },
    { d: 'M50 64 L50 70 C46 75 41 73 40 69 M50 70 C54 75 59 73 60 69', color: '#E0B488', ancho: 0.8, relleno: false, orden: 3 },
    { circ: [38, 47, 2.6], color: BLANCO, orden: 3 }, { circ: [62, 47, 2.6], color: BLANCO, orden: 3 }, ...nodos([[38, 47], [62, 47], [50, 60]], '#FFE0B8', 1.3)] });

  D('lobo', { desc: 'lobo de frente', partes: [
    { d: 'M50 24 L42 26 L34 30 L28 6 L22 38 L16 58 L26 74 L38 88 L50 98', color: '#9FB6E8', espejo: true, abierta: true, orden: 0 },
    { d: 'M34 30 L36 16 L42 26 M66 30 L64 16 L58 26', color: '#CFE0FF', ancho: 0.7, relleno: false, orden: 1 },
    { d: 'M32 50 L44 54 M44 54 L46 49', color: '#FFE9A8', espejo: true, relleno: false, ancho: 1, orden: 2 },
    { d: 'M44 90 L56 90 L50 97 Z', color: '#E0E8FF', orden: 2 }, { d: 'M50 62 L50 90 M42 76 L36 82 M58 76 L64 82', color: '#CFE0FF', ancho: 0.7, relleno: false, orden: 1 },
    ...nodos([[32, 50], [68, 50], [50, 90], [28, 6], [72, 6]], '#FFF0B0', 1.4)] });

  D('zorro', { desc: 'zorro de frente', partes: [
    { d: 'M50 30 L38 32 L26 28 L16 2 L10 36 L6 52 L22 68 L38 84 L50 94', color: '#FF9A5A', espejo: true, abierta: true, orden: 0 },
    { d: 'M26 28 L22 12 L36 30 M74 28 L78 12 L64 30', color: '#FFC9A0', ancho: 0.7, relleno: false, orden: 1 },
    { d: 'M24 62 L34 70 L30 76 L40 78 L46 88 M76 62 L66 70 L70 76 L60 78 L54 88', color: BLANCO, ancho: 0.8, relleno: false, orden: 1 },
    { d: 'M30 48 L42 54 M70 48 L58 54', color: '#FFE9A8', ancho: 1, relleno: false, orden: 2 },
    { d: 'M45 86 L55 86 L50 93 Z', color: '#6A4A30', orden: 2 }, ...nodos([[30, 48], [70, 48], [50, 88], [16, 2], [84, 2]], '#FFF0B0', 1.4)] });

  D('ciervo', { desc: 'ciervo de frente con cornamenta', partes: [
    { d: 'M50 44 L40 46 L34 54 L38 72 L44 86 L50 94', color: '#D9A06A', espejo: true, abierta: true, orden: 0 },
    { d: 'M34 54 L16 46 L20 60 L34 60', color: '#D9A06A', espejo: true, orden: 1 },
    { d: 'M42 44 C36 30 33 18 31 4 M37 32 L26 28 M34 20 L22 14 M32 10 L26 2 M39 38 L30 40', color: '#F4E0B0', espejo: true, ancho: 1.1, relleno: false, orden: 2 },
    { circ: [41, 58, 2], color: BLANCO, espejo: true, orden: 3 }, { circ: [50, 90, 3], color: '#6A4A30', orden: 3 },
    ...nodos([[31, 4], [26, 28], [22, 14], [69, 4], [74, 28], [78, 14], [41, 58], [59, 58]], '#FFF0B0', 1.4)] });

  D('halcon', { desc: 'halcon planeando visto desde abajo', partes: [
    { d: 'M50 38 C40 30 24 28 4 36 L8 46 L14 42 L14 52 L22 48 L22 58 L32 52 L34 62 L42 54 L44 66', color: '#C8A878', espejo: true, abierta: true, orden: 0 },
    { d: 'M44 66 L42 90 L50 98 L58 90 L56 66', color: '#C8A878', orden: 1 },
    { circ: [50, 36, 6], color: '#E8D4B0', orden: 2 }, { d: 'M46.5 40 L50 49 L53.5 40', color: '#FFC84A', orden: 3 },
    { circ: [47, 34, 1.3], color: BLANCO, orden: 3 }, { circ: [53, 34, 1.3], color: BLANCO, orden: 3 },
    { d: 'M46 70 L46 88 M50 70 L50 92 M54 70 L54 88', color: '#E8D4B0', ancho: 0.5, relleno: false, orden: 2 },
    ...nodos([[4, 36], [96, 36], [50, 98]], '#FFF0B0', 1.5)] });

  D('serpiente', { desc: 'serpiente en S con cabeza', partes: [
    { gen: () => { const c = [], N = 90; for (let i = 0; i <= N; i++) { const t = i / N; c.push([50 + 24 * Math.sin(t * PI * 2.3 + 0.4) * (0.55 + 0.45 * t), 94 - t * 76]); }
        const izq = [], der = []; for (let i = 0; i <= N; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, t = i / N,
          w = (1.4 + Math.sin(Math.min(1, t * 1.6) * PI * 0.5) * 4.2) * (t > 0.92 ? 1 + (t - 0.92) * 5 : 1); izq.push([c[i][0] - dy / L * w, c[i][1] + dx / L * w]); der.push([c[i][0] + dy / L * w, c[i][1] - dx / L * w]); }
        const cab = []; for (let k = 0; k <= 12; k++) { const a = PI + k / 12 * PI; cab.push([c[N][0] + Math.cos(a) * 7, c[N][1] - 3 + Math.sin(a) * 9]); }
        return [{ pts: izq.concat(cab.reverse(), der.reverse()), cerrada: true }]; }, color: '#6EDC8A', orden: 0 },
    { circ: [66.6, 14.2, 1.3], color: '#FFE08A', orden: 3 },
    { d: 'M68.5 6.5 L68.5 1.5 M68.5 3 L65.5 0 M68.5 3 L71.5 0', color: '#FF8FA0', ancho: 0.7, relleno: false, orden: 3 }] });

  D('cocodrilo', { desc: 'cocodrilo de perfil', partes: [
    { d: 'M3 58 L14 52 L26 49 L33 45 L37 40 L41 45 L50 47 L56 41 L60 47 L66 39 L70 45 L76 37 L80 43 L86 36 L90 42 L98 34 L94 42 L88 49 L80 54 L72 58 L66 56 L58 58 L50 60 L44 60 L36 62 L26 63 L14 62 L3 60 Z', color: '#5BCB8A', orden: 0 },
    { d: 'M44 60 L46 72 L40 75 L36 72 L38 61 M70 57 L72 70 L66 74 L62 70 L64 58', color: '#5BCB8A', relleno: false, orden: 1 },
    { d: 'M3 58 L34 56', color: '#CFF5DD', ancho: 0.8, relleno: false, orden: 2 },
    { d: 'M8 58 L10 61 L12 57 L15 61 L18 57 L21 61 L24 57', color: BLANCO, ancho: 0.6, relleno: false, orden: 2 },
    { circ: [37, 44, 2.2], color: '#FFE08A', orden: 3 }, ...nodos([[3, 58], [37, 40], [98, 34], [46, 72], [66, 74]], '#FFF0B0', 1.4)] });
})(window.VE = window.VE || {});
