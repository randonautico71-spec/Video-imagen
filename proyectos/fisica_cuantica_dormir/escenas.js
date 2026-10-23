/* FISICA CUANTICA PARA DORMIR — 6 capitulos, 63 parrafos. Fondo oscuro; cada parrafo dibuja con luz suave lo que se dice AHORA.
   Sin subtitulos ni textos: solo ilustraciones que acompanan la explicacion. Elementos aparecen al pronunciar su palabra (en:'palabra'). */
const M = VE.med, T = VE.trazo, PI = Math.PI, c01 = (v) => Math.max(0, Math.min(1, v)), E = (v) => VE.ease.suave(c01(v)), lerp = (a, b, t) => a + (b - a) * t;
const ORO = '#FFC84A', AZ = '#6CC8FF', VI = '#B88CFF', RO = '#FF8FC0', VD = '#5BE07A', BL = '#EAF4FF', AM = '#FFB86B', GR = '#9FB6E8';
const PA = VE.paisaje;
const cresta = (semilla, y, alto, freq, color, brillo, tinte) => ({ semilla, y, alto, freq, exp: 1.6, color, brillo, tinte });
// punto de un dibujo (coordenadas locales 0..100) en fracciones de pantalla
const LOC = (esc, fig, ux, uy, tam, lx, ly) => { const p = T.mapear(fig, { x: ux * esc.W, y: uy * esc.H, tam }, [lx, ly]); return [p[0] / esc.W, p[1] / esc.H]; };

// ---------- fondos oscuros, uno por capitulo ----------
const lago = (esc, tg, a) => { const W = esc.W, H = esc.H, yh = .68;
  PA.cielo(esc, tg, { modo: 'noche', estrellas: .8 * c01(a * 2), niebla: .3, astro: { tipo: 'luna', x: W * .72, y: H * .22, r: 70, prog: c01(a * 1.5) }, fugaces: 0 });
  const capas = [cresta('fl1', .60, .22, 3.2, '#6C7CD8', .5, 'rgba(40,50,130,.4)'), cresta('fl2', .66, .12, 4.8, '#5C8CC8', .6, 'rgba(6,16,50,.85)')];
  PA.cordillera(esc, tg, { clave: 'fq', capas, a }); PA.reflejo(esc, tg, { clave: 'fq', yh, capas, a });
  M.agua(esc, tg, { y: H * yh, alto: H * (1 - yh), color: '#4D88D8', reflejoX: W * .72, reflejoColor: '#F4E9B8', alfa: c01(a * 1.6), n: 40 });
  M.bruma(esc, tg, { y: H * .68, alto: 140, color: '#9FA8E8', alfa: .10 * a }); };
const AMB = [
  (esc, t, ctx) => { PA.cosmos(esc, ctx.tg, c01(t / 12)); },
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'noche', estrellas: .6 * c01(t / 6), niebla: .3 }),
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'negro', estrellas: .7 * c01(t / 6), niebla: .35 }),
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'noche', estrellas: .5 * c01(t / 6), niebla: .45 }),
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'aurora', estrellas: .5 * c01(t / 6), niebla: .3 }),
  (esc, t, ctx) => lago(esc, ctx.tg, c01(t / 10)),
];

// ---------- piezas reutilizables ----------
const sube = (c, nombre, ux, uy, tam, en, o = {}) => c.fig(nombre, ux, uy, tam, Object.assign({ en, dur: 3 }, nombre === 'nube_prob' ? { brillo: .5, chispas: 0 } : {}, o));
const flecha = (c, a, b, en, col) => c.linea([a, b], col || '#9FB6E8', c.p(en, 2), { grosor: 2, brillo: .6 });
const orbita = (c, ux, uy, tam, r, vel, off, col, en) => { const R = tam * r / 100 / c.W; const a = c.tg * vel + off; c.glow(ux + Math.cos(a) * R, uy + Math.sin(a) * R * c.W / c.H, 34, col, { en }); };
const paquetes = (c, ux, uy, ancho, alto, n, col) => { for (let i = 0; i < n; i++) { const u = (c.tg * .12 + i / n) % 1; c.glow(ux - ancho / 2 + ((i * .37) % 1) * ancho, uy - alto / 2 + u * alto, 24, col, { en: 0.5, alfa: Math.sin(u * PI) }); } };

