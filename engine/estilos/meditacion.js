/* HERRAMIENTAS DE MEDITACION: imagen hecha de LUZ.
   Contornos sin relleno cuyo color sale del color real del objeto, sobre fondo negro u onirico, con haces de luz que
   aparecen poco a poco y se superponen (mezcla aditiva). Son herramientas: cada video decide que dibujar y cuando,
   en funcion de su guion (ctx.palabra(...) da el instante exacto de cada palabra).
   Todo es determinista (VE.rng) y sin blur por fotograma. */
(function (VE) {
  const M = {}, E = () => VE.ease;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // ---------- fondos ----------
  const FONDOS = {
    negro:   { nombre: 'M_negro',   fondo: ['#02030A', '#05060E'], vineta: 0.30, grano: 5,  tinta: '#EAF4FF', acento: '#9FB6E8', aviso: '#FFE9A8', panel: 'rgba(255,255,255,.05)', borde: 'rgba(255,255,255,.12)' },
    noche:   { nombre: 'M_noche',   fondo: ['#040818', '#0C1D3E'], vineta: 0.50, grano: 7,  tinta: '#EAF4FF', acento: '#7FB2FF', aviso: '#FFE9A8', panel: 'rgba(255,255,255,.05)', borde: 'rgba(255,255,255,.12)' },
    onirico: { nombre: 'M_onirico', fondo: ['#110A30', '#27407A'], vineta: 0.50, grano: 7,  tinta: '#F2EEFF', acento: '#B88CFF', aviso: '#FFE9A8', panel: 'rgba(255,255,255,.06)', borde: 'rgba(255,255,255,.14)' },
    bosque:  { nombre: 'M_bosque',  fondo: ['#020F0C', '#0B2B22'], vineta: 0.55, grano: 7,  tinta: '#EAFFF4', acento: '#5BE0A0', aviso: '#F6FF8A', panel: 'rgba(255,255,255,.05)', borde: 'rgba(255,255,255,.12)' },
    oceano:  { nombre: 'M_oceano',  fondo: ['#02081A', '#0A2A4A'], vineta: 0.50, grano: 7,  tinta: '#EAF6FF', acento: '#4DB8FF', aviso: '#FFE9A8', panel: 'rgba(255,255,255,.05)', borde: 'rgba(255,255,255,.12)' },
    aurora:  { nombre: 'M_aurora',  fondo: ['#020712', '#0B2238'], vineta: 0.45, grano: 7,  tinta: '#EAFFF6', acento: '#3DFFA8', aviso: '#FFE9A8', panel: 'rgba(255,255,255,.05)', borde: 'rgba(255,255,255,.12)' },
    amanecer:{ nombre: 'M_amanecer',fondo: ['#2B1856', '#D0707E'], vineta: 0.40, grano: 7,  tinta: '#FFF8F0', acento: '#FFB28A', aviso: '#FFF1B8', panel: 'rgba(255,255,255,.06)', borde: 'rgba(255,255,255,.14)' },
    alba:    { nombre: 'M_alba',    fondo: ['#1A0F3A', '#6A3E7A'], vineta: 0.45, grano: 7,  tinta: '#FFF4EE', acento: '#FFB28A', aviso: '#FFE9A8', panel: 'rgba(255,255,255,.06)', borde: 'rgba(255,255,255,.14)' },
  };
  M.fondos = Object.keys(FONDOS);
  M.estilo = (n) => FONDOS[n];

  /* fondo(esc, tg, {modo, a:'otro modo', mezcla:0..1, estrellas:0..1, niebla:0..1})
     'mezcla' funde de 'modo' hacia 'a': asi un fondo negro puede volverse onirico poco a poco. */
  M.fondo = function (esc, tg, o = {}) {
    const x = esc.ctx, modo = o.modo || 'negro';
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(esc.cache.fondo(esc.W, esc.H, FONDOS[modo]), 0, 0);
    if (o.a && o.mezcla > 0) { x.globalAlpha = clamp01(o.mezcla); x.drawImage(esc.cache.fondo(esc.W, esc.H, FONDOS[o.a]), 0, 0); x.globalAlpha = 1; }
    x.setTransform(esc.ss, 0, 0, esc.ss, 0, 0);
    const est = FONDOS[o.a && o.mezcla > 0.5 ? o.a : modo];
    if (o.niebla) {
      /* La niebla son 4 halos enormes en mezcla aditiva: calculados por fotograma costaban ~200 ms (sin GPU). Se hornean UNA vez en
         dos capas con composiciones distintas y se funden despacio: parece que deriva, y cuesta dos copias de imagen. */
      const est2 = est, K = esc.k, capa = (v) => esc.cache.obtener('niebla|' + est2.nombre + '|' + v + '|' + esc.W, () => {
        const c = VE.atlas.lienzo(esc.W * esc.ss, esc.H * esc.ss), cx = c.getContext('2d'), r = VE.rng('niebla' + v); cx.scale(esc.ss, esc.ss); cx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) { const rad = r.range(380, 700) * K, h = esc.cache.halo(Math.round(rad), i % 2 ? est2.acento : '#6C8CFF', 0.5);
          cx.globalAlpha = 0.55; cx.drawImage(h, r.range(0, esc.W) - rad, r.range(0, esc.H) - rad, rad * 2, rad * 2); }
        return c; });
      const m = 0.5 + 0.5 * Math.sin(tg * 0.06);
      x.save(); x.globalCompositeOperation = 'lighter';
      x.globalAlpha = o.niebla * (1 - m); x.drawImage(capa(0), 0, 0, esc.W, esc.H);
      x.globalAlpha = o.niebla * m; x.drawImage(capa(1), 0, 0, esc.W, esc.H);
      x.restore();
    }
    if (o.estrellas) M.estrellas(esc, tg, { cantidad: o.cantidad || 90, visible: o.estrellas, zona: o.zonaEstrellas });
  };

  M.estrellas = function (esc, tg, o = {}) {
    const r = VE.rng('estrellas'), z = o.zona || { x: 0, y: 0, w: esc.W, h: esc.H * 0.62 }, x = esc.ctx, n = o.cantidad || 90;
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const sx = z.x + r() * z.w, sy = z.y + r() * z.h, f = 0.4 + r() * 1.1, ph = r() * 6.28, tam = (3 + r() * 7) * esc.k;
      const aparece = clamp01((o.visible == null ? 1 : o.visible) * 1.4 - r() * 0.4);         // salen una a una, no de golpe
      const a = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(tg * f + ph))) * aparece;
      if (a < 0.03) continue; x.globalAlpha = a * 0.9; esc.pegar(esc.cache.halo(Math.round(tam * 2.4), i % 7 === 0 ? '#FFE9A8' : '#CFE0FF', 0.3), sx, sy, 1);
    }
    x.restore();
  };

  // ---------- haces de luz (god rays) ----------
  /* haces(esc, tg, {x0,y0, n, largo, apertura (rad entre el primero y el ultimo), angulo (rad central), ancho, color,
                      alfa, aparece 0..1, semilla}). Aparecen escalonados con 'aparece' y se superponen aditivamente. */
  M.haces = function (esc, tg, o) {
    const x = esc.ctx, r = VE.rng(o.semilla || 'haces'), n = o.n || 5, k = esc.k;
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1), fase = r() * 6.28, vel = 0.12 + r() * 0.2;
      const ap = clamp01((o.aparece == null ? 1 : o.aparece) * (1 + (n - 1) * 0.5) - i * 0.5);        // uno tras otro
      if (ap <= 0) continue;
      const ang = (o.angulo || Math.PI / 2) + (u - 0.5) * (o.apertura || 0.9) + Math.sin(tg * vel + fase) * 0.035;
      const len = (o.largo || 1200) * k * (0.78 + 0.22 * Math.sin(tg * vel * 1.3 + fase)) * (0.5 + 0.5 * ap);
      const half = ((o.ancho || 110) * k * (0.7 + 0.6 * r())) / 2, cx = Math.cos(ang), cy = Math.sin(ang), px = -cy, py = cx;
      const x1 = o.x0 + cx * len, y1 = o.y0 + cy * len;
      const g = x.createLinearGradient(o.x0, o.y0, x1, y1), col = o.color || '#CFE3FF';
      g.addColorStop(0, VE.color.a(col, 0.55)); g.addColorStop(0.55, VE.color.a(col, 0.14)); g.addColorStop(1, VE.color.a(col, 0));
      x.globalAlpha = (o.alfa == null ? 0.28 : o.alfa) * ap * (0.65 + 0.35 * Math.sin(tg * vel * 2 + fase));
      x.fillStyle = g; x.beginPath(); x.moveTo(o.x0 - px * 4, o.y0 - py * 4); x.lineTo(x1 - px * half, y1 - py * half); x.lineTo(x1 + px * half, y1 + py * half); x.lineTo(o.x0 + px * 4, o.y0 + py * 4); x.closePath(); x.fill();
    }
    x.restore();
  };

  /* rayo: un haz que viaja de A a B dibujando su recorrido (la luz "baja" y deja la huella). */
  M.rayo = function (esc, a, b, prog, o = {}) {
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([lerp(a[0], b[0], t) + Math.sin(t * 6.28 * (o.ondas || 0)) * (o.amp || 0) * esc.k, lerp(a[1], b[1], t)]); }
    return VE.trazo.polilinea(esc, pts, { color: o.color || '#CFE3FF', progreso: prog, grosor: o.grosor || 3, brillo: o.brillo, alfa: o.alfa });
  };

  // ---------- paisaje en lineas de luz ----------
  /* colinas: contorno ondulado de izquierda a derecha. {y, amp, ancho, x, color, prog, capa (semilla), brillo} */
  M.colina = function (esc, tg, o) {
    const r = VE.rng('colina' + (o.capa || 0)), f1 = 0.004 + r() * 0.003, f2 = 0.011 + r() * 0.004, p1 = r() * 6.28, p2 = r() * 6.28, pts = [];
    const x0 = o.x == null ? 0 : o.x, w = o.ancho || esc.W;
    for (let i = 0; i <= 80; i++) { const xx = x0 + w * i / 80; pts.push([xx, o.y - (o.amp || 90) * esc.k * (0.6 * Math.sin(xx * f1 + p1 + tg * 0.02) + 0.4 * Math.sin(xx * f2 + p2))]); }
    return VE.trazo.polilinea(esc, pts, { color: o.color || '#8FA3C7', progreso: o.prog, grosor: o.grosor || 2.2, brillo: o.brillo == null ? 0.8 : o.brillo, alfa: o.alfa, cabeza: o.cabeza });
  };

  /* prado: briznas que crecen de izquierda a derecha y se mecen. {y, x, ancho, n, prog, altura, viento, semilla} */
  M.prado = function (esc, tg, o) {
    const r = VE.rng(o.semilla || 'prado'), n = o.n || 90, k = esc.k, x0 = o.x == null ? 0 : o.x, w = o.ancho || esc.W;
    for (let i = 0; i < n; i++) {
      const u = (i + r()) / n, bx = x0 + u * w, h = (o.altura || 110) * k * (0.5 + r() * 0.9), lean = (r() - 0.5) * 50 * k, ph = r() * 6.28;
      const crece = clamp01((o.prog * 1.6 - u * 0.6) / 1);                                  // la hierba nace de un lado al otro
      if (crece <= 0) continue;
      const sway = Math.sin(tg * 0.8 * (o.viento || 1) + ph + bx * 0.004) * 16 * k * crece, hh = h * crece, pts = [];
      for (let j = 0; j <= 7; j++) { const t = j / 7; pts.push([bx + (lean + sway) * t * t, o.y - hh * t]); }
      const tono = r(); VE.trazo.polilinea(esc, pts, { color: VE.color.hsl(95 + tono * 50, 70, 55), grosor: 1.8 + r() * 0.8, brillo: (o.brillo == null ? 0.75 : o.brillo) * (0.7 + 0.3 * tono), alfa: o.alfa, cabeza: false });
    }
  };

  // ---------- motas, luciernagas, respiracion ----------
  M.motas = function (esc, tg, o) {
    const r = VE.rng(o.semilla || 'motas'), z = o.zona || { x: 0, y: 0, w: esc.W, h: esc.H }, n = o.n || 30, k = esc.k, x = esc.ctx;
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const bx = z.x + r() * z.w, by = z.y + r() * z.h, vel = (0.015 + r() * 0.03) * (o.vel || 1), ph = r(), tam = (6 + r() * 12) * k;
      const t = (tg * vel + ph) % 1, yy = by - t * (o.sube == null ? 160 : o.sube) * k, xx = bx + Math.sin(tg * 0.4 + i * 1.7) * 26 * k;
      const a = Math.sin(Math.PI * t) ** 2 * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(tg * (0.7 + r()) + i))) * (o.alfa == null ? 1 : o.alfa);
      if (a < 0.02) continue; x.globalAlpha = a; esc.pegar(esc.cache.halo(Math.round(tam * 2), o.color || '#CFE3FF', 0.3), xx, yy, 1);
    }
    x.restore();
  };
  M.luciernagas = function (esc, tg, o) {
    const r = VE.rng(o.semilla || 'luci'), z = o.zona, k = esc.k, x = esc.ctx; x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (o.n || 10); i++) {
      const cx = z.x + r() * z.w, cy = z.y + r() * z.h, ax = (40 + r() * 90) * k, ay = (30 + r() * 60) * k, f1 = 0.15 + r() * 0.25, f2 = 0.2 + r() * 0.3, ph = r() * 6.28;
      const px = cx + Math.sin(tg * f1 + ph) * ax, py = cy + Math.sin(tg * f2 * 1.3 + ph * 2) * ay, pul = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tg * (0.8 + r() * 0.8) + ph));
      x.globalAlpha = pul * (o.alfa == null ? 1 : o.alfa); esc.pegar(esc.cache.halo(Math.round(34 * k), o.color || '#E6FF7A', 0.25), px, py, 1);
      x.globalAlpha = Math.min(1, pul * 1.2) * (o.alfa == null ? 1 : o.alfa); esc.pegar(esc.cache.halo(Math.round(7 * k), '#FFFFFF', 0.4), px, py, 1);
    }
    x.restore();
  };

  /* respiracion: fase de un ciclo [inhala, sostiene, exhala] (segundos). Devuelve {fase, p (0..1 tamano), nombre}. */
  M.fase = function (t, ciclo = [4, 2, 6]) {
    const T = ciclo[0] + ciclo[1] + ciclo[2], u = ((t % T) + T) % T, e = VE.ease.suave;
    if (u < ciclo[0]) return { fase: 0, p: e(u / ciclo[0]), nombre: 'inhala' };
    if (u < ciclo[0] + ciclo[1]) return { fase: 1, p: 1, nombre: 'sostiene' };
    return { fase: 2, p: 1 - e((u - ciclo[0] - ciclo[1]) / ciclo[2]), nombre: 'exhala' };
  };
  M.anillos = function (esc, tg, o) {
    const f = M.fase(tg, o.ciclo), n = o.n || 3, k = esc.k;
    for (let i = 0; i < n; i++) {
      const lag = M.fase(tg - i * (o.retardo == null ? 0.35 : o.retardo), o.ciclo).p, r = (o.r0 || 120) * k + ((o.r1 || 260) - (o.r0 || 120)) * k * lag - i * 14 * k;
      const pts = VE.trazo.arco(o.x, o.y, r, r, -Math.PI / 2, Math.PI * 1.5, 120);
      VE.trazo.polilinea(esc, pts, { color: o.color || '#9FB6E8', progreso: o.prog == null ? 1 : o.prog, grosor: 2.4, brillo: (o.brillo == null ? 1 : o.brillo) * (1 - i * 0.28), alfa: o.alfa, cabeza: false });
    }
    return f;
  };

  // ---------- texto escrito con luz ----------
  /* texto: el contorno de las letras se traza progresivamente. {x, y, tam, prog, color, peso} */
  M.texto = function (esc, txt, o) {
    const x = esc.ctx, tam = esc.tipo(o.tam || 60, o.peso || 600), prog = clamp01(o.prog == null ? 1 : o.prog), L = tam * 4.2;
    x.save(); x.globalCompositeOperation = 'lighter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    const cl = VE.color.luz(o.color || '#EAF4FF'), cn = VE.color.nucleo(o.color || '#EAF4FF');
    const dash = prog >= 1 ? [] : [L * prog, L * 8];
    for (const [w, a, c] of [[tam * 0.20, 0.07, cl], [tam * 0.10, 0.16, cl], [tam * 0.05, 0.40, cl], [tam * 0.022, 0.95, cn]]) {
      x.setLineDash(dash); x.lineWidth = w; x.strokeStyle = c; x.globalAlpha = a * (o.alfa == null ? 1 : o.alfa); x.strokeText(txt, o.x, o.y); }
    x.setLineDash([]); x.restore();
    if (VE.registrar) { const m = x.measureText(txt); VE.registrar('texto', { x: o.x - m.width / 2, y: o.y - tam / 2, w: m.width, h: tam }, { nota: txt, color: o.color || '#EAF4FF', contorno: true }); }
  };

  VE.med = M;
})(window.VE = window.VE || {});
