/* COMPOSICION POR PARRAFO + piezas especificas de divulgacion (cuerpo, cosmos, fisica, camino).
   VE.comp(esc, ctx) devuelve un ayudante ligado al PARRAFO actual: todo lo que se dibuja aparece progresivamente, se dispara al
   decir una palabra (en:'palabra') o a los N segundos (en:2.5), y se desvanece al final del parrafo. Coordenadas en fracciones
   de pantalla (ux, uy en 0..1); tamanos en unidades de diseno. */
(function (VE) {
  const M = VE.med, T = VE.trazo, PI = Math.PI, c01 = (v) => Math.max(0, Math.min(1, v)), E = (v) => VE.ease.suave(c01(v)), lerp = (a, b, t) => a + (b - a) * t;

  // ---------- piezas globales (no ligadas a un parrafo) ----------
  /* Espacio-tiempo: rejilla que se hunde alrededor de una masa. {cx,cy,w,h (px), masa 0..1, prog, color} */
  M.espaciotiempo = function (esc, tg, o) {
    const nV = 15, nH = 11, k = esc.k, N = 44, sig = (o.w || 900) * 0.16, col = o.color || '#6C8CFF', m = o.masa == null ? 1 : o.masa;
    const desp = (px, py) => { const dx = px - o.cx, dy = py - o.cy, r2 = dx * dx + dy * dy, g = Math.exp(-r2 / (2 * sig * sig)) * m;
      return [px - dx * g * 0.45, py + g * 150 * k * (1 + 0.15 * Math.sin(tg * 0.7))]; };
    for (let i = 0; i < nV; i++) { const px = o.cx - o.w / 2 + o.w * i / (nV - 1), pts = []; for (let j = 0; j <= N; j++) pts.push(desp(px, o.cy - o.h / 2 + o.h * j / N));
      T.polilinea(esc, pts, { color: col, progreso: c01((o.prog == null ? 1 : o.prog) * 1.5 - i / nV * 0.5), grosor: 1.6, brillo: 0.55, cabeza: false }); }
    for (let i = 0; i < nH; i++) { const py = o.cy - o.h / 2 + o.h * i / (nH - 1), pts = []; for (let j = 0; j <= N; j++) pts.push(desp(o.cx - o.w / 2 + o.w * j / N, py));
      T.polilinea(esc, pts, { color: '#8FD6FF', progreso: c01((o.prog == null ? 1 : o.prog) * 1.5 - i / nH * 0.5), grosor: 1.6, brillo: 0.55, cabeza: false }); }
    const c = desp(o.cx, o.cy); return { x: c[0], y: c[1] };
  };

  /* Electrones uno a uno formando un patron de franjas. {x0,x1,y0,y1 (px del detector), n (cuantos puntos), emisor:[x,y]} */
  M.electrones = function (esc, tg, o) {
    const x = esc.ctx, k = esc.k, clave = 'elec|' + o.x0 + '|' + o.x1 + '|' + o.y0 + '|' + o.y1;
    const pos = esc.cache.obtener(clave, () => { const r = VE.rng('electrones'), a = [], w = o.x1 - o.x0, h = o.y1 - o.y0;
      while (a.length < 3200) { const u = r() - 0.5, I = Math.pow(Math.cos(PI * u * 7), 2) * Math.exp(-Math.pow(u * 2.4, 2)); if (r() < I) a.push([o.x0 + (u + 0.5) * w, o.y0 + r() * h]); } return a; });
    const n = Math.floor(c01(o.n) * pos.length), s = Math.max(2, 2.4 * k);
    x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = '#9FD8FF'; x.globalAlpha = 0.85;
    for (let i = 0; i < n; i++) x.fillRect(pos[i][0], pos[i][1], s, s);
    if (n > 0 && n < pos.length && o.emisor) { const last = pos[n - 1], f = (tg * 4) % 1;                       // el electron que viaja ahora
      x.globalAlpha = 1; esc.pegar(esc.cache.halo(Math.round(14 * k), '#FFFFFF', 0.4), lerp(o.emisor[0], last[0], f), lerp(o.emisor[1], last[1], f), 1); }
    x.restore();
    VE.trazo.polilinea(esc, [[o.x0 - 8, o.y0 - 10], [o.x0 - 8, o.y1 + 10]], { color: '#9FB6E8', grosor: 2, brillo: 0.7, cabeza: false });
    VE.trazo.polilinea(esc, [[o.x1 + 8, o.y0 - 10], [o.x1 + 8, o.y1 + 10]], { color: '#9FB6E8', grosor: 2, brillo: 0.7, cabeza: false });
  };

  /* Latidos con variabilidad: los intervalos se alargan y acortan con la respiracion (arritmia sinusal respiratoria, ilustrada). */
  const LATIDOS = (() => { const a = []; let t = 0; while (t < 5000) { a.push(t); t += 0.95 + 0.16 * Math.sin(2 * PI * t / 9.5); } return a; })();
  const qrs = (u) => u < 0.12 ? 0.18 * Math.sin(PI * u / 0.12) : u < 0.2 ? 0 : u < 0.23 ? -0.15 * ((u - 0.2) / 0.03) : u < 0.27 ? -0.15 + 1.15 * ((u - 0.23) / 0.04) : u < 0.31 ? 1 - 1.3 * ((u - 0.27) / 0.04) : u < 0.34 ? -0.3 + 0.3 * ((u - 0.31) / 0.03) : u < 0.5 ? 0 : u < 0.72 ? 0.3 * Math.sin(PI * (u - 0.5) / 0.22) : 0;
  M.ecg = function (esc, tg, o) {
    const k = esc.k, pts = [], x0 = o.x0, x1 = o.x1, vel = o.vel || 130 * k, N = 220;
    for (let i = 0; i <= N; i++) { const px = x0 + (x1 - x0) * i / N, tau = tg - (x1 - px) / vel; let lo = 0, hi = LATIDOS.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (LATIDOS[m] <= tau) lo = m; else hi = m - 1; }
      const per = (LATIDOS[Math.min(lo + 1, LATIDOS.length - 1)] - LATIDOS[lo]) || 1, u = tau < 0 ? 0.6 : (tau - LATIDOS[lo]) / per; pts.push([px, o.y - qrs(u) * (o.amp || 90) * k]); }
    VE.trazo.polilinea(esc, pts, { color: o.color || '#FF6B8B', progreso: o.prog == null ? 1 : o.prog, grosor: 2.6, brillo: 1.1, cabeza: false });
  };

  /* Red de neuronas con impulsos que viajan. {x,y,w,h (px), n, prog, semilla, color} */
  M.red = function (esc, tg, o) {
    const x = esc.ctx, k = esc.k, r = VE.rng(o.semilla || 'red'), n = o.n || 34, nodos = Array.from({ length: n }, () => [o.x + (r() - 0.5) * o.w, o.y + (r() - 0.5) * o.h]), aristas = [];
    nodos.forEach((a, i) => { nodos.map((b, j) => [Math.hypot(a[0] - b[0], a[1] - b[1]), j]).filter(q => q[1] !== i).sort((p, q) => p[0] - q[0]).slice(0, 2).forEach(q => { if (!aristas.some(e => (e[0] === i && e[1] === q[1]) || (e[0] === q[1] && e[1] === i))) aristas.push([i, q[1]]); }); });
    const p = c01(o.prog == null ? 1 : o.prog), col = o.color || '#9FD8FF', cl = VE.color.luz(col);
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    aristas.forEach(([i, j], q) => { const a = nodos[i], b = nodos[j], v = c01(p * 1.6 - q / aristas.length * 0.6); if (v <= 0) return;
      x.strokeStyle = cl; x.lineWidth = 1.4 * k; x.globalAlpha = 0.28 * (o.alfa == null ? 1 : o.alfa); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(lerp(a[0], b[0], v), lerp(a[1], b[1], v)); x.stroke();
      if (v >= 1) { const f = (tg * 0.5 + q * 0.37) % 1; if (f < 0.55) { x.globalAlpha = Math.sin(PI * f / 0.55) * (o.alfa == null ? 1 : o.alfa); esc.pegar(esc.cache.halo(Math.round(9 * k), '#FFFFFF', 0.4), lerp(a[0], b[0], f / 0.55), lerp(a[1], b[1], f / 0.55), 1); } } });
    nodos.forEach((a, i) => { const v = c01(p * 2 - i / n); if (v > 0) { x.globalAlpha = v * 0.8 * (o.alfa == null ? 1 : o.alfa); esc.pegar(esc.cache.halo(Math.round(8 * k), cl, 0.4), a[0], a[1], 1); } });
    x.restore();
  };

  M.reloj = function (esc, tg, o) {
    const r = o.r * esc.k, pts = T.arco(o.x, o.y, r, r, -PI / 2, PI * 1.5, 70), col = o.color || '#9FB6E8';
    T.polilinea(esc, pts, { color: col, progreso: o.prog == null ? 1 : o.prog, grosor: 2.4, cabeza: false });
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2 - PI / 2; T.polilinea(esc, [[o.x + Math.cos(a) * r * 0.85, o.y + Math.sin(a) * r * 0.85], [o.x + Math.cos(a) * r * 0.95, o.y + Math.sin(a) * r * 0.95]], { color: col, progreso: o.prog == null ? 1 : o.prog, grosor: 1.6, brillo: 0.7, cabeza: false }); }
    const a = tg * (o.vel || 0.5) - PI / 2; T.polilinea(esc, [[o.x, o.y], [o.x + Math.cos(a) * r * 0.7, o.y + Math.sin(a) * r * 0.7]], { color: o.manecilla || '#FFE9A8', progreso: o.prog == null ? 1 : o.prog, grosor: 3, cabeza: false });
  };

  /* Titulo de acto escrito con luz, arriba. {ctx, romano, titulo} */
  M.tituloActo = function (esc, ctx, romano, titulo) {
    const t = ctx.t, vis = c01(t / 2.4) * c01((7 - t) / 1.6); if (vis <= 0) return; const W = esc.W, H = esc.H;
    esc.ctx.save(); M.texto(esc, 'ACTO ' + romano, { x: W / 2, y: H * 0.10, tam: 30, prog: c01(t / 2), color: '#9FB6E8', alfa: vis, peso: 500 });
    M.texto(esc, titulo, { x: W / 2, y: H * 0.17, tam: 64, prog: c01((t - 0.4) / 3), color: '#EAF4FF', alfa: vis, peso: 600 }); esc.ctx.restore();
  };

  // ---------- ayudante por parrafo ----------
  VE.comp = function (esc, ctx) {
    const W = esc.W, H = esc.H, k = esc.k, x = esc.ctx, tp = ctx.tp, dp = ctx.dp, tg = ctx.tg, C = { W, H, k, tp, dp, tg, esc, ctx };
    C.salida = c01((dp - tp) / 1.2);                                                        // 1 -> 0 al final del parrafo
    C.en = (v, def) => typeof v === 'string' ? (ctx.pw(v) == null ? (def == null ? 0.5 : def) : ctx.pw(v)) : (v == null ? 0.4 : v);
    C.p = (v, dur = 3) => E((tp - C.en(v)) / dur);
    C.px = (ux, uy) => [ux * W, uy * H];
    C.fig = function (n, ux, uy, tam, o = {}) {
      const p = o.fijo ? 1 : C.p(o.en, o.dur || 3); if (p <= 0) return null; x.save(); x.globalAlpha *= (o.alfa == null ? 1 : o.alfa) * (o.persistir ? 1 : C.salida);
      const r = T.dibujar(esc, n, Object.assign({ x: ux * W, y: uy * H, tam, modo: 'luz', progreso: p, t: tg, chispas: o.chispas == null ? 6 : o.chispas, semilla: n + ctx.i + '_' + ctx.parrafo, pulso: { f: 0.16, a: 0.1 } }, o.opts || {},
        { brillo: o.brillo, rot: o.rot, color: o.color, espejo: o.espejo, escalonado: o.esc, grosor: o.grosor, cabeza: o.cabeza })); x.restore(); return r; };
    C.glow = function (ux, uy, r, col, o = {}) {
      const a = (o.en == null ? 1 : C.p(o.en, o.dur || 1.5)) * (o.persistir ? 1 : C.salida) * (o.alfa == null ? 1 : o.alfa); if (a <= 0) return;
      x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = a; esc.pegar(esc.cache.halo(Math.round(r * k * (1 + (o.pulso == null ? 0.08 : o.pulso) * Math.sin(tg * (o.f || 1.1)))), col, o.dureza || 0.3), ux * W, uy * H, 1); x.restore(); };
    C.curva = function (a, b, c, n = 40) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]); } return o; };
    C.linea = function (pts, col, prog, o = {}) { x.save(); x.globalAlpha *= (o.persistir ? 1 : C.salida); T.polilinea(esc, pts.map(q => [q[0] * W, q[1] * H]), { color: col, progreso: prog, grosor: o.grosor || 2.4, brillo: o.brillo, cabeza: o.cabeza }); x.restore(); };
    C.anillos = function (ux, uy, o = {}) { const a = c01(C.p(o.en, 2)) * C.salida; if (a <= 0) return; x.save(); x.globalAlpha *= a; M.anillos(esc, tg, { x: ux * W, y: uy * H, r0: o.r0 || 90, r1: o.r1 || 230, n: o.n || 3, prog: 1, color: o.color || '#9FB6E8', ciclo: o.ciclo || [4, 1.5, 5], brillo: o.brillo }); x.restore(); };
    C.ondas = function (ux, uy, o = {}) {                                                      // anillos que se expanden y se disuelven
      const a = C.p(o.en, 1.2) * C.salida; if (a <= 0) return; x.save(); const n = o.n || 4;
      for (let i = 0; i < n; i++) { const u = (tg * (o.vel || 0.25) + i / n) % 1, r = lerp(o.r0 || 30, o.r1 || 400, u) * k; x.globalAlpha = a * Math.pow(1 - u, 1.4) * (o.alfa == null ? 1 : o.alfa);
        T.polilinea(esc, T.arco(ux * W, uy * H, r, r, 0, PI * 2, 90), { color: o.color || '#CFE3FF', grosor: 2.2, brillo: 0.9, cabeza: false }); } x.restore(); };
    C.motas = function (o = {}) { x.save(); x.globalAlpha *= C.salida; M.motas(esc, tg, Object.assign({ n: 16, zona: { x: 0, y: 0, w: W, h: H }, color: '#CFE3FF', alfa: 0.6, sube: 110, semilla: 'cm' + ctx.i + ctx.parrafo }, o)); x.restore(); };
    C.red = function (ux, uy, w, h, o = {}) { x.save(); x.globalAlpha *= C.salida; M.red(esc, tg, Object.assign({ x: ux * W, y: uy * H, w: w * k, h: h * k, prog: C.p(o.en, o.dur || 3) }, o)); x.restore(); };
    C.puntos = function (lista, o = {}) {                                                      // lista de [ux,uy,palabra|seg,color]
      lista.forEach(([ux, uy, en, col], i) => C.glow(ux, uy, o.r || 70, col || '#FFE9A8', { en, alfa: o.alfa, dur: 1.4 })); };
    return C;
  };
})(window.VE = window.VE || {});
