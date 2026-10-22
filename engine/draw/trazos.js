/* TRAZOS DE LUZ y figuras vectoriales.

   Una figura es una lista de PARTES (trazos), cada una con su color real. Se puede dibujar en tres modos:
     'luz'    solo contorno, sin relleno, con halo aditivo y el color real aclarado (para fondos oscuros)
     'solido' relleno con degradado + contorno (figuras coloreadas bien definidas)
     'linea'  contorno plano
   Todo se muestrea a polilineas con longitud acumulada, de modo que cualquier trazo puede dibujarse
   progresivamente (como un haz de luz que lo recorre). Sin blur ni shadowBlur: el halo se logra con
   varias pasadas de distinto ancho y alfa, que cuestan casi nada. */
(function (VE) {
  const T = {};

  // ---------- parser SVG (M L H V C S Q T Z, absolutos y relativos) ----------
  function tokens(d) { return d.match(/[MLHVCSQTZmlhvcsqtz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || []; }
  function bez3(a, b, c, d, n, out) { for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t;
    out.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } }
  function bez2(a, b, c, n, out) { for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]); } }
  T.desdeSVG = function (d, paso = 14) {
    const tk = tokens(d), subs = []; let i = 0, cmd = '', cur = [0, 0], ini = [0, 0], ult = null, pts = null;
    const num = () => parseFloat(tk[i++]);
    while (i < tk.length) {
      if (/[A-Za-z]/.test(tk[i])) cmd = tk[i++]; const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
      const ox = rel ? cur[0] : 0, oy = rel ? cur[1] : 0;
      if (C === 'Z') { if (pts) { pts.push(ini.slice()); subs.push({ pts, cerrada: true }); pts = null; } cur = ini.slice(); ult = null; continue; }
      if (C === 'M') { if (pts && pts.length > 1) subs.push({ pts, cerrada: false }); cur = [ox + num(), oy + num()]; ini = cur.slice(); pts = [cur.slice()]; cmd = rel ? 'l' : 'L'; ult = null; continue; }
      if (!pts) pts = [cur.slice()];
      if (C === 'L') { cur = [ox + num(), oy + num()]; pts.push(cur.slice()); ult = null; }
      else if (C === 'H') { cur = [(rel ? cur[0] : 0) + num(), cur[1]]; pts.push(cur.slice()); ult = null; }
      else if (C === 'V') { cur = [cur[0], (rel ? cur[1] : 0) + num()]; pts.push(cur.slice()); ult = null; }
      else if (C === 'C') { const b = [ox + num(), oy + num()], c = [ox + num(), oy + num()], e = [ox + num(), oy + num()]; bez3(cur, b, c, e, paso, pts); ult = ['C', c]; cur = e; }
      else if (C === 'S') { const b = ult && ult[0] === 'C' ? [2 * cur[0] - ult[1][0], 2 * cur[1] - ult[1][1]] : cur.slice(); const c = [ox + num(), oy + num()], e = [ox + num(), oy + num()]; bez3(cur, b, c, e, paso, pts); ult = ['C', c]; cur = e; }
      else if (C === 'Q') { const b = [ox + num(), oy + num()], e = [ox + num(), oy + num()]; bez2(cur, b, e, paso, pts); ult = ['Q', b]; cur = e; }
      else if (C === 'T') { const b = ult && ult[0] === 'Q' ? [2 * cur[0] - ult[1][0], 2 * cur[1] - ult[1][1]] : cur.slice(); const e = [ox + num(), oy + num()]; bez2(cur, b, e, paso, pts); ult = ['Q', b]; cur = e; }
      else throw new Error('Comando SVG no soportado: ' + cmd);
    }
    if (pts && pts.length > 1) subs.push({ pts, cerrada: false });
    return subs;
  };

  // ---------- generadores geometricos ----------
  T.arco = (cx, cy, rx, ry, a0, a1, n = 48, rot = 0) => { const o = []; const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); } return o; };
  T.circulo = (cx, cy, r, n = 64) => T.arco(cx, cy, r, r, 0, Math.PI * 2, n);

  /* Contorno exterior de la UNION de circulos (nubes, copas de arbol): se muestrea cada circulo y se
     descartan los puntos que quedan dentro de otro. Devuelve un unico contorno cerrado ordenado por angulo
     alrededor del centroide, valido para siluetas convexas por tramos como nubes y copas. */
  T.union = function (cs, n = 90) {
    const pts = [];
    cs.forEach(([cx, cy, r], k) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (!cs.some(([qx, qy, qr], j) => j !== k && Math.hypot(x - qx, y - qy) < qr - 0.01)) pts.push([x, y]); } });
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    pts.sort((a, b) => Math.atan2(a[1] - my, a[0] - mx) - Math.atan2(b[1] - my, b[0] - mx));
    pts.push(pts[0].slice()); return pts;
  };
  /* Creciente: disco 1 menos disco 2 (calculo analitico de las dos intersecciones). */
  T.creciente = function (c1, r1, c2, r2, n = 60) {
    const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const alfa = Math.acos(a / r1), beta = Math.acos((d - a) / r2), dir12 = Math.atan2(dy, dx), dir21 = dir12 + Math.PI;
    const ext = T.arco(c1[0], c1[1], r1, r1, dir12 + alfa, dir12 + Math.PI * 2 - alfa, n);
    const inte = T.arco(c2[0], c2[1], r2, r2, dir21 - beta, dir21 + beta, n);
    const fin = ext[ext.length - 1], d0 = Math.hypot(inte[0][0] - fin[0], inte[0][1] - fin[1]), d1 = Math.hypot(inte[inte.length - 1][0] - fin[0], inte[inte.length - 1][1] - fin[1]);
    const dentro = d0 <= d1 ? inte : inte.slice().reverse(); const pts = ext.concat(dentro); pts.push(pts[0].slice()); return pts;
  };

  // ---------- figuras: definicion -> partes muestreadas ----------
  const DEFS = {};
  T.definir = (nombre, def) => { DEFS[nombre] = def; };
  T.nombres = () => Object.keys(DEFS);
  const cacheFig = {};

  function longitudes(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
  function rotar(pts, cx, cy, ang) { const c = Math.cos(ang), s = Math.sin(ang); return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); }

  T.figura = function (nombre) {
    if (cacheFig[nombre]) return cacheFig[nombre];
    const def = DEFS[nombre]; if (!def) throw new Error('Figura desconocida: ' + nombre + '. Hay: ' + T.nombres().join(', '));
    const partes = [];
    for (const p of def.partes) {
      let polis = [];
      if (p.d) polis = T.desdeSVG(p.d).map(s => ({ pts: s.pts, cerrada: s.cerrada }));
      else if (p.circ) polis = [{ pts: T.circulo(...p.circ), cerrada: true }];
      else if (p.arco) polis = [{ pts: T.arco(...p.arco), cerrada: Math.abs(p.arco[5] - p.arco[4]) >= Math.PI * 2 - 1e-6 }];   // vuelta completa = elipse cerrada
      else if (p.union) polis = [{ pts: T.union(p.union), cerrada: true }];
      else if (p.creciente) polis = [{ pts: T.creciente(...p.creciente), cerrada: true }];
      else if (p.gen) polis = p.gen().map(q => (Array.isArray(q) ? { pts: q, cerrada: false } : q));
      let todas = polis;
      if (p.copias) { const [cx, cy] = p.copias.centro, n = p.copias.n, a0 = p.copias.desde || 0, paso = p.copias.paso || (Math.PI * 2 / n);
        todas = []; for (let k = 0; k < n; k++) polis.forEach(q => todas.push({ pts: rotar(q.pts, cx, cy, a0 + k * paso), cerrada: q.cerrada })); }
      if (p.espejo) { const ex = []; todas.forEach(q => ex.push({ pts: q.pts.map(([x, y]) => [100 - x, y]), cerrada: q.cerrada })); todas = todas.concat(ex); }
      todas.forEach(q => { const cum = longitudes(q.pts); partes.push({ pts: q.pts, cum, total: cum[cum.length - 1], cerrada: !!q.cerrada,
        color: p.color || def.color || '#ffffff', relleno: p.relleno !== false && q.cerrada && !p.abierta, ancho: p.ancho || 1, peso: p.peso || 1, orden: p.orden || 0 }); });
    }
    const todosPts = partes.flatMap(q => q.pts);
    const f = { nombre, partes, caja: [Math.min(...todosPts.map(p => p[0])), Math.min(...todosPts.map(p => p[1])), Math.max(...todosPts.map(p => p[0])), Math.max(...todosPts.map(p => p[1]))],
      total: partes.reduce((s, q) => s + q.total * q.peso, 0), desc: def.desc || '' };
    return (cacheFig[nombre] = f);
  };

  // ---------- dibujo ----------
  function trazar(x, pts, cum, hasta, tf) {          // ruta hasta la longitud 'hasta', con transformacion tf(p)->[X,Y]
    x.beginPath(); let [X, Y] = tf(pts[0]); x.moveTo(X, Y);
    for (let i = 1; i < pts.length; i++) {
      if (cum[i] <= hasta) { [X, Y] = tf(pts[i]); x.lineTo(X, Y); }
      else { const t = (hasta - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), a = tf(pts[i - 1]), b = tf(pts[i]); X = a[0] + (b[0] - a[0]) * t; Y = a[1] + (b[1] - a[1]) * t; x.lineTo(X, Y); break; }
    }
    return [X, Y];
  }

  /* Dibuja una figura.
     o: { x, y, tam (ancho en unidades de diseno), modo:'luz'|'solido'|'linea', progreso 0..1, rot, espejo,
          escalonado (0..1: cuanto se solapan las partes al dibujarse una tras otra), brillo (intensidad), grosor,
          color (fuerza un color en vez del real), alfa,
          t (segundos, para animar efectos), pulso:{f,a} (el brillo respira), chispas:N (motas de luz que flotan
          sobre las lineas ya dibujadas), semilla }
     Los haces se SUPERPONEN: en modo 'luz' la mezcla es aditiva, asi que donde se cruzan suman luz.
     Devuelve {punta:[x,y]|null, listo:bool}.                                                              */
  T.dibujar = function (esc, nombre, o) {
    const fig = T.figura(nombre), x = esc.ctx, modo = o.modo || 'luz', prog = o.progreso == null ? 1 : o.progreso;
    const [bx0, by0, bx1, by1] = fig.caja, anchoF = Math.max(bx1 - bx0, by1 - by0, 1), s = o.tam / 100 * (100 / anchoF) * 100 / 100;
    const esc_ = o.tam / anchoF, cx0 = (bx0 + bx1) / 2, cy0 = (by0 + by1) / 2, cr = Math.cos(o.rot || 0), sr = Math.sin(o.rot || 0), fx = o.espejo ? -1 : 1;
    const tf = (p) => { const dx = (p[0] - cx0) * esc_ * fx, dy = (p[1] - cy0) * esc_; return [o.x + dx * cr - dy * sr, o.y + dx * sr + dy * cr]; };
    const k = esc.k, lw = (o.grosor || 3.2) * k * Math.max(0.6, o.tam / 260);
    const partes = fig.partes.slice().sort((a, b) => a.orden - b.orden);
    const n = partes.length, sol = o.escalonado == null ? 0.35 : o.escalonado;
    const brillo = (o.brillo == null ? 1 : o.brillo) * (o.pulso ? 1 + o.pulso.a * Math.sin(2 * Math.PI * (o.t || 0) * o.pulso.f) : 1);
    const dur = 1 / (1 + (n - 1) * (1 - sol));             // fraccion del tiempo que dura cada parte
    let punta = null, hecho = prog >= 1;
    x.save(); x.globalAlpha *= (o.alfa == null ? 1 : o.alfa); x.lineJoin = 'round'; x.lineCap = 'round';
    if (modo === 'luz') x.globalCompositeOperation = 'lighter';
    partes.forEach((p, i) => {
      const ini = i * dur * (1 - sol), pp = prog >= 1 ? 1 : Math.max(0, Math.min(1, (prog - ini) / dur)); if (pp <= 0) return;   // prog>=1 fuerza 1: evita 0.9999999 por redondeo
      const hasta = p.total * pp, col = o.color || p.color;
      if (modo === 'luz') {
        const cl = VE.color.luz(col), cn = VE.color.nucleo(col), w = lw * p.ancho;
        const pasadas = [[w * 7, 0.05 * brillo, cl], [w * 3.6, 0.11 * brillo, cl], [w * 1.7, 0.30 * brillo, cl], [w * 0.8, 0.95 * brillo, cn]];
        for (const [ww, aa, cc] of pasadas) { x.lineWidth = ww; x.strokeStyle = VE.color.a(cc.startsWith('hsl') ? cc : cc, 1); x.globalAlpha = (o.alfa == null ? 1 : o.alfa) * aa; const e = trazar(x, p.pts, p.cum, hasta, tf); x.stroke(); if (ww === pasadas[3][0]) punta = e; }
        x.globalAlpha = o.alfa == null ? 1 : o.alfa;
      } else {
        const pts2 = p.pts.map(tf);
        if (modo === 'solido' && p.relleno && pp >= 1) {
          const ys = pts2.map(q => q[1]), g = x.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
          g.addColorStop(0, VE.color.claro(col, 0.22)); g.addColorStop(1, VE.color.oscuro(col, 0.22));
          x.beginPath(); pts2.forEach((q, j) => j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fillStyle = g; x.fill();
        }
        x.lineWidth = (modo === 'solido' ? 0.9 : 1.2) * lw * p.ancho; x.strokeStyle = modo === 'solido' ? VE.color.oscuro(col, 0.38) : VE.color.claro(col, 0.1);
        const e = trazar(x, p.pts, p.cum, hasta, tf); x.stroke(); punta = e;
      }
      if (pp < 1) hecho = false;
    });
    if (modo === 'luz' && o.chispas && prog > 0) {          // motas de luz: parpadean y suben desde lo ya dibujado
      const r = VE.rng((o.semilla || nombre) + ':ch'), t = o.t || 0, vis = partes.filter((p, i) => prog > i * dur * (1 - sol));
      for (let j = 0; j < o.chispas; j++) {
        const p = vis[Math.floor(r() * vis.length)] || partes[0], fr = r() * Math.min(1, prog * 1.4), ph = r(), vel = 0.25 + r() * 0.35;
        const idx = Math.min(p.pts.length - 1, Math.floor(fr * (p.pts.length - 1))), q = tf(p.pts[idx]);
        const edad = ((t * vel + ph) % 1), a = Math.sin(Math.PI * edad) ** 2 * brillo;
        if (a < 0.03) continue;
        x.globalAlpha = (o.alfa == null ? 1 : o.alfa) * a * 0.9;
        esc.pegar(esc.cache.halo(Math.round((9 + r() * 12) * k), VE.color.luz(o.color || p.color), 0.3), q[0] + Math.sin(ph * 40 + t) * 6 * k, q[1] - edad * 46 * k, 1);
      }
    }
    x.restore();
    const enCurso = prog > 0 && prog < 1 && punta;
    if (modo === 'luz' && enCurso && o.cabeza !== false) {   // la cabeza del haz: destello que recorre el trazo
      const cc = o.color || partes[Math.min(n - 1, Math.floor(prog * n))].color;
      x.save(); x.globalCompositeOperation = 'lighter'; esc.pegar(esc.cache.halo(Math.round(46 * k * Math.max(0.7, o.tam / 300)), VE.color.luz(cc), 0.25), punta[0], punta[1], 1); x.restore();
    }
    return { punta: enCurso ? punta : null, listo: hecho };
  };

  /* Polilinea de luz en coordenadas de pantalla (unidades de diseno). Mismas pasadas que las figuras.
     o: { color, progreso, grosor, brillo, alfa, cabeza }. Devuelve la punta del trazo o null. */
  T.polilinea = function (esc, pts, o) {
    const x = esc.ctx, prog = o.progreso == null ? 1 : o.progreso; if (prog <= 0 || pts.length < 2) return null;
    const cum = longitudes(pts), hasta = cum[cum.length - 1] * Math.min(1, prog), k = esc.k, w = (o.grosor || 2.6) * k, br = o.brillo == null ? 1 : o.brillo;
    const cl = VE.color.luz(o.color || '#ffffff'), cn = VE.color.nucleo(o.color || '#ffffff'), al = o.alfa == null ? 1 : o.alfa;
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineJoin = 'round'; x.lineCap = 'round'; let punta = null;
    for (const [ww, aa, cc] of [[w * 6, 0.05 * br, cl], [w * 3, 0.11 * br, cl], [w * 1.6, 0.30 * br, cl], [w * 0.8, 0.95 * br, cn]]) {
      x.lineWidth = ww; x.strokeStyle = cc; x.globalAlpha = al * aa; punta = trazar(x, pts, cum, hasta, p => p); x.stroke(); }
    x.restore();
    if (o.cabeza !== false && prog < 1) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = al;
      esc.pegar(esc.cache.halo(Math.round(34 * k), cl, 0.25), punta[0], punta[1], 1); x.restore(); }
    return prog < 1 ? punta : null;
  };

  /* Coordenadas de pantalla de un punto (en la caja 100x100 de la figura) cuando se dibuja con {x,y,tam}. Para anclar brillos a la anatomia, etc. */
  T.mapear = function (nombre, o, p) {
    const fig = T.figura(nombre), [bx0, by0, bx1, by1] = fig.caja, e = o.tam / Math.max(bx1 - bx0, by1 - by0, 1);
    return [o.x + (p[0] - (bx0 + bx1) / 2) * e, o.y + (p[1] - (by0 + by1) / 2) * e];
  };
  T.longitudTotal = (nombre) => T.figura(nombre).total;
  VE.trazo = T;
})(window.VE = window.VE || {});
