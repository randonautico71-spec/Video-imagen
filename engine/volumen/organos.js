/* VOLUMEN — ORGANOS: higado (sano / enfermo, entero o por trozos con cara de corte), vesicula, cuerpo holograma (rayos X) y celula que se divide.
     V.modelos.higado({desde, hasta, estado:'sano'|'enfermo', vesicula, pos, rot, esc})
         largo 2 en X, lobulo derecho del paciente hacia -X (visto de frente desde +Z), cara anterior hacia +Z, arriba +Y.
         desde/hasta = tramo 0..1 medido desde la punta izquierda (0) hasta el extremo derecho (1): {0, 0.55} deja el resto, {0.55, 1} el trozo cortado
         (con cara de corte pintada). V.modelos.higado.corteX(s) = coordenada X local del plano de corte s.
     V.modelos.cuerpo_holograma({pose, color})   maniqui en estilo rayos X (todo su material pasa a 'rayosx'); V.modelos.cuerpo_holograma.higado = {pos, esc, rot} donde va el higado dentro.
     V.modelos.celula({dividir 0..1, pos, rot, esc})  hepatocito traslucido con nucleo; dividir = mitosis (1 = dos celulas). */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2;
  const sm = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  const NP = 30;
  const env = (s) => s < 0.12 ? Math.sqrt(Math.max(0, 1 - Math.pow((0.12 - s) / 0.12, 2))) : s > 0.8 ? Math.pow(Math.max(0, 1 - Math.pow((s - 0.8) / 0.2, 2.2)), 0.5) : 1;

  /* seccion cerrada del higado en s (0 punta izquierda .. 1 extremo derecho); el lobulo derecho queda en -X */
  function seccion(s, est) {
    const e = env(s), hy = e * (0.07 + 0.47 * sm(0, 0.62, s)) * (1 + 0.07 * Math.sin(s * 9 + 0.6)), wz = e * (0.34 + 0.30 * sm(0, 0.5, s));
    const dn = 0.09 * Math.exp(-Math.pow((s - 0.36) / 0.035, 2));                       // surco del ligamento falciforme
    const x = 1 - 2 * s, pts = [];
    for (let k = 0; k < NP; k++) {
      const a = TAU * k / NP, ca = Math.cos(a), sa = Math.sin(a);
      let r = 1; if (est === 'enfermo') r += 0.045 * Math.sin(a * 9 + s * 40) * Math.sin(a * 5 - s * 23);   // nodulos de cirrosis
      const y = (sa > 0 ? sa * hy - dn * sa : sa * hy * 0.5) * r + (sa < 0 ? 0.04 * e * (1 - Math.abs(ca)) : 0);   // cara inferior mas plana y algo hundida
      pts.push([x, y, wz * ca * r]);
    }
    return pts;
  }
  const mallaPiel = (d, h, est) => {
    const n = Math.max(6, Math.round(46 * (h - d))), sec = [];
    for (let i = 0; i <= n; i++) sec.push(seccion(d + (h - d) * i / n, est));
    return MA.loft(sec, 'higado|' + est + '|' + d.toFixed(3) + '|' + h.toFixed(3), { tapas: false });
  };
  const mallaCorte = (s, dir, est) => {                                                   // losa fina que cierra la cara de corte
    const a = seccion(s, est), b = a.map(p => [p[0] + dir * 0.006, p[1], p[2]]);
    return MA.loft([a, b], 'higado|corte|' + est + '|' + s.toFixed(3) + '|' + dir);
  };

  const texHigado = (est) => V.textura('higado|piel|' + est, 512, 256, (x, W, H) => {
    const r = VE.rng('higado' + est), sano = est !== 'enfermo';
    const g = x.createLinearGradient(0, 0, 0, H); if (sano) { g.addColorStop(0, '#8a2f22'); g.addColorStop(0.5, '#7a281d'); g.addColorStop(1, '#6a2219'); } else { g.addColorStop(0, '#85602b'); g.addColorStop(0.5, '#6f5127'); g.addColorStop(1, '#5a4222'); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 320; i++) { const cx = r() * W, cy = r() * H, rr = 8 + r() * 36, gr = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      const c = sano ? (r() < 0.5 ? '176,70,52' : '70,20,16') : (r() < 0.5 ? '176,142,78' : '60,44,22'); gr.addColorStop(0, `rgba(${c},${0.10 + r() * 0.16})`); gr.addColorStop(1, `rgba(${c},0)`); x.fillStyle = gr; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
    x.lineCap = 'round'; for (let i = 0; i < 90; i++) { x.strokeStyle = sano ? `rgba(70,16,12,${0.15 + r() * 0.2})` : `rgba(40,30,14,${0.15 + r() * 0.2})`; x.lineWidth = 0.8 + r() * 1.4; const x0 = r() * W, y0 = r() * H; x.beginPath(); x.moveTo(x0, y0); x.bezierCurveTo(x0 + (r() - 0.5) * 90, y0 + (r() - 0.5) * 50, x0 + (r() - 0.5) * 120, y0 + (r() - 0.5) * 70, x0 + (r() - 0.5) * 150, y0 + (r() - 0.5) * 80); x.stroke(); }
    if (!sano) for (let i = 0; i < 520; i++) { const cx = r() * W, cy = r() * H, rr = 3 + r() * 7; x.fillStyle = `rgba(${r() < 0.5 ? '196,164,92' : '52,38,18'},${0.22 + r() * 0.25})`; x.beginPath(); x.arc(cx, cy, rr, 0, TAU); x.fill(); }
  });
  const texCorte = (est) => V.textura('higado|corte|' + est, 256, 256, (x, W, H) => {
    const r = VE.rng('corte' + est), sano = est !== 'enfermo'; x.fillStyle = sano ? '#b4493a' : '#a08049'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { const cx = r() * W, cy = r() * H, rr = 4 + r() * 12; x.fillStyle = `rgba(${sano ? '120,30,24' : '84,62,30'},${0.10 + r() * 0.16})`; x.beginPath(); x.arc(cx, cy, rr, 0, TAU); x.fill(); }
    for (let i = 0; i < 26; i++) { const cx = r() * W, cy = r() * H; x.fillStyle = 'rgba(240,208,196,0.55)'; x.beginPath(); x.arc(cx, cy, 2 + r() * 4, 0, TAU); x.fill(); }   // vasos cortados
  });

  MO.higado = function (o = {}) {
    const d = o.desde == null ? 0 : o.desde, h = o.hasta == null ? 1 : o.hasta, est = o.estado || 'sano', sano = est !== 'enfermo';
    const mPiel = { color: '#ffffff', mapa: texHigado(est), esp: sano ? 0.75 : 0.3, dureza: sano ? 55 : 24, envolver: 0.4, borde: 0.35 };
    const mCorte = { color: '#ffffff', mapa: texCorte(est), esp: 0.35, dureza: 26, envolver: 0.45, borde: 0.3 };
    const hijos = [V.nodo({ malla: mallaPiel(d, h, est), mat: Object.assign({ dobleCara: true }, mPiel) })];
    if (d > 0.005) hijos.push(V.nodo({ malla: mallaCorte(d, +1, est), mat: mCorte }));
    if (h < 0.995) hijos.push(V.nodo({ malla: mallaCorte(h, -1, est), mat: mCorte }));
    if (o.vesicula !== false && d <= 0.66 && h >= 0.76) {
      const perfil = [[0, 0], [0.05, -0.02], [0.075, -0.1], [0.07, -0.2], [0.045, -0.28], [0.014, -0.33], [0, -0.34]];
      hijos.push(V.nodo({ malla: MA.torno(perfil, 24, 'higado|vesicula'), pos: [-0.46, -0.13, 0.30], rot: [0.5, 0, 0.18], mat: { color: sano ? '#5d7a2c' : '#6b6a24', esp: 0.7, dureza: 48, envolver: 0.4, borde: 0.3 } }));
    }
    return V.nodo({ nombre: 'higado', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };
  MO.higado.corteX = (s) => 1 - 2 * s;

  /* ================================================================== CUERPO HOLOGRAMA (maniqui en rayos X) */
  const holo = (n, col) => { const c = Object.assign({}, n); if (c.mat || c.malla) c.mat = { tipo: 'rayosx', color: col }; c.sinSombra = true; if (n.hijos) c.hijos = n.hijos.map(h => holo(h, col)); return c; };
  MO.cuerpo_holograma = function (o = {}) {
    const m = MO.maniqui({ pose: o.pose || 'de_pie' });
    return V.nodo({ nombre: 'cuerpo_holograma', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [holo(m, o.color || '#7fc4ff')] });
  };
  /* donde va el higado (escala 0.1 y rot Y = PI/2) en el maniqui de pie, lobulo derecho hacia +Z */
  MO.cuerpo_holograma.higado = { pos: [0.03, 0.27, 0.05], esc: 0.1, rot: [0, PI / 2, 0.0] };

  /* ================================================================== CELULA (hepatocito en mitosis) */
  MO.celula = function (o = {}) {
    const t = Math.max(0, Math.min(1, Math.round((o.dividir || 0) * 24) / 24)), R = 0.55 - 0.05 * t, sep = 0.12 + 1.8 * t, sepR = sep * 0.5;
    const perfil = (c1, c2) => { const p = [], y0 = Math.max(c1, c2) + R; for (let i = 0; i <= 48; i++) { const y = y0 - (y0 - (Math.min(c1, c2) - R)) * i / 48; const r1 = Math.sqrt(Math.max(0, R * R - (y - c1) * (y - c1))), r2 = Math.sqrt(Math.max(0, R * R - (y - c2) * (y - c2))); p.push([Math.max(r1, r2), y]); } p[0][0] = 0; p[p.length - 1][0] = 0; return p; };
    const separadas = sep > 2 * R * 0.97, mem = { color: '#e0907a', esp: 0.8, dureza: 50, alfa: 0.55, envolver: 0.5, borde: 0.35 }, nuc = { color: '#6d3472', esp: 0.5, dureza: 30, envolver: 0.4 };
    const hijos = [];
    if (separadas) for (const c of [-sepR, sepR]) hijos.push(V.nodo({ malla: MA.esfera(32), esc: R, pos: [0, c, 0], mat: mem }));
    else hijos.push(V.nodo({ malla: MA.torno(perfil(-sepR, sepR), 40, 'celula|' + t.toFixed(3)), mat: mem }));
    const nucs = t < 0.3 ? [0] : [-sepR, sepR];
    for (const c of nucs) hijos.push(V.nodo({ malla: MA.esfera(24), esc: t < 0.3 ? 0.24 : 0.2, pos: [0.05, c, 0.03], mat: nuc }));
    return V.nodo({ nombre: 'celula', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };
})(VE);
