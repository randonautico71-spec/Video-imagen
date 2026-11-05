/* Modelos para «¿Cuándo perdimos la cola?»: cola, embrion, mono/simio, columna (con coxis), helice de ADN, raton, sacro fosil.
   Convencion: miran a +X, arriba +Y. V.modelos.cola({largo, curva, grosor, color, t, id}) · embrion({t, cola}) · mono({tipo:'macaco'|'simio', cola, fase, id}) ·
   columna({coxis, resalta}) · helice({n, t, salto, hueco}) · raton({cola, fase}) · sacro({cola}). */
(function (VE) {
  'use strict';
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, sn = Math.sin, cs = Math.cos;
  const c01 = (v) => Math.max(0, Math.min(1, v)), mez = (a, b, p) => a + (b - a) * p;
  const mt = (mapa, extra) => Object.assign({ color: '#ffffff', mapa, esp: 0.05, dureza: 10, envolver: 0.4, borde: 0.2 }, extra || {});
  const liso = (c, e) => Object.assign({ color: c, esp: 0.35, dureza: 40, envolver: 0.2 }, e || {});
  const elip = (mat, e3, pos, rot) => V.nodo({ malla: MA.esfera(28), esc: e3, pos: pos || [0, 0, 0], rot, mat });
  const eje = (a, b, c, pos, mat, rot) => V.nodo({ malla: MA.esfera(32), esc: [a, b, c], pos, rot: rot || [0, 0, PI / 2], mat });
  const fibras = (x, W, H, n, cols, len, sem, a0 = 0.07, a1 = 0.22, ancho = 1.2) => { const r = VE.rng(sem); x.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, l = len * (0.5 + r()); x.globalAlpha = a0 + r() * (a1 - a0); x.strokeStyle = cols[Math.floor(r() * cols.length)]; x.lineWidth = ancho * (0.6 + r());
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 3, y0 + l); x.stroke(); } x.globalAlpha = 1; };
  const pelaje = (nom, base, claro, oscuro) => V.textura('cola|' + nom, 256, 256, (x, W, H) => { x.fillStyle = base; x.fillRect(0, 0, W, H); fibras(x, W, H, 2600, [claro, oscuro, base], 14, nom, 0.1, 0.35, 1.3); });
  const piel = (nom, base, a, b) => V.textura('cola|' + nom, 128, 128, (x, W, H) => { x.fillStyle = base; x.fillRect(0, 0, W, H); fibras(x, W, H, 500, [a, b], 5, nom, 0.05, 0.14, 1); });

  /* Cola: tubo que parte del origen hacia -X y se curva hacia arriba. largo en m; 'curva' en radianes totales; 'lat' = oscilacion lateral. */
  const colaPts = (largo, curva, t, n = 14, lat = 0.12, dir = -1) => { const pts = [[0, 0, 0]]; let a = 0.15, x = 0, y = 0, z = 0; const dl = largo / (n - 1);
    for (let i = 1; i < n; i++) { const s = i / (n - 1); a = 0.15 + curva * Math.pow(s, 1.25); x += dir * cs(a) * dl; y += sn(a) * dl; z = lat * largo * sn(t * 2.2 - s * 4) * s; pts.push([x, y, z]); } return pts; };
  MO.cola = function (o = {}) {
    const largo = o.largo == null ? 0.5 : o.largo; if (largo < 0.02) return V.nodo({ nombre: 'cola', pos: o.pos, rot: o.rot, esc: o.esc });
    const pts = colaPts(largo, o.curva == null ? 1.6 : o.curva, o.t || 0, 14, o.lat == null ? 0.1 : o.lat), g = o.grosor || 0.04;
    const mat = o.mapa ? mt(o.mapa, { esp: 0.1, envolver: 0.5 }) : liso(o.color || '#6e4a2f', { esp: 0.15, envolver: 0.5 });
    const fin = pts[pts.length - 1];
    return V.nodo({ nombre: 'cola', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ malla: MA.tubo(pts, (u) => g * (1 - 0.7 * u) + 0.004, 10, { dinamica: 'cola_' + (o.id || 'x') }), mat }), elip(mat, [g * 0.35, g * 0.35, g * 0.35], fin)] });
  };

  /* Embrion humano estilizado (C), cabeza grande, cola que se encoge con o.cola 1->0 */
  MO.embrion = function (o = {}) {
    const t = o.t || 0, cola = o.cola == null ? 1 : o.cola, mS = mt(piel('emb', '#e8a58f', '#c97d6a', '#f4c2ae'), { esp: 0.35, dureza: 30, envolver: 0.6, emision: 0.08 });
    const cuerpo = []; const pts = []; for (let i = 0; i < 12; i++) { const s = i / 11, a = mez(2.3, -0.5, s); pts.push([0.32 * cs(a) - 0.15, 0.32 * sn(a), 0]); }
    cuerpo.push(V.nodo({ malla: MA.tubo(pts, (u) => 0.12 * (1 - 0.55 * u) + 0.04, 14, { clave: 'embrion|c' }), mat: mS }));
    cuerpo.push(elip(mS, [0.25, 0.23, 0.22], [-0.37, 0.28, 0]), elip(liso('#2b1713', { esp: 0.8, dureza: 80 }), [0.025, 0.025, 0.02], [-0.5, 0.33, 0.17]), elip(liso('#2b1713', { esp: 0.8, dureza: 80 }), [0.025, 0.025, 0.02], [-0.5, 0.33, -0.17]));
    cuerpo.push(V.nodo({ pos: [-0.2, 0.1, 0.13], rot: [0, 0, 0.6], hijos: [V.nodo({ malla: MA.capsula(0.025, 0.02, 0.16, 12), mat: mS })] }), V.nodo({ pos: [-0.2, 0.1, -0.13], rot: [0, 0, 0.6], hijos: [V.nodo({ malla: MA.capsula(0.025, 0.02, 0.16, 12), mat: mS })] }));
    const raiz = pts[pts.length - 1], tp = [raiz]; const L = 0.45 * cola; if (L > 0.03) { let a = -0.5, x = raiz[0], y = raiz[1]; for (let i = 1; i < 8; i++) { a -= 0.28; x += cs(a) * L / 7; y += sn(a) * L / 7; tp.push([x, y, 0.03 * sn(t * 3 + i)]); }
      cuerpo.push(V.nodo({ malla: MA.tubo(tp, (u) => 0.045 * (1 - u * 0.8) + 0.006, 10, { dinamica: 'emb_cola' }), mat: mS })); }
    return V.nodo({ nombre: 'embrion', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ rot: [0, 0, 0.1 * sn(t)], hijos: cuerpo })] });
  };

  /* Primates (cuadrupedo). tipo 'macaco' (pequeno, cola larga) o 'simio' (corpulento, brazos largos, sin cola). */
  MO.mono = function (o = {}) {
    const tipo = o.tipo || 'macaco', sim = tipo === 'simio', ph = (o.fase || 0) * 2 * PI, t = o.t || 0, id = o.id || tipo;
    const mP = mt(pelaje('pel_' + tipo, sim ? '#2d241d' : '#7a6246', sim ? '#4a3a2e' : '#a58b66', sim ? '#15100c' : '#4b3a28'), { esp: 0.05, dureza: 8, envolver: 0.55, borde: 0.15 });
    const mC = mt(piel('cara_' + tipo, sim ? '#5b4636' : '#d19a87', sim ? '#3c2c20' : '#b87b69', sim ? '#76604c' : '#e8b8a6'), { esp: 0.2, dureza: 20, envolver: 0.5 });
    const k = sim ? 1.35 : 1, A = (f, amp) => amp * sn(f);
    const pata = (x, z, f, brazo) => { const a = A(f, 0.42), L = (brazo && sim ? 0.36 : 0.3) * k; return V.nodo({ pos: [x * k, 0.4 * k, z * k], rot: [0, 0, a], hijos: [elip(mP, [0.07 * k, 0.09 * k, 0.065 * k], [0, 0, 0]), V.nodo({ pos: [0, -L / 2, 0], malla: MA.capsula(0.055 * k, 0.04 * k, L, 14), mat: mP }),
      V.nodo({ pos: [0, -L, 0], rot: [0, 0, -a * 0.8], hijos: [elip(mC, [0.07 * k, 0.03 * k, 0.045 * k], [0.04 * k, -0.02 * k, 0])] })] }); };
    const ojo = (s) => V.nodo({ pos: [0.11 * k, 0.04 * k, s * 0.055 * k], hijos: [elip(liso('#f4efe6', { esp: 0.4 }), [0.022 * k, 0.02 * k, 0.018 * k]), elip(liso('#2a170c', { esp: 0.9, dureza: 90 }), [0.014 * k, 0.014 * k, 0.012 * k], [0.008 * k, 0, s * 0.004 * k])] });
    const oreja = (s) => elip(mC, [0.018 * k, 0.04 * k, 0.03 * k], [-0.02 * k, 0.03 * k, s * 0.1 * k]);
    const cabeza = V.nodo({ pos: [0.36 * k, (sim ? 0.55 : 0.52) * k, 0], rot: [0, 0, -0.15 + 0.05 * sn(ph)], hijos: [
      elip(mP, [0.1 * k, 0.1 * k, 0.1 * k], [0, 0.01 * k, 0]), elip(mC, [0.075 * k, 0.07 * k, 0.085 * k], [0.065 * k, -0.01 * k, 0]), elip(mC, [0.055 * k, 0.04 * k, 0.065 * k], [0.12 * k, -0.04 * k, 0]),
      elip(liso('#1e1511', { esp: 0.3 }), [0.012 * k, 0.01 * k, 0.012 * k], [0.168 * k, -0.025 * k, 0.018 * k]), elip(liso('#1e1511', { esp: 0.3 }), [0.012 * k, 0.01 * k, 0.012 * k], [0.168 * k, -0.025 * k, -0.018 * k]),
      elip(liso('#6c3a33'), [0.03 * k, 0.006 * k, 0.045 * k], [0.14 * k, -0.07 * k, 0]), elip(mP, [0.1 * k, 0.045 * k, 0.1 * k], [-0.01 * k, 0.07 * k, 0]), ojo(1), ojo(-1), oreja(1), oreja(-1)] });
    const hijos = [eje(0.16 * k, 0.34 * k, 0.15 * k, [0, 0.45 * k, 0], mP, [0, 0, PI / 2 - (sim ? 0.25 : 0.1)]), elip(mP, [0.17 * k, 0.15 * k, 0.16 * k], [-0.14 * k, 0.43 * k, 0]), elip(mP, [0.15 * k, 0.15 * k, 0.17 * k], [0.15 * k, 0.5 * k, 0]),
      pata(0.14, 0.12, ph, true), pata(0.14, -0.12, ph + PI, true), pata(-0.16, 0.12, ph + PI, false), pata(-0.16, -0.12, ph, false), cabeza];
    if (!sim && o.cola !== 0) hijos.push(MO.cola({ pos: [-0.22 * k, 0.5 * k, 0], largo: (o.cola == null ? 1 : o.cola) * 0.85, curva: 2.0, grosor: 0.035, mapa: pelaje('pel_' + tipo, '#7a6246', '#a58b66', '#4b3a28'), t, id }));
    if (sim && o.cola) hijos.push(MO.cola({ pos: [-0.22 * k, 0.5 * k, 0], largo: o.cola * 0.8, curva: 1.4, grosor: 0.04, color: '#2d241d', t, id }));
    return V.nodo({ nombre: 'mono_' + tipo, pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ pos: [0, 0.015 * sn(2 * ph), 0], hijos })] });
  };
  MO.mono.cola = (o = {}) => { const e = o.esc || 1, p = o.pos || [0, 0, 0], k = o.tipo === 'simio' ? 1.35 : 1; return [p[0] - 0.22 * k * e, p[1] + 0.5 * k * e, p[2]]; };

  /* Columna vertebral humana: cervicales, toracicas, lumbares, sacro y coxis (4 piezas pequenas). Eje en +Y (cabeza arriba). o.coxis resalta (0-1). */
  MO.columna = function (o = {}) {
    const hueso = V.textura('cola|hueso', 128, 128, (x, W, H) => { x.fillStyle = '#e7dcc0'; x.fillRect(0, 0, W, H); const r = VE.rng('col|hueso'); for (let i = 0; i < 300; i++) { x.globalAlpha = 0.08 + r() * 0.12; x.fillStyle = ['#a8926a', '#f7efd8'][i % 2]; x.beginPath(); x.arc(r() * W, r() * H, 1 + r() * 4, 0, 7); x.fill(); } x.globalAlpha = 1; });
    const mH = mt(hueso, { esp: 0.2, dureza: 25, envolver: 0.45 }), res = c01(o.coxis || 0), mR = liso('#ff6a2b', { esp: 0.3, emision: 0.5 + 0.5 * res, envolver: 0.3 }), disco = liso('#7fa7b8', { esp: 0.3 });
    const h = [], N = 24; let y = 0;
    for (let i = 0; i < N; i++) { const s = i / (N - 1), curv = 0.07 * sn(s * PI * 2.2 + 0.4), r = mez(0.034, 0.062, Math.pow(s, 0.7)), z = curv;
      h.push(V.nodo({ pos: [0.0, -y, z], hijos: [V.nodo({ malla: MA.cilindro(r, r, 0.03, 18), mat: mH }), V.nodo({ malla: MA.caja(0.012, 0.018, 0.075 + r * 0.6, 0.004), pos: [-r - 0.012, 0.0, 0], mat: mH }), V.nodo({ malla: MA.cilindro(r * 0.95, r * 0.95, 0.012, 18), pos: [0, -0.02, 0], mat: disco })] })); y += 0.04 + 0.002 * i; }
    h.push(V.nodo({ pos: [0, -y - 0.07, 0.05], rot: [0.35, 0, 0], malla: MA.caja(0.15, 0.17, 0.05, 0.02), mat: mH }), V.nodo({ pos: [0.0, -y - 0.12, 0.02], hijos: [elip(mH, [0.1, 0.045, 0.11], [0.0, 0.07, -0.0]), elip(mH, [0.1, 0.03, 0.04], [0, 0.0, 0.02])] }));
    let yc = y + 0.2, zc = 0.075; const coxN = 4;
    for (let i = 0; i < coxN; i++) { const r = 0.026 * (1 - i * 0.18); h.push(V.nodo({ malla: MA.esfera(16), esc: [r, r * 0.8, r], pos: [0, -yc, zc], mat: res > 0 ? mR : mH })); yc += 0.034 * (1 - i * 0.1); zc += 0.012 + 0.016 * i; }
    return V.nodo({ nombre: 'columna', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };
  MO.columna.coxis = (o = {}) => { const e = o.esc || 1, p = o.pos || [0, 0, 0]; return [p[0], p[1] - 1.16 * e, p[2] + 0.12 * e]; };

  /* Helice de ADN. n pares, avanza en Y. o.t gira. o.salto 0..1: un fragmento naranja (AluY) se acerca y se inserta en el tramo central. */
  MO.helice = function (o = {}) {
    const n = o.n || 22, t = o.t || 0, salto = c01(o.salto || 0), h = [], cA = liso('#3fa7ff', { esp: 0.5, dureza: 60, emision: 0.15 }), cB = liso('#ff5aa8', { esp: 0.5, dureza: 60, emision: 0.15 }), cR = liso('#e8eef5', { esp: 0.3 });
    const col = ['#ffd24a', '#6cf0a8', '#ffffff', '#c58bff'];
    const mid = Math.floor(n / 2);
    for (let i = 0; i < n; i++) { const a = i * 0.55 + t, y = (i - n / 2) * 0.12, r = 0.2, ins = i >= mid - 2 && i <= mid + 2, ap = ins ? salto : 0;
      const p1 = [r * cs(a), y, r * sn(a)], p2 = [-r * cs(a), y, -r * sn(a)];
      h.push(elip(cA, [0.05, 0.05, 0.05], p1), elip(cB, [0.05, 0.05, 0.05], p2), V.nodo({ pos: [0, y, 0], rot: [0, -a, PI / 2], malla: MA.cilindro(0.012, 0.012, 2 * r, 8), mat: liso(col[i % 4], { esp: 0.4, emision: 0.2 }) }));
      if (ins) { const bx = [(1 - ap) * 0.9 + 0, 0, 0]; h.push(V.nodo({ pos: [0, y, 0], rot: [0, -a, 0], hijos: [V.nodo({ pos: [0, 0, 0], malla: MA.caja(2 * r + 0.05, 0.1, 0.05, 0.02), mat: liso('#ff7a1a', { emision: 0.7, esp: 0.4 }), esc: [1, 1, 1] })] })); }
    }
    if (o.salto != null && salto < 1) { /* el fragmento en vuelo */ const p = 1 - salto; h.push(V.nodo({ pos: [mez(0, 1.2, p * p), mez(0, 0.5, p), mez(0, 0.8, p)], rot: [p * 3, p * 2, 0], hijos: [V.nodo({ malla: MA.caja(0.35, 0.12, 0.12, 0.04), mat: liso('#ff7a1a', { emision: 0.9, esp: 0.5 }) })] })); }
    return V.nodo({ nombre: 'helice', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  /* Raton de laboratorio (blanco/gris), cola opcional (o.cola 0-1) */
  MO.raton = function (o = {}) {
    const ph = (o.fase || 0) * 2 * PI, t = o.t || 0, mP = mt(pelaje('raton', '#cfc7bb', '#f3eee6', '#9f978b'), { esp: 0.08, envolver: 0.55 }), rosa = liso('#e8a8a6', { esp: 0.3, envolver: 0.4 }), id = o.id || 'r';
    const pata = (x, z, f) => V.nodo({ pos: [x, 0.06, z], rot: [0, 0, 0.5 * sn(f)], hijos: [V.nodo({ pos: [0, -0.03, 0], malla: MA.capsula(0.014, 0.011, 0.07, 10), mat: mP }), elip(rosa, [0.025, 0.01, 0.02], [0.01, -0.07, 0])] });
    const hijos = [eje(0.07, 0.16, 0.075, [0, 0.11, 0], mP, [0, 0, PI / 2 - 0.05]), elip(mP, [0.07, 0.07, 0.07], [-0.1, 0.1, 0]),
      V.nodo({ pos: [0.16, 0.12, 0], hijos: [elip(mP, [0.055, 0.05, 0.05]), elip(mP, [0.05, 0.035, 0.035], [0.05, -0.012, 0]), elip(rosa, [0.011, 0.011, 0.011], [0.095, -0.006, 0]),
        elip(liso('#150d0b', { esp: 0.9, dureza: 100 }), [0.011, 0.012, 0.01], [0.03, 0.02, 0.042]), elip(liso('#150d0b', { esp: 0.9, dureza: 100 }), [0.011, 0.012, 0.01], [0.03, 0.02, -0.042]),
        elip(rosa, [0.012, 0.035, 0.035], [-0.015, 0.05, 0.04], [0.3, 0, 0]), elip(rosa, [0.012, 0.035, 0.035], [-0.015, 0.05, -0.04], [-0.3, 0, 0])] }),
      pata(0.08, 0.05, ph), pata(0.08, -0.05, ph + PI), pata(-0.08, 0.05, ph + PI), pata(-0.08, -0.05, ph)];
    const c = o.cola == null ? 1 : o.cola; if (c > 0.05) hijos.push(MO.cola({ pos: [-0.16, 0.1, 0], largo: 0.22 * c, curva: 0.9, grosor: 0.011, color: '#e0a9a4', t, id: 'rat' + id, lat: 0.2 }));
    else hijos.push(elip(mP, [0.025, 0.02, 0.025], [-0.17, 0.1, 0]));
    return V.nodo({ nombre: 'raton', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };

  /* Sacro fosil (hueso en la arena): cuerpo en cuña + alas iliacas; o.cola muestra el fantasma de la cola ausente (0-1) */
  MO.sacro = function (o = {}) {
    const tex = V.textura('cola|fosil', 256, 256, (x, W, H) => { x.fillStyle = '#b79c70'; x.fillRect(0, 0, W, H); const r = VE.rng('fosil'); for (let i = 0; i < 900; i++) { x.globalAlpha = 0.07 + r() * 0.16; x.fillStyle = ['#7a6240', '#d6bd8f', '#5b4630'][i % 3]; x.beginPath(); x.arc(r() * W, r() * H, 1 + r() * 7, 0, 7); x.fill(); } x.globalAlpha = 1; });
    const m = mt(tex, { esp: 0.1, dureza: 12, envolver: 0.45 }), h = [];
    h.push(V.nodo({ malla: MA.caja(0.16, 0.26, 0.18, 0.05), pos: [0, 0.12, 0], mat: m, rot: [0, 0, 0] }), V.nodo({ malla: MA.cilindro(0.075, 0.02, 0.22, 16), pos: [0.0, -0.1, 0], mat: m }));
    for (const s of [-1, 1]) h.push(elip(m, [0.05, 0.16, 0.2], [0.0, 0.2, s * 0.2], [s * 0.25, 0, 0]), elip(m, [0.03, 0.06, 0.05], [0.0, 0.0, s * 0.07]));
    const g = c01(o.cola || 0); if (g > 0) for (let i = 0; i < 5; i++) h.push(elip(liso('#8fd8ff', { esp: 0.5, emision: 0.9, alfa: 0.35 * g }), [0.04, 0.03, 0.04], [0, -0.26 - i * 0.07, 0]));
    return V.nodo({ nombre: 'sacro', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };
})(window.VE = window.VE || {});
