/* PAISAJES DE LUZ CON PROFUNDIDAD. Cada capa (cordillera, colinas, bosque, orilla...) se hornea UNA vez en dos imagenes:
   'sombra' (silueta oscura que da cuerpo y tapa lo de atras) y 'luz' (el contorno luminoso con el color real), y se pega por fotograma
   con un desplazamiento de paralaje y un fundido de entrada escalonado de lejos a cerca. Lo que se mueve (estrellas, bruma, nubes,
   hierba, luciernagas, reflejos, rayos) se dibuja encima, dinamico y barato. Perspectiva atmosferica: lo lejano es mas azul y tenue. */
(function (VE) {
  const M = VE.med, T = VE.trazo, PI = Math.PI, c01 = (v) => Math.max(0, Math.min(1, v)), E = (v) => VE.ease.suave(c01(v)), lerp = (a, b, t) => a + (b - a) * t;
  const P = {};

  const ruido = (semilla) => { const r = VE.rng(semilla), v = Array.from({ length: 256 }, () => r());
    return (x) => { const i = Math.floor(x), f = x - i, a = v[((i % 256) + 256) % 256], b = v[(((i + 1) % 256) + 256) % 256], t = f * f * (3 - 2 * f); return a + (b - a) * t; }; };

  /* Hornea dos capas (sombra, luz) de un tamano ligeramente mayor que la pantalla para poder hacer paralaje. */
  P.hornear = function (esc, clave, fnSombra, fnLuz, ancho = 1.14) {
    return esc.cache.obtener('hor|' + clave + '|' + esc.W + '|' + esc.H + '|' + esc.ss, () => {
      const w = esc.W * ancho, off = (w - esc.W) / 2, mk = (fn) => { if (!fn) return null; const c = VE.atlas.lienzo(w * esc.ss, esc.H * esc.ss), cx = c.getContext('2d'); cx.scale(esc.ss, esc.ss); cx.translate(off, 0);
        const prev = esc.ctx; esc.ctx = cx; try { fn(w, off); } finally { esc.ctx = prev; } return c; };
      return { sombra: mk(fnSombra), luz: mk(fnLuz), w, off };
    });
  };
  P.pegar = function (esc, h, dx, alfa) {
    const x = esc.ctx; if (alfa <= 0) return; x.save(); x.globalAlpha *= alfa;
    if (h.sombra) x.drawImage(h.sombra, -h.off + dx, 0, h.w, esc.H);
    if (h.luz) { x.globalCompositeOperation = 'lighter'; x.drawImage(h.luz, -h.off + dx, 0, h.w, esc.H); } x.restore();
  };

  // ---------- cielo ----------
  /* {modo, estrellas, niebla, nubes, astro:{tipo,x,y,r}, aurora:{...}, mezcla} */
  P.cielo = function (esc, tg, o) {
    M.fondo(esc, tg, { modo: o.modo || 'noche', a: o.a, mezcla: o.mezcla, estrellas: o.estrellas == null ? 0.8 : o.estrellas, niebla: o.niebla == null ? 0.2 : o.niebla });
    if (o.aurora) M.aurora(esc, tg, Object.assign({ y: esc.H * 0.42 / esc.k, alto: esc.H * 0.5 / esc.k, n: 3 }, o.aurora));
    if (o.nubes) M.nubes(esc, tg, Object.assign({ n: 4, y: esc.H * 0.2, color: '#8FA6D8', alfa: 0.12, semilla: 'cielo' }, o.nubes));
    if (o.astro) M.astro(esc, tg, Object.assign({ prog: 1 }, o.astro));
    if (o.fugaces) M.fugaces(esc, tg, { cada: o.fugaces });
  };

  // ---------- cordilleras en capas ----------
  /* capas: [{semilla, y, alto, freq, exp, color, brillo, sombra:[a0,a1], tinte, nieve}] (y/alto en fraccion de H). a: 0..1 construccion. deriva: paralaje (px). */
  P.cordillera = function (esc, tg, o) {
    const W = esc.W, H = esc.H, k = esc.k, capas = o.capas;
    const puntos = (c, w, off) => { const n = ruido(c.semilla), N = Math.round(w / 7), f = c.freq || 4, pts = [];
      for (let i = 0; i <= N; i++) { const u = i / N, x = -off + u * w, v = n(u * f) * 0.56 + n(u * f * 2.7 + 13) * 0.3 + n(u * f * 6.3 + 29) * 0.14; pts.push([x, c.y * H - c.alto * H * Math.pow(v, c.exp || 1.7), v]); } return pts; };
    capas.forEach((c, i) => {
      const h = P.hornear(esc, 'cord|' + o.clave + '|' + i,
        (w, off) => { const x = esc.ctx, pts = puntos(c, w, off), top = Math.min(...pts.map(p => p[1])), g = x.createLinearGradient(0, top, 0, H);
          g.addColorStop(0, c.tinte || 'rgba(20,30,70,0.4)'); g.addColorStop(1, c.tinteAbajo || 'rgba(2,4,14,0.92)'); x.fillStyle = g; x.beginPath(); x.moveTo(pts[0][0], H); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(pts[pts.length - 1][0], H); x.closePath(); x.fill(); },
        (w, off) => { const pts = puntos(c, w, off); T.polilinea(esc, pts.map(p => [p[0], p[1]]), { color: c.color, progreso: 1, grosor: c.grosor || 2, brillo: c.brillo == null ? 0.7 : c.brillo, cabeza: false });
          if (c.nieve) pts.forEach((p, j) => { if (j > 3 && j < pts.length - 3 && p[2] > c.nieve && p[1] <= pts[j - 2][1] && p[1] <= pts[j + 2][1] && j % 3 === 0) { const s2 = (10 + (p[2] - c.nieve) * 70) * k;
            T.polilinea(esc, [[p[0] - s2, p[1] + s2 * 0.9], [p[0] - s2 * 0.4, p[1] + s2 * 0.45], [p[0], p[1] + s2 * 1.0], [p[0] + s2 * 0.45, p[1] + s2 * 0.4], [p[0] + s2, p[1] + s2 * 0.95]], { color: '#EAF4FF', progreso: 1, grosor: 1.6, brillo: 0.9, cabeza: false }); } }); });
      P.pegar(esc, h, (o.deriva == null ? 14 : o.deriva) * (i + 1) / capas.length * Math.sin(tg * 0.03), E((o.a == null ? 1 : o.a) * 1.8 - i * 0.28));
    });
  };

  /* Reflejo de una cordillera sobre el agua: las mismas crestas volteadas respecto al horizonte yh. */
  P.reflejo = function (esc, tg, o) {
    const H = esc.H, yh = o.yh * H, capas = o.capas;
    const puntos = (c, w, off) => { const n = ruido(c.semilla), N = Math.round(w / 9), f = c.freq || 4, pts = []; for (let i = 0; i <= N; i++) { const u = i / N, x = -off + u * w, v = n(u * f) * 0.56 + n(u * f * 2.7 + 13) * 0.3 + n(u * f * 6.3 + 29) * 0.14; pts.push([x, 2 * yh - (c.y * H - c.alto * H * Math.pow(v, c.exp || 1.7))]); } return pts; };
    const h = P.hornear(esc, 'refl|' + o.clave, null, (w, off) => { capas.forEach((c) => T.polilinea(esc, puntos(c, w, off), { color: c.color, progreso: 1, grosor: 1.8, brillo: (c.brillo == null ? 0.7 : c.brillo) * 0.42, cabeza: false })); });
    const a = E((o.a == null ? 1 : o.a) * 1.6 - 0.3); const x = esc.ctx; x.save(); x.beginPath(); x.rect(0, yh, esc.W, H - yh); x.clip();
    for (let s = 0; s < 4; s++) P.pegar(esc, { luz: h.luz, sombra: null, w: h.w, off: h.off }, Math.sin(tg * 0.7 + s * 1.9) * 5 * (s + 1), a * 0.3); x.restore();
  };

  // ---------- colinas suaves (praderas, caminos) ----------
  P.colinas = function (esc, tg, o) {
    const W = esc.W, H = esc.H, capas = o.capas;
    const puntos = (c, w, off) => { const n = ruido(c.semilla), N = Math.round(w / 8), pts = []; for (let i = 0; i <= N; i++) { const u = i / N, x = -off + u * w; pts.push([x, c.y * H - c.amp * H * (n(u * (c.freq || 2.4)) * 0.7 + n(u * (c.freq || 2.4) * 3.1 + 7) * 0.3 - 0.5)]); } return pts; };
    capas.forEach((c, i) => {
      const h = P.hornear(esc, 'col|' + o.clave + '|' + i,
        (w, off) => { const x = esc.ctx, pts = puntos(c, w, off), g = x.createLinearGradient(0, c.y * H - c.amp * H, 0, H); g.addColorStop(0, c.tinte || 'rgba(10,20,40,0.5)'); g.addColorStop(1, c.tinteAbajo || 'rgba(2,6,14,0.95)'); x.fillStyle = g; x.beginPath(); x.moveTo(pts[0][0], H); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(pts[pts.length - 1][0], H); x.closePath(); x.fill(); },
        (w, off) => { T.polilinea(esc, puntos(c, w, off), { color: c.color, progreso: 1, grosor: c.grosor || 2.2, brillo: c.brillo == null ? 0.8 : c.brillo, cabeza: false }); });
      P.pegar(esc, h, (o.deriva == null ? 10 : o.deriva) * (i + 1) / capas.length * Math.sin(tg * 0.03), E((o.a == null ? 1 : o.a) * 1.8 - i * 0.28));
    });
  };

  // ---------- bosque por planos ----------
  /* capas: [{y (base, fraccion H), tam, n, brillo, color, figuras:['pino','arbol'], semilla, solido}] de lejos a cerca */
  P.bosque = function (esc, tg, o) {
    const W = esc.W, H = esc.H, k = esc.k;
    const hs = o.capas.map((c, ci) => P.hornear(esc, 'bos|' + o.clave + '|' + ci,
      (w, off) => { const r = VE.rng(c.semilla); for (let i = 0; i < c.n; i++) { const u = (i + 0.15 + r() * 0.7) / c.n, x = -off + u * w, t = c.tam * (0.8 + r() * 0.5), f = c.figuras[Math.floor(r() * c.figuras.length)]; if (c.bordes && u > 0.3 && u < 0.7) continue;
          T.dibujar(esc, f, { x, y: c.y * H - t * 0.5, tam: t, modo: 'solido', color: c.sombra || '#04140F', progreso: 1, grosor: 1.2 }); } },
      (w, off) => { const r = VE.rng(c.semilla); for (let i = 0; i < c.n; i++) { const u = (i + 0.15 + r() * 0.7) / c.n, x = -off + u * w, t = c.tam * (0.8 + r() * 0.5), f = c.figuras[Math.floor(r() * c.figuras.length)]; if (c.bordes && u > 0.3 && u < 0.7) continue;
          T.dibujar(esc, f, { x, y: c.y * H - t * 0.5, tam: t, modo: 'luz', color: c.color, progreso: 1, brillo: c.brillo, grosor: c.grosor || 2, chispas: 0, semilla: 'b' + ci + i }); }
        (c.extras || []).forEach(([f, ux, uy, tm]) => T.dibujar(esc, f, { x: -off + ux * w, y: uy * H, tam: tm, modo: 'luz', color: c.color, progreso: 1, brillo: c.brillo, grosor: c.grosor || 2, chispas: 0 })); }));
    hs.forEach((h, ci) => { const a = E((o.a == null ? 1 : o.a) * 1.8 - ci * 0.32); P.pegar(esc, h, (o.deriva == null ? 16 : o.deriva) * (ci + 1) / hs.length * Math.sin(tg * 0.035 + ci), a);
      if (o.bruma && ci < hs.length - 1) M.bruma(esc, tg, { y: (o.capas[ci].y - 0.02) * H, alto: 200, n: 4, color: o.bruma, alfa: 0.1 * a }); });
  };

  /* Suelo con hierba, matas y flores: lo estatico se hornea y la hierba del frente se mece. */
  P.suelo = function (esc, tg, o) {
    const W = esc.W, H = esc.H, k = esc.k, a = E(o.a == null ? 1 : o.a);
    const h = P.hornear(esc, 'suelo|' + o.clave, (w, off) => { const x = esc.ctx, g = x.createLinearGradient(0, o.y * H, 0, H); g.addColorStop(0, 'rgba(2,10,10,0)'); g.addColorStop(1, 'rgba(1,5,8,0.92)'); x.fillStyle = g; x.fillRect(-off, o.y * H, w, H - o.y * H); },
      (w, off) => { const r = VE.rng(o.semilla || 'suelo'); for (let i = 0; i < (o.matas || 26); i++) { const d = r(), y = lerp(o.y + 0.03, 0.99, d) * H, t = lerp(70, 230, d) * k; T.dibujar(esc, 'mata', { x: -off + r() * w, y: y - t * 0.5, tam: t, modo: 'luz', progreso: 1, brillo: lerp(0.35, 0.8, d), grosor: 1.6, chispas: 0, color: o.colorHierba }); }
        for (let i = 0; i < (o.flores || 0); i++) { const d = r(), y = lerp(o.y + 0.05, 0.98, d) * H, t = lerp(50, 170, d) * k; T.dibujar(esc, o.figuraFlor || 'flor', { x: -off + r() * w, y: y - t * 0.5, tam: t, modo: 'luz', progreso: 1, brillo: lerp(0.45, 0.95, d), grosor: 1.6, chispas: 0 }); } });
    P.pegar(esc, h, 6 * Math.sin(tg * 0.04), a);
    if (o.viento !== false) M.prado(esc, tg, { y: H * 0.995, x: 0, ancho: W, n: o.n || 46, prog: a, altura: o.altura || 90, viento: 0.8, semilla: 'suelo' + (o.semilla || ''), brillo: 0.7, alfa: 1 });
  };

  /* Cosmos visto desde un planeta: limbo curvo con atmosfera, galaxia y nebulosas. */
  P.cosmos = function (esc, tg, a) {
    const W = esc.W, H = esc.H, k = esc.k, x = esc.ctx;
    M.fondo(esc, tg, { modo: 'negro', estrellas: 1, niebla: 0.22, cantidad: 130 });
    const neb = P.hornear(esc, 'neb', null, (w, off) => { const x = esc.ctx; const r = VE.rng('neb'); x.globalCompositeOperation = 'lighter'; [['#6C3CFF', .30], ['#2C7CFF', .26], ['#FF4CA0', .16], ['#18C8D0', .16]].forEach(([c, al], i) => { for (let j = 0; j < 6; j++) { const rad = r.range(220, 520); x.globalAlpha = al * 0.55; x.drawImage(esc.cache.halo(256, c, 0.5), -off + r() * w - rad, r() * H * 0.7 - rad * 0.5, rad * 2, rad); } }); });
    P.pegar(esc, neb, 8 * Math.sin(tg * 0.02), E(a * 1.5));
    M.fugaces(esc, tg, { cada: 12 });
    const limbo = P.hornear(esc, 'limbo', (w, off) => { const x = esc.ctx, g = x.createRadialGradient(W / 2, H * 2.05, H * 1.0, W / 2, H * 2.05, H * 1.28); g.addColorStop(0, 'rgba(2,6,20,1)'); g.addColorStop(1, 'rgba(2,6,20,1)'); x.fillStyle = g; x.beginPath(); x.arc(W / 2, H * 2.05, H * 1.2, 0, PI * 2); x.fill(); },
      (w, off) => { [[1.205, '#4DB8FF', 1.2, 2.6], [1.215, '#9FD8FF', 0.7, 6], [1.23, '#6C8CFF', 0.4, 12]].forEach(([r, c, br, g]) => T.polilinea(esc, T.arco(W / 2, H * 2.05, H * r, H * r, PI * 1.28, PI * 1.72, 160), { color: c, progreso: 1, grosor: g, brillo: br, cabeza: false }));
        const rr = VE.rng('luces'); for (let i = 0; i < 40; i++) { const an = lerp(PI * 1.34, PI * 1.66, rr()), dd = H * (1.2 - rr() * 0.07); esc.ctx.globalAlpha = 0.5 + rr() * 0.4; esc.pegar(esc.cache.halo(Math.round(3 + rr() * 4), rr() < 0.5 ? '#FFD27A' : '#FFFFFF', 0.5), W / 2 + Math.cos(an) * dd, H * 2.05 + Math.sin(an) * dd, 1); } });
    P.pegar(esc, limbo, 0, E(a * 1.4 - 0.2));
    M.haces(esc, tg, { x0: W * 0.5, y0: H * 0.86, n: 5, largo: 900, apertura: 1.1, angulo: -PI / 2, ancho: 120, color: '#9FD8FF', alfa: 0.07 * a, aparece: a, semilla: 'cos' });
  };

  /* Orilla con juncos y piedras horneados (primer plano). */
  P.orilla = function (esc, tg, o) {
    const H = esc.H, k = esc.k, h = P.hornear(esc, 'ori|' + o.clave, (w, off) => { const x = esc.ctx, g = x.createLinearGradient(0, H * 0.82, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(1,4,10,0.95)'); x.fillStyle = g; x.fillRect(-off, H * 0.82, w, H * 0.18); },
      (w, off) => { const r = VE.rng(o.semilla || 'ori'); [[0.04, 0.17], [0.83, 0.97]].forEach(([u0, u1]) => { for (let i = 0; i < 9; i++) { const d = r(), t = lerp(150, 330, d) * k; T.dibujar(esc, 'mata', { x: -off + lerp(u0, u1, r()) * w, y: H * (0.93 + d * 0.06) - t * 0.5, tam: t, modo: 'luz', progreso: 1, brillo: lerp(0.5, 0.9, d), grosor: 1.8, chispas: 0, color: o.color || '#6EDC8A' }); } }); });
    P.pegar(esc, h, 12 * Math.sin(tg * 0.05), E((o.a == null ? 1 : o.a) * 1.4));
  };

  VE.paisaje = P;
})(window.VE = window.VE || {});