const A = [];
// ===== I. El universo entero (1-10) =====
A[0] = [
  (c) => { c.fig('meditando', .5, .56, 420, { dur: 4 }); c.anillos(.5, .56, { r0: 300, r1: 430, n: 3, en: 1 }); c.motas(); },
  (c) => { sube(c, 'cama', .5, .6, 560, 'cuerpo'); sube(c, 'respiro', .5, .3, 300, 'respira'); c.glow(.5, .6, 380, '#6C8CFF', { en: 'peso', alfa: .25 }); },
  (c) => { sube(c, 'atomo_niveles', .5, .5, 520, 'cuántica'); c.anillos(.5, .5, { r0: 330, r1: 430, n: 2, en: 'lejano' }); },
  (c) => { c.puntos([[.12, .5, 'universo', AZ], [.28, .5, 'ciencia', VI], [.44, .5, 'cuántica', ORO], [.6, .5, 'rarezas', RO], [.76, .5, 'vida', VD], [.9, .5, 'diaria', AM]].map(p => p), { r: 56 });
    c.linea([[.12, .5], [.9, .5]], '#9FB6E8', c.p('universo', 22), { brillo: .5 }); },
  (c) => { sube(c, 'galaxia', .5, .5, 620, 'universo', { dur: 5 }); c.anillos(.5, .5, { r0: 340, r1: 460, n: 3, en: 'trece' }); sube(c, 'respiro', .84, .78, 190, 'suspiro'); },
  (c) => { sube(c, 'galaxia', .18, .42, 320, 'galaxias'); sube(c, 'sol', .45, .42, 220, 'sol'); sube(c, 'tierra', .72, .42, 260, 'planeta'); flecha(c, [.26, .42], [.38, .42], 'sol'); flecha(c, [.5, .42], [.64, .42], 'planeta'); sube(c, 'cama', .5, .82, 240, 'cama'); },
  (c) => { sube(c, 'mano', .16, .5, 330, 'mano', { dur: 2.5 }); sube(c, 'celula', .5, .5, 400, 'célula'); c.anillos(.5, .5, { r0: 230, r1: 330, n: 3, en: 'cajas' }); sube(c, 'nucleo', .84, .5, 300, 'pequeñas'); flecha(c, [.24, .5], [.36, .5], 'piel'); flecha(c, [.64, .5], [.76, .5], 'cajas'); },
  (c) => { sube(c, 'cabello', .5, .36, 760, 'cabello', { dur: 4 }); sube(c, 'atomo', .5, .74, 300, 'átomos'); },
  (c) => { sube(c, 'galaxia', .22, .5, 400, 'galaxias'); sube(c, 'atomo', .78, .5, 330, 'átomos'); c.linea(c.curva([.3, .5], [.5, .28], [.7, .5]), '#FFE9A8', c.p('universo', 4), { brillo: .6 }); c.glow(.5, .36, 80, '#FFE9A8', { en: 'historia' }); },
  (c) => { sube(c, 'respiro', .5, .5, 520, 0.5, { dur: 4 }); c.ondas(.5, .5, { en: 1, r0: 80, r1: 420, color: '#BFE8FF', vel: .1 }); },
];
// ===== II. La ciencia, la teoria y la fisica clasica (11-21) =====
A[1] = [
  (c) => { sube(c, 'lupa', .5, .5, 460, 'ciencia'); sube(c, 'destello', .43, .45, 100, 'preguntas', { chispas: 0 }); c.glow(.5, .5, 300, AZ, { en: 'respuestas', alfa: .2 }); },
  (c) => { sube(c, 'manzana', .15, .45, 220, 'manzana'); sube(c, 'sol', .38, .45, 200, 'sol'); sube(c, 'foton', .62, .45, 240, 'luz'); sube(c, 'matraz', .86, .45, 220, 'experimento'); },
  (c) => { sube(c, 'mapa', .5, .5, 600, 'mapa', { dur: 4 }); c.glow(.5, .5, 340, ORO, { en: 'corrige', alfa: .18 }); },
  (c) => { sube(c, 'lupa', .5, .45, 400, 'teoría'); [[.3, .78], [.5, .82], [.7, .78]].forEach((p, i) => c.glow(p[0], p[1], 70, VD, { en: 'muchas', dur: 1 + i, alfa: .9 })); },
  (c) => { sube(c, 'tierra', .2, .5, 300, .6); sube(c, 'gota', .5, .5, 260, 'agua'); sube(c, 'sol', .8, .5, 260, 'luz'); },
  (c) => { sube(c, 'plano', .5, .5, 520, 'modelo', { dur: 4 }); },
  (c) => { sube(c, 'pelota', .2, .5, 240, 'pelota'); sube(c, 'ola', .5, .5, 300, 'barco'); sube(c, 'pendulo', .8, .5, 300, 'péndulo'); c.glow(.8, .5, 90, ORO, { en: 'péndulo' }); },
  (c) => { sube(c, 'relojeria', .5, .5, 600, 'relojería', { dur: 4, rot: Math.sin(c.tg * .3) * .03 }); c.glow(.5, .5, 380, AM, { en: 'piezas', alfa: .15 }); },
  (c) => { sube(c, 'relojeria', .24, .5, 360, 'máquina', { alfa: .5 }); sube(c, 'atomo_niveles', .72, .5, 380, 'dejó'); flecha(c, [.4, .5], [.54, .5], 'dejó'); },
  (c) => { sube(c, 'mapa', .36, .5, 440, 'mapa'); sube(c, 'nube_prob', .74, .5, 360, 'territorio'); c.motas({ n: 20, color: '#CFE3FF' }); },
  (c) => { sube(c, 'arbol', .5, .52, 560, 'rama', { dur: 4 }); c.glow(.5, .3, 260, VD, { en: 'rama', alfa: .2 }); sube(c, 'respiro', .84, .8, 190, 'Respira'); },
];
// ===== III. Que es la fisica cuantica (22-34) =====
A[2] = [
  (c) => { sube(c, 'atomo_niveles', .3, .5, 400, .8); sube(c, 'foton', .72, .5, 400, 'luz'); sube(c, 'nucleo', .5, .8, 160, 'partículas'); },
  (c) => { sube(c, 'nube', .16, .38, 300, 'aire'); sube(c, 'meditando', .5, .55, 340, 'cuerpo'); sube(c, 'estrella', .84, .38, 240, 'estrellas'); },
  (c) => { sube(c, 'escalera', .5, .5, 560, 'escalera', { dur: 4 }); const y = 0.5 + (0.88 - 0.5) * 0.5; c.glow(.5, y, 120, ORO, { en: 'peldaño', alfa: .35 }); },
  (c) => { sube(c, 'nucleo', .5, .52, 640, 'núcleo', { dur: 3.5 }); orbita(c, .5, .52, 640, 40, .5, 0, AZ, 'electrones'); orbita(c, .5, .52, 640, 40, .5, 3.2, VI, 'electrones'); c.glow(.5, .52, 40, ORO, { en: 'núcleo' }); },
  (c, esc) => { esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; const p = M.espaciotiempo(esc, c.tg, { cx: esc.W * .5, cy: esc.H * .5, w: 1300, h: 600, masa: c01(c.tp / 5), prog: c.p('relatividad', 4) }); esc.ctx.restore(); c.glow(p.x / esc.W, p.y / esc.H, 100, '#FFE9A8', { en: 'gravedad' }); },
  (c) => { sube(c, 'atomo_niveles', .5, .5, 520, 'cuanto'); c.ondas(.5, .5, { en: 'cantidad', r0: 60, r1: 400, color: '#CFE3FF', vel: .08 }); },
  (c) => { sube(c, 'rampa', .26, .5, 440, 'rampa', { dur: 3.5 }); sube(c, 'escalera', .74, .5, 440, 'escalera', { dur: 3.5 });
    const u = c01((c.tp - 3) / 6); c.glow(.26 - .18 + u * .36, .5 + .22 - u * .3, 36, ORO, { en: 'rampa', dur: 3 });
    const k = Math.floor(c01((c.tp - 12) / 10) * 3.99), px = [.65, .72, .79, .86][k], py = [.62, .55, .48, .41][k]; c.glow(px, py - .04, 36, ORO, { en: 'solo', dur: 12 }); },
  (c) => { sube(c, 'lluvia_luz', .5, .5, 580, 'paquetes', { dur: 4 }); sube(c, 'estrella', .5, .86, 150, 'cuantos'); paquetes(c, .5, .5, .4, .5, 10, AM); },
  (c) => { sube(c, 'lampara', .22, .5, 340, .6); sube(c, 'lluvia_luz', .5, .5, 340, 'lluvia'); sube(c, 'ojo', .8, .5, 320, 'ojos'); },
  (c) => { const R = [16, 28, 42], k = Math.floor((c.tp / 5) % 3), r0 = R[k], a = c.tg * 1.2; sube(c, 'atomo_niveles', .5, .5, 600, 'electrones', { dur: 4 });
    const q = 600 * lerp(R[k], R[(k + 1) % 3], c01(((c.tp / 5) % 1) * 6 - 4)) / 100 / c.W; c.glow(.5 + Math.cos(a) * q, .5 + Math.sin(a) * q * c.W / c.H, 36, BL, { en: 'saltar' });
    c.ondas(.5, .5, { en: 'luz', r0: 40, r1: 360, color: AM, vel: .06, alfa: .6 }); },
  (c) => { sube(c, 'escalera', .5, .5, 560, 'escalón', { dur: 3.5 }); c.puntos([[.2, .8, 'mitades', GR], [.8, .8, 'ordenada', GR]], { r: 50 }); },
  (c) => { sube(c, 'taza', .3, .5, 340, 'taza'); sube(c, 'silla', .7, .5, 340, 'silla'); c.motas({ n: 40, color: '#9FD8FF', alfa: .5, sube: 30 }); },
  (c) => { sube(c, 'escalera', .3, .5, 400, 'paquetes'); sube(c, 'atomo_niveles', .72, .5, 400, 'diferente'); c.anillos(.5, .5, { r0: 330, r1: 430, n: 2, en: 'Respira' }); },
];
// ===== IV. Rarezas suaves (35-43) =====
A[3] = [
  (c) => { sube(c, 'pelota', .27, .5, 340, .6); sube(c, 'onda', .73, .5, 420, 'ola'); c.glow(.5, .5, 160, VI, { en: 'pregunta', alfa: .25 }); },
  (c) => { sube(c, 'piedra_ola', .5, .5, 680, 'piedra', { dur: 4 }); },
  (c, esc) => { const W = esc.W, H = esc.H; c.linea([[.38, .12], [.38, .42]], GR, c.p(.5, 2), { grosor: 3 }); c.linea([[.38, .58], [.38, .88]], GR, c.p(.5, 2), { grosor: 3 }); c.glow(.38, .5, 50, BL, { en: 'electrones' });
    esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; M.electrones(esc, c.tg, { x0: W * .6, x1: W * .92, y0: H * .28, y1: H * .72, n: c01((c.tp - 8) / (c.dp - 16)), emisor: [W * .1, H * .5] }); esc.ctx.restore(); c.glow(.1, .5, 70, AZ, { en: 'electrones' }); },
  (c) => { sube(c, 'onda', .34, .5, 460, 'ola'); sube(c, 'nube_prob', .74, .5, 380, 'punto'); c.glow(.74, .5, 40, ORO, { en: 'pantalla' }); },
  (c) => { sube(c, 'pelota', .2, .5, 240, 'pelota'); c.linea(c.curva([.26, .5], [.34, .22], [.42, .64]), AM, c.p('lanzas', 3)); sube(c, 'nube_prob', .72, .5, 520, 'nube', { dur: 4 }); },
  (c) => { sube(c, 'nube_prob', .5, .5, 740, 'nube', { dur: 4 }); c.glow(.5, .5, 300, AZ, { en: 'niebla', alfa: .2 }); c.motas({ n: 26, color: '#9FD8FF', alfa: .5, sube: 20 }); },
  (c) => { const u = Math.abs(Math.cos(c.tg * 1.1)), v = Math.abs(Math.sin(c.tg * 1.1)); sube(c, 'moneda', .5, .45, 420, 'moneda', { alfa: v }); sube(c, 'moneda_cara', .5, .45, 420, 'moneda', { alfa: u * .9 }); c.linea([[.3, .86], [.7, .86]], GR, c.p('mesa', 2)); },
  (c) => { sube(c, 'nube_prob', .27, .5, 380, 'posición'); sube(c, 'onda', .73, .5, 420, 'velocidad'); const s = .5 + .5 * Math.sin(c.tg * .5); c.glow(.5, .5, 70 + 30 * s, VI, { en: 'incertidumbre', alfa: .6 }); flecha(c, [.4, .5], [.6, .5], 'perfecta'); },
  (c) => { sube(c, 'matraz', .3, .5, 340, 3); sube(c, 'lupa', .7, .5, 340, 'precisa'); c.anillos(.5, .5, { r0: 330, r1: 430, n: 2, en: 'magia', ciclo: [5, 1, 6] }); },
];
// ===== V. En la vida de cada dia (44-56) =====
A[4] = [
  (c) => { sube(c, 'meditando', .5, .56, 400, .8); c.motas({ n: 30, color: '#9FD8FF', alfa: .5, sube: 30 }); c.anillos(.5, .56, { r0: 300, r1: 420, n: 3, en: 'silenciosas' }); },
  (c) => { [['laser', .12, 'láseres', '#FF8F8F'], ['led', .31, 'led', VD], ['placa_solar', .5, 'placas', AZ], ['movil', .69, 'móviles', VI], ['resonancia', .88, 'resonancia', RO]].forEach(([n, x, w]) => sube(c, n, x, .5, 280, w, { dur: 2.5 })); },
  (c) => { sube(c, 'plano', .27, .5, 420, .8); sube(c, 'laser', .72, .5, 480, 'luz'); flecha(c, [.4, .5], [.55, .5], 'Después'); },
  (c) => { sube(c, 'chip', .3, .5, 400, 'chips'); sube(c, 'transistor', .72, .5, 420, 'transistores'); c.motas({ n: 36, color: '#6CC8FF', alfa: .55, sube: 10 }); },
  (c) => { sube(c, 'reloj_atomico', .5, .5, 560, 'tiempo', { dur: 4 }); const tick = (c.tp % 1) < .15 ? 1 : .3; c.glow(.5, .12, 22, ORO, { en: 'segundo', alfa: tick }); },
  (c) => { sube(c, 'sol', .26, .46, 430, 'Sol'); sube(c, 'tunel', .68, .5, 460, 'túnel'); const u = c01((c.tp - 12) / 12); const p = LOC(c.esc, 'tunel', .68, .5, 460, lerp(14, 86, u), 78); c.glow(p[0], p[1], 30, ORO, { en: 'túnel' }); },
  (c) => { sube(c, 'tunel', .5, .54, 640, 'montaña', { dur: 4 }); const u = (c.tp * .08) % 1; const p = LOC(c.esc, 'tunel', .5, .54, 640, lerp(14, 86, u), 78); c.glow(p[0], p[1], 36, ORO, { en: 'túnel', alfa: Math.sin(u * PI) }); },
  (c) => { sube(c, 'estrella', .26, .42, 300, 'estrellas'); sube(c, 'meditando', .74, .56, 340, 'cuerpo'); c.linea(c.curva([.34, .46], [.5, .3], [.66, .5]), '#FFE9A8', c.p('formaron', 4), { brillo: .6 }); c.motas({ n: 20, color: '#FFE9A8', alfa: .5 }); },
  (c) => { sube(c, 'galaxia', .15, .5, 270, 'galaxias'); sube(c, 'movil', .38, .5, 260, 'teléfono'); sube(c, 'resonancia', .62, .5, 270, 'hospitales'); sube(c, 'reloj_atomico', .86, .5, 260, 'reloj'); },
  (c) => { sube(c, 'entrelazadas', .5, .5, 740, 'entrelazamiento', { dur: 4 }); c.glow(.5, .5, 120, RO, { en: 'conectadas', alfa: .25 }); },
  (c) => { sube(c, 'entrelazadas', .5, .38, 560, 'dos'); sube(c, 'arbol_estrella', .5, .76, 190, 'Nobel'); c.puntos([[.3, .8, 'Aspect', GR], [.7, .8, 'Zeilinger', GR], [.5, .86, 'Clauser', GR]], { r: 44 }); },
  (c) => { sube(c, 'entrelazadas', .5, .5, 680, 'sutil', { dur: 4 }); c.red(.5, .5, 900, 380, { en: 'conectada', n: 22, semilla: 'ent' }); },
  (c) => { sube(c, 'lupa', .5, .5, 440, 'preguntas'); c.motas({ n: 28, color: '#CFE3FF', alfa: .5 }); c.glow(.5, .5, 300, GR, { en: 'paciencia', alfa: .16 }); },
];
// ===== VI. Descanso (57-63) =====
A[5] = [
  (c) => { sube(c, 'meditando', .5, .48, 400, 'cuerpo'); sube(c, 'nube_prob', .5, .45, 600, 'átomos', { alfa: .5, dur: 4 }); },
  (c) => { const s = .5 + .5 * Math.sin(c.tp * .7); c.glow(.5, .5, 120 + 130 * s, '#BFE8FF', { en: 'respiración', dureza: .3, alfa: .6 }); sube(c, 'respiro', .5, .5, 340, 'paquete'); },
  (c) => { sube(c, 'constelacion', .5, .2, 360, 'estrellas'); sube(c, 'meditando', .5, .5, 230, 'estás'); sube(c, 'atomo_niveles', .5, .72, 200, 'átomos'); },
  (c) => { sube(c, 'galaxia', .5, .46, 520, 'universo', { dur: 5, alfa: .8 }); c.motas({ n: 20, color: '#CFE3FF', alfa: .4 }); },
  (c) => { c.ondas(.5, .84, { en: 'lago', r0: 30, r1: 360, vel: .06, color: '#CFE3FF', alfa: .5 }); c.glow(.72, .22, 160, '#F4E9B8', { en: 'luna', alfa: .3 }); },
  (c) => { sube(c, 'meditando', .5, .5, 360, 'cuerpo'); sube(c, 'nube_prob', .5, .47, 540, 'átomos', { alfa: .45, dur: 4 }); c.motas({ n: 20, color: '#9FD8FF', alfa: .4 }); },
  (c) => { const s = .5 + .5 * Math.sin(c.tp * .5); c.anillos(.5, .5, { r0: 150, r1: 330, n: 3, en: .5, ciclo: [5, 2, 6] }); c.glow(.5, .5, 160 + 80 * s, '#BFE8FF', { en: 'Respira', alfa: .45 }); },
];

VE.proyecto({
  estilo: M.estilo('negro'), progreso: false, subtitulos: false, lint: { negro: true }, transicion: { entrada: 1.8, salida: 1.8 },
  capitulos: A.map((pars, i) => ({ parrafos: pars.length, nombre: 'cap' + (i + 1), dibujar: (esc, t, ctx) => { AMB[i](esc, t, ctx); const c = VE.comp(esc, ctx); pars[ctx.parrafo](c, esc, ctx); } })),
});
