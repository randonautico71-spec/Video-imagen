/* FONDOS RICOS Y MUNDOS DE LUZ. Capas atmosfericas (aurora, astros con halo, nubes, bruma, estrellas fugaces, agua con
   reflejo, montanas, particulas que caen) y SEIS MUNDOS ya compuestos con ellas. Las capas son herramientas sueltas: un
   video puede usar un mundo entero o mezclar capas. 'a' (0..1) es el nivel de construccion: el mundo se va formando
   poco a poco (haces, trazos y elementos aparecen escalonados). Sin blur por fotograma: todo es sprite o trazo. */
(function (VE) {
  const M = VE.med, c01 = (v) => Math.max(0, Math.min(1, v)), lerp = (a, b, t) => a + (b - a) * t;
  const sub = (a, u, d = 0.5) => c01((a - u) / d);                                    // sub-tramo de 'a' que empieza en u y dura d

  /* elipse suave: un halo estirado a w x h (para bruma, nubes, reflejos). Debe llamarse bajo 'lighter' o con alfa baja. */
  function suave(esc, col, x, y, w, h, alfa, dur = 0.4) {
    const img = esc.cache.halo(256, col, dur); esc.ctx.globalAlpha = alfa; esc.ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  }
  const ruido1 = (semilla, n = 64) => { const r = VE.rng(semilla), v = Array.from({ length: n + 3 }, () => r());
    return (x) => { const i = Math.floor(x), f = x - i, a = v[((i % n) + n) % n], b = v[(((i + 1) % n) + n) % n], c = v[(((i + 2) % n) + n) % n], d = v[(((i + 3) % n) + n) % n];
      const t = f * f * (3 - 2 * f); return lerp(lerp(a, b, t), lerp(c, d, t), 0.0) * 0 + lerp(b, c, t) + (a - d) * 0; }; };

  // ---------- capas ----------
  M.aurora = function (esc, tg, o) {
    const x = esc.ctx, W = esc.W, k = esc.k, cols = o.colores || ['#3DFFA8', '#6C8CFF', '#B88CFF'], n = o.n || 3, paso = 11, S = Math.ceil(W / paso), I = o.intensidad == null ? 1 : o.intensidad;
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let r = 0; r < n; r++) {
      const col = cols[r % cols.length];
      const spr = esc.cache.obtener('aur|' + col, () => { const c = VE.atlas.lienzo(8 * esc.ss, 256 * esc.ss), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, c.height);
        gr.addColorStop(0, VE.color.a(col, 0)); gr.addColorStop(0.5, VE.color.a(col, 0.30)); gr.addColorStop(0.88, VE.color.a(col, 0.85)); gr.addColorStop(1, VE.color.a(col, 0.2)); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); return c; });
      for (let i = 0; i < S; i++) {
        const xx = i * paso, yb = o.y * k + Math.sin(xx * 0.0042 + tg * 0.17 + r * 2.1) * o.alto * k * 0.22 + r * o.alto * k * 0.10;
        const h = o.alto * k * (0.18 + 0.5 * (0.5 + 0.5 * Math.sin(xx * 0.0068 - tg * 0.26 + r * 1.3)) * (0.55 + 0.45 * Math.sin(xx * 0.015 + tg * 0.38 + r)));
        x.globalAlpha = 0.3 * I * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(xx * 0.003 + tg * 0.09 + r)));
        x.drawImage(spr, xx - 2, yb - h, paso + 4, h);
      }
    }
    x.restore();
  };

  /* astro: luna o sol con halo y contorno de luz. {x,y,r,tipo,color,prog} */
  M.astro = function (esc, tg, o) {
    const x = esc.ctx, k = esc.k, r = o.r * k, a = c01(o.prog == null ? 1 : o.prog), sol = o.tipo === 'sol', col = o.color || (sol ? '#FFC84A' : '#F4E9B8');
    x.save(); x.globalCompositeOperation = 'lighter';
    suave(esc, col, o.x, o.y, r * 11, r * 11, 0.20 * a, 0.3); suave(esc, col, o.x, o.y, r * 4.2, r * 4.2, 0.38 * a, 0.35); suave(esc, col, o.x, o.y, r * 2.2, r * 2.2, 0.38 * a * (0.85 + 0.15 * Math.sin(tg * 0.6)), 0.5);
    x.restore();
    VE.trazo.polilinea(esc, VE.trazo.arco(o.x, o.y, r, r, -Math.PI / 2, Math.PI * 1.5, 90), { color: col, progreso: E(a), grosor: 3, brillo: 1.1, cabeza: false });
    if (sol) { for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2 + tg * 0.05, r0 = r * 1.25, r1 = r * (i % 2 ? 1.6 : 2.0);
      VE.trazo.polilinea(esc, [[o.x + Math.cos(ang) * r0, o.y + Math.sin(ang) * r0], [o.x + Math.cos(ang) * r1, o.y + Math.sin(ang) * r1]], { color: '#FFB020', progreso: sub(a, 0.5 + i * 0.02, 0.4), grosor: 2.4, brillo: 0.9, cabeza: false }); } }
    else { [[-0.35, 0.2, 0.18], [0.3, 0.4, 0.12], [-0.1, -0.35, 0.1]].forEach(([dx, dy, rr], i) => VE.trazo.polilinea(esc, VE.trazo.arco(o.x + dx * r, o.y + dy * r, rr * r, rr * r, 0, Math.PI * 2, 30), { color: '#D9CC98', progreso: sub(a, 0.4 + i * 0.1, 0.4), grosor: 1.8, brillo: 0.6, cabeza: false })); }
  };
  const E = (v) => VE.ease.suave(c01(v));

  M.nubes = function (esc, tg, o) {
    const r = VE.rng(o.semilla || 'nubes'), W = esc.W, k = esc.k, x = esc.ctx, n = o.n || 4; x.save();
    if (o.aditivo !== false) x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const ancho = (360 + r() * 420) * k, vel = (5 + r() * 9) * k * (o.vel || 1), base = r() * (W + ancho * 2), cx = ((base + tg * vel) % (W + ancho * 2)) - ancho, cy = (o.y + (r() - 0.5) * (o.dy || 90)) * k;
      for (let j = 0; j < 5; j++) suave(esc, o.color || '#8FA6D8', cx + (j - 2) * ancho * 0.22, cy + Math.sin(j * 2.1 + i) * 14 * k, ancho * (0.5 + r() * 0.3), ancho * 0.2, (o.alfa == null ? 0.16 : o.alfa) * (0.7 + 0.3 * r()), 0.45);
    }
    x.restore();
  };
  M.bruma = function (esc, tg, o) {
    const x = esc.ctx, k = esc.k, W = esc.W; x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (o.n || 4); i++) suave(esc, o.color || '#9FB6E8', ((i + 0.5) / (o.n || 4)) * W + Math.sin(tg * 0.05 * (1 + i * 0.3) + i * 3) * 160 * k, (o.y + Math.sin(tg * 0.07 + i) * 12) * k, W * 0.7, (o.alto || 120) * k, (o.alfa == null ? 0.12 : o.alfa), 0.45);
    x.restore();
  };

  M.fugaces = function (esc, tg, o) {
    const cada = o.cada || 8, x = esc.ctx, k = esc.k, W = esc.W, H = esc.H;
    for (let q = Math.floor(tg / cada) - 1; q <= Math.floor(tg / cada); q++) {
      const r = VE.rng('fug' + q), t0 = q * cada + r() * cada * 0.7, dur = 1.0 + r() * 0.6, u = (tg - t0) / dur; if (u < 0 || u > 1) continue;
      const ang = Math.PI * (0.12 + r() * 0.16), L = (380 + r() * 380) * k, sx = r() * W * 0.8, sy = r() * H * 0.28, hx = sx + Math.cos(ang) * L * u, hy = sy + Math.sin(ang) * L * u, cola = Math.min(u, 0.35);
      VE.trazo.polilinea(esc, [[hx - Math.cos(ang) * L * cola, hy - Math.sin(ang) * L * cola], [hx, hy]], { color: '#EAF4FF', grosor: 2.4, brillo: 1.4 * (1 - u * 0.6), alfa: 1 - u * 0.5, cabeza: false });
    }
  };

  /* agua: base tenue + destellos horizontales con perspectiva + columna de reflejo (de un astro) */
  M.agua = function (esc, tg, o) {
    const x = esc.ctx, k = esc.k, W = esc.W, r = VE.rng(o.semilla || 'agua'), col = o.color || '#4DB8FF', alto = o.alto * k, y0 = o.y * k, a = o.alfa == null ? 1 : o.alfa;
    const g = x.createLinearGradient(0, y0, 0, y0 + alto); g.addColorStop(0, VE.color.a(col, 0.10 * a)); g.addColorStop(1, VE.color.a(col, 0.02 * a)); x.fillStyle = g; x.fillRect(0, y0, W, alto);
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; const cl = VE.color.luz(col);
    for (let j = 0; j < (o.n || 44); j++) {
      const u = j / (o.n || 44), yy = y0 + alto * Math.pow(u, 1.5), len = (50 + r() * 240) * (0.4 + u) * k, dir = r() < 0.5 ? 1 : -1, xx = ((r() * W + tg * (5 + u * 20) * dir * k) % (W + len)) - len / 2;
      x.globalAlpha = a * (0.05 + 0.20 * (1 - u * 0.5)) * (0.6 + 0.4 * Math.sin(tg * 0.8 + j)); x.strokeStyle = cl; x.lineWidth = (1 + u * 2.2) * k; x.beginPath(); x.moveTo(xx - len / 2, yy); x.lineTo(xx + len / 2, yy); x.stroke();
    }
    if (o.reflejoX != null) for (let j = 0; j < 26; j++) { const u = j / 26, yy = y0 + alto * Math.pow(u, 1.25), w = (24 + u * 170) * k * (0.7 + 0.3 * Math.sin(tg * 1.4 + j * 1.9));
      suave(esc, o.reflejoColor || '#F4E9B8', o.reflejoX + Math.sin(tg * 0.9 + j * 1.3) * (6 + u * 26) * k, yy, w, (5 + u * 5) * k, a * (0.34 - u * 0.2), 0.5); }
    x.restore();
  };

  M.montanas = function (esc, tg, o) {
    const x = esc.ctx, k = esc.k, W = esc.W, n = ruido1(o.semilla || 'mont', 96), N = 120, pts = [], f = o.frecuencia || 5.5, a = c01(o.prog == null ? 1 : o.prog);
    for (let i = 0; i <= N; i++) { const u = i / N, v = n(u * f) * 0.6 + n(u * f * 2.3 + 11) * 0.3 + n(u * f * 5.1 + 29) * 0.1, pico = Math.pow(v, 1.7);
      pts.push([u * W, o.y * k - o.alto * k * pico]); }
    if (o.sombra !== false) { x.save(); const g = x.createLinearGradient(0, o.y * k - o.alto * k, 0, o.y * k + 60 * k); g.addColorStop(0, 'rgba(2,4,14,0.0)'); g.addColorStop(1, 'rgba(2,4,14,0.55)'); x.fillStyle = g; x.globalAlpha = a;
      x.beginPath(); x.moveTo(0, esc.H); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(W, esc.H); x.closePath(); x.fill(); x.restore(); }
    VE.trazo.polilinea(esc, pts, { color: o.color || '#8FA3C7', progreso: E(a), grosor: o.grosor || 2.2, brillo: o.brillo == null ? 0.75 : o.brillo, cabeza: false });
  };

  /* caida: petalos / hojas / copos. {tipo, n, color, vel, semilla, alfa} */
  M.caida = function (esc, tg, o) {
    const r = VE.rng(o.semilla || 'caida'), x = esc.ctx, k = esc.k, W = esc.W, H = esc.H, tipo = o.tipo || 'petalos', cl = VE.color.luz(o.color || (tipo === 'hojas' ? '#E8A640' : tipo === 'copos' ? '#EAF4FF' : '#FF9FC8'));
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (o.n || 30); i++) {
      const x0 = r() * W, vel = (0.035 + r() * 0.05) * (o.vel || 1), ph = r(), amp = (30 + r() * 70) * k, u = (tg * vel + ph) % 1, yy = -40 + u * (H + 80), xx = x0 + Math.sin(tg * 0.5 + ph * 9) * amp + u * 40 * k;
      const ang = tg * (0.4 + r()) + ph * 6, tam = (7 + r() * 9) * k, al = Math.sin(Math.PI * u) ** 0.5 * (o.alfa == null ? 0.8 : o.alfa);
      if (tipo === 'copos') { x.globalAlpha = al; esc.pegar(esc.cache.halo(Math.round(tam * 1.6), cl, 0.4), xx, yy, 1); continue; }
      x.globalAlpha = al; x.strokeStyle = cl; x.lineWidth = 1.5 * k; x.beginPath(); x.ellipse(xx, yy, tam, tam * (tipo === 'hojas' ? 0.45 : 0.55), ang, 0, Math.PI * 2); x.stroke();
      x.globalAlpha = al * 0.25; x.lineWidth = 4 * k; x.stroke();
    }
    x.restore();
  };

  /* rios de luz: cintas onduladas que fluyen (para abstractos oniricos / oceano) */
  M.rios = function (esc, tg, o) {
    const k = esc.k, W = esc.W, n = o.n || 5, cols = o.colores || ['#6C8CFF', '#B88CFF', '#4DB8FF'];
    for (let j = 0; j < n; j++) { const pts = [], ph = j * 1.7, amp = (o.amp || 60) * k * (0.6 + 0.4 * Math.sin(j)), f = 0.0035 + j * 0.0007;
      for (let i = 0; i <= 90; i++) { const xx = i / 90 * W; pts.push([xx, (o.y + j * (o.sep || 34)) * k + Math.sin(xx * f + tg * (0.35 + j * 0.05) + ph) * amp + Math.sin(xx * f * 2.3 - tg * 0.2) * amp * 0.35]); }
      VE.trazo.polilinea(esc, pts, { color: cols[j % cols.length], progreso: o.prog == null ? 1 : sub(o.prog, j * 0.12, 0.6), grosor: 2, brillo: (o.brillo == null ? 0.7 : o.brillo) * (1 - j * 0.08), cabeza: false });
    }
  };

  /* flores: una hilera de figuras pequenas que brotan */
  M.flores = function (esc, tg, o) {
    const r = VE.rng(o.semilla || 'flores'), n = o.n || 12, W = o.ancho || esc.W;
    for (let i = 0; i < n; i++) { const u = (i + 0.3 + r() * 0.4) / n, p = sub(o.prog, u * 0.5, 0.5); if (p <= 0) continue;
      VE.trazo.dibujar(esc, o.figura || 'flor', { x: (o.x || 0) + u * W, y: o.y - (o.tam || 90) * esc.k * 0.5 * (0.7 + 0.5 * r()), tam: (o.tam || 90) * esc.k * (0.7 + 0.5 * r()), modo: 'luz', progreso: E(p), brillo: 0.8, rot: Math.sin(tg * 0.7 + i) * 0.06 }); }
  };

  // ---------- MUNDOS ----------
  const X = {};
  X.prado_nocturno = (esc, tg, a) => {
    const W = esc.W, H = esc.H;
    M.fondo(esc, tg, { modo: 'noche', estrellas: sub(a, 0, 0.5), niebla: 0.25 });
    M.nubes(esc, tg, { n: 3, y: H * 0.20, color: '#8FA6D8', alfa: 0.12 * a, semilla: 'pn' });
    M.astro(esc, tg, { x: W * 0.77, y: H * 0.19, r: 86, tipo: 'luna', prog: sub(a, 0.1, 0.4) });
    M.fugaces(esc, tg, { cada: 11 });
    M.montanas(esc, tg, { y: H * 0.56, alto: H * 0.16, color: '#6C8CFF', prog: sub(a, 0.15, 0.4), semilla: 'pn1', brillo: 0.6 });
    [['#7FA6E8', 0.64], ['#8FD0C8', 0.71]].forEach(([c, yy], i) => M.colina(esc, tg, { y: H * yy, amp: 38 - i * 8, color: c, capa: i + 1, prog: sub(a, 0.25 + i * 0.12, 0.4), brillo: 0.8 }));
    M.prado(esc, tg, { y: H * 0.86, ancho: W, n: 120, prog: sub(a, 0.4, 0.5), altura: 120 * esc.k, semilla: 'pn' });
    M.flores(esc, tg, { y: H * 0.88, n: 11, prog: sub(a, 0.6, 0.4), tam: 80, semilla: 'pnf' });
    M.bruma(esc, tg, { y: H * 0.80, alto: 150, color: '#9FB6E8', alfa: 0.10 * a });
    M.luciernagas(esc, tg, { n: 9, zona: { x: 0, y: H * 0.55, w: W, h: H * 0.35 }, alfa: sub(a, 0.6, 0.4) });
  };
  X.lago_luna = (esc, tg, a) => {
    const W = esc.W, H = esc.H, lx = W * 0.64;
    M.fondo(esc, tg, { modo: 'noche', estrellas: sub(a, 0, 0.4), niebla: 0.15 });
    M.astro(esc, tg, { x: lx, y: H * 0.19, r: 96, tipo: 'luna', prog: sub(a, 0.05, 0.4) });
    M.fugaces(esc, tg, { cada: 9 });
    M.montanas(esc, tg, { y: H * 0.54, alto: H * 0.20, color: '#6C8CFF', prog: sub(a, 0.15, 0.45), semilla: 'll1', brillo: 0.6 });
    M.montanas(esc, tg, { y: H * 0.60, alto: H * 0.11, color: '#7FA6E8', prog: sub(a, 0.3, 0.45), semilla: 'll2', frecuencia: 7.5, brillo: 0.75 });
    M.agua(esc, tg, { y: H * 0.605, alto: H * 0.30, color: '#4DB8FF', reflejoX: lx, alfa: sub(a, 0.35, 0.4) });
    for (let i = 0; i < 6; i++) VE.trazo.dibujar(esc, 'mata', { x: (i < 3 ? W * (0.05 + i * 0.05) : W * (0.82 + (i - 3) * 0.06)), y: H * 0.94, tam: 170 * esc.k * (0.8 + (i % 3) * 0.15), modo: 'luz', progreso: E(sub(a, 0.5 + i * 0.05, 0.4)), t: tg, brillo: 0.75, semilla: 'j' + i });
    M.bruma(esc, tg, { y: H * 0.60, alto: 110, color: '#9FB6E8', alfa: 0.12 * a });
    M.luciernagas(esc, tg, { n: 7, zona: { x: 0, y: H * 0.65, w: W, h: H * 0.3 }, alfa: sub(a, 0.6, 0.4), semilla: 'll' });
  };
  X.bosque_niebla = (esc, tg, a) => {
    const W = esc.W, H = esc.H;
    M.fondo(esc, tg, { modo: 'bosque', estrellas: 0, niebla: 0.45 });
    M.haces(esc, tg, { x0: -80, y0: -120, n: 6, largo: 1700, apertura: 0.7, angulo: Math.PI / 3.1, ancho: 150, color: '#BFFFE0', alfa: 0.26, aparece: sub(a, 0, 0.5), semilla: 'bn' });
    const capas = [{ y: 0.74, tam: 250, br: 0.42, n: 8, s: 'a', d: 0.1 }, { y: 0.86, tam: 400, br: 0.65, n: 5, s: 'b', d: 0.25 }, { y: 1.0, tam: 640, br: 0.9, n: 3, s: 'c', d: 0.4 }];
    capas.forEach((c, ci) => { const r = VE.rng('bn' + c.s); for (let i = 0; i < c.n; i++) { const u = (i + 0.2 + r() * 0.6) / c.n, fig = r() < 0.5 ? 'pino' : 'arbol';
      VE.trazo.dibujar(esc, fig, { x: u * W, y: H * c.y - c.tam * esc.k * 0.5, tam: c.tam * esc.k * (0.85 + r() * 0.3), modo: 'luz', progreso: E(sub(a, c.d + i * 0.03, 0.4)), t: tg, brillo: c.br, chispas: ci === 2 ? 6 : 0, semilla: 'b' + ci + i, grosor: 2.4 + ci * 0.6 }); } });
    [['helecho', 0.18, 200], ['seta', 0.45, 110], ['helecho', 0.78, 230], ['seta', 0.6, 90]].forEach(([f, ux, t], i) => VE.trazo.dibujar(esc, f, { x: W * ux, y: H * 0.96 - t * esc.k * 0.5, tam: t * esc.k, modo: 'luz', progreso: E(sub(a, 0.6 + i * 0.05, 0.3)), t: tg, brillo: 0.8, semilla: 'f' + i }));
    M.bruma(esc, tg, { y: H * 0.80, alto: 220, color: '#7FE0B8', alfa: 0.14 * a });
    M.motas(esc, tg, { n: 24, zona: { x: 0, y: 0, w: W, h: H }, color: '#8FFFC8', alfa: 0.6 * a, sube: 100, semilla: 'bnm' });
    M.luciernagas(esc, tg, { n: 11, zona: { x: 0, y: H * 0.3, w: W, h: H * 0.6 }, alfa: sub(a, 0.5, 0.4), semilla: 'bnl' });
  };
  X.aurora_boreal = (esc, tg, a) => {
    const W = esc.W, H = esc.H;
    M.fondo(esc, tg, { modo: 'aurora', estrellas: sub(a, 0, 0.4), niebla: 0 });
    M.aurora(esc, tg, { y: H * 0.55 / esc.k, alto: H * 0.50 / esc.k, n: 3, intensidad: sub(a, 0.1, 0.5) });
    M.fugaces(esc, tg, { cada: 7 });
    M.montanas(esc, tg, { y: H * 0.80, alto: H * 0.22, color: '#B8D8FF', prog: sub(a, 0.2, 0.5), semilla: 'ab', brillo: 0.8 });
    M.agua(esc, tg, { y: H * 0.80, alto: H * 0.20, color: '#3DFFA8', alfa: sub(a, 0.5, 0.4) * 0.8, n: 30 });
  };
  X.amanecer = (esc, tg, a) => {
    const W = esc.W, H = esc.H, sy = lerp(H * 0.80, H * 0.58, E(sub(a, 0, 0.7)));
    M.fondo(esc, tg, { modo: 'amanecer', estrellas: 0, niebla: 0.2 });
    esc.ctx.save(); esc.ctx.globalCompositeOperation = 'lighter'; suave(esc, '#FFB28A', W / 2, H * 0.74, W * 1.5, H * 0.7, 0.5 * a, 0.35); esc.ctx.restore();
    M.haces(esc, tg, { x0: W * 0.5, y0: sy, n: 7, largo: 1500, apertura: 1.6, angulo: -Math.PI / 2, ancho: 140, color: '#FFD9A8', alfa: 0.22, aparece: sub(a, 0.15, 0.5), semilla: 'am' });
    M.nubes(esc, tg, { n: 4, y: H * 0.28, color: '#FFB8C8', alfa: 0.22 * a, semilla: 'amn', vel: 0.8 });
    M.astro(esc, tg, { x: W * 0.5, y: sy, r: 80, tipo: 'sol', prog: sub(a, 0.05, 0.5) });
    [['#FFB28A', 0.70, 36], ['#FF9FB0', 0.77, 30], ['#C890D0', 0.84, 24]].forEach(([c, yy, amp], i) => M.colina(esc, tg, { y: H * yy, amp, color: c, capa: 10 + i, prog: sub(a, 0.3 + i * 0.1, 0.4), brillo: 0.9 }));
    [[0.2, 0.28, 0.0], [0.34, 0.2, 0.7], [0.72, 0.24, 1.4]].forEach(([ux, uy, ph], i) => VE.trazo.dibujar(esc, 'pajaro', { x: W * (ux + 0.02 * Math.sin(tg * 0.2 + ph)), y: H * (uy + 0.012 * Math.sin(tg * 0.5 + ph)), tam: 70 * esc.k, modo: 'luz', progreso: E(sub(a, 0.5 + i * 0.1, 0.3)), t: tg, brillo: 0.8, color: '#FFE9D0' }));
    M.caida(esc, tg, { tipo: 'petalos', n: 16, color: '#FFB8C8', alfa: 0.7 * a, vel: 0.7, semilla: 'amp' });
  };
  X.jardin_loto = (esc, tg, a) => {
    const W = esc.W, H = esc.H;
    M.fondo(esc, tg, { modo: 'onirico', estrellas: sub(a, 0, 0.4) * 0.6, niebla: 0.35 });
    M.haces(esc, tg, { x0: W * 0.5, y0: -140, n: 5, largo: 1300, apertura: 0.8, angulo: Math.PI / 2, ancho: 160, color: '#E0D0FF', alfa: 0.18, aparece: sub(a, 0, 0.5), semilla: 'jl' });
    VE.trazo.dibujar(esc, 'mandala', { x: W * 0.5, y: H * 0.38, tam: 560 * esc.k, modo: 'luz', progreso: E(sub(a, 0.05, 0.5)), rot: tg * 0.035, t: tg, brillo: 0.45, grosor: 2.2, escalonado: 0.2 });
    M.agua(esc, tg, { y: H * 0.66, alto: H * 0.30, color: '#8FB6FF', alfa: sub(a, 0.3, 0.4), n: 34, reflejoX: W * 0.5, reflejoColor: '#E0D0FF' });
    [[0.50, 300, 0.45], [0.30, 200, 0.58], [0.71, 220, 0.55], [0.15, 150, 0.7], [0.86, 160, 0.68]].forEach(([ux, t, d], i) => VE.trazo.dibujar(esc, 'loto', { x: W * ux, y: H * (0.70 + 0.04 * (i % 3)) - t * esc.k * 0.3, tam: t * esc.k, modo: 'luz', progreso: E(sub(a, d - 0.25, 0.45)), t: tg, chispas: i < 2 ? 14 : 5, semilla: 'lj' + i, pulso: { f: 0.14 + i * 0.01, a: 0.12 } }));
    M.caida(esc, tg, { tipo: 'petalos', n: 22, color: '#FFB3DA', alfa: 0.7 * a, vel: 0.5, semilla: 'jlp' });
    M.motas(esc, tg, { n: 20, zona: { x: 0, y: 0, w: W, h: H }, color: '#D8C8FF', alfa: 0.7 * a, sube: 110, semilla: 'jlm' });
  };
  X.oceano_estrellas = (esc, tg, a) => {
    const W = esc.W, H = esc.H, lx = W * 0.3;
    M.fondo(esc, tg, { modo: 'oceano', estrellas: sub(a, 0, 0.35), niebla: 0.1 });
    VE.trazo.dibujar(esc, 'constelacion', { x: W * 0.78, y: H * 0.22, tam: 330 * esc.k, modo: 'luz', progreso: E(sub(a, 0.15, 0.5)), t: tg, brillo: 0.9, chispas: 8, semilla: 'oc' });
    M.astro(esc, tg, { x: lx, y: H * 0.20, r: 70, tipo: 'luna', prog: sub(a, 0.05, 0.4) });
    M.fugaces(esc, tg, { cada: 8 });
    M.agua(esc, tg, { y: H * 0.50, alto: H * 0.46, color: '#4DB8FF', reflejoX: lx, alfa: sub(a, 0.2, 0.4), n: 70 });
    M.rios(esc, tg, { y: H * 0.56 / esc.k, n: 5, sep: 54, amp: 22, prog: sub(a, 0.3, 0.5), colores: ['#4DB8FF', '#6C8CFF', '#8FD6FF'], brillo: 0.6 });
    M.bruma(esc, tg, { y: H * 0.50, alto: 90, color: '#9FC8FF', alfa: 0.13 * a });
  };
  M.mundos = X; M.nombresMundos = Object.keys(X);
})(window.VE = window.VE || {});
