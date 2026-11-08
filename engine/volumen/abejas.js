/* VOLUMEN — ABEJAS Y COLMENA. Unidades: metros (modelos a escala libre; las escenas los agrandan).
     MO.abeja({ rol, t, esc, pos, rot, plano, aleteo, polen, ojos, id })
          rol: 'obrera' | 'reina' | 'forrajera' (con bolsas de polen). Cabeza hacia +X, vientre hacia -Y. Largo total = 1 (x esc).
          plano:true -> la abeja se pega a una pared que mira a +Z (un panal): rot = [0, 0, angulo en el plano]; el vientre queda hacia el panal.
          aleteo 0..1 (amplitud del ala; ~ 0 = quieta).  ojos:true -> ojos compuestos (planos cercanos).
     MO.panal({ ancho, alto, tipo, semilla })     pared de celdas hexagonales (textura pintada una vez): miel operculada arriba, polen, cria abajo.
          tipo: 'mixto' | 'cria' | 'miel' | 'nuevo' (cera clara con celdas vacias, recien construida).  Cara hacia +Z.
     MO.celdas({ filas, cols, r, prof, nombre })  parche 3D de celdas (tubos hexagonales abiertos) para primeros planos; cara hacia +Z.
          Contenido 3D: MO.huevo3d, MO.larva3d, MO.tapa3d (opérculo), MO.pupa3d (para celdas del parche).
     MO.colmena({ alfaCaja, corte, pos, rot, esc })   colmena de cajas (2 alzas + tapa + piquera + tablilla); corte:true -> sin pared frontal y marcos a la vista.
     MO.flor({ pos, esc, color }) */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, nodo = V.nodo, M = V.m4;
  const c01 = (v) => Math.max(0, Math.min(1, v));

  /* ---------- texturas ---------- */
  const texAbdomen = (rol) => V.textura('abeja|abd|' + rol, 256, 64, (x, W, H) => {
    const reina = rol === 'reina', c1 = reina ? '#d28a22' : '#d9962a', c2 = reina ? '#a8631a' : '#2c1a0c'; const r = VE.rng('abd' + rol);
    for (let i = 0; i < 7; i++) { x.fillStyle = i % 2 ? c2 : c1; if (reina && i % 2) x.fillStyle = '#b4701c'; x.fillRect(W * i / 7, 0, W / 7 + 1, H); }
    for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(255,230,170,${0.04 + r() * 0.08})`; x.fillRect(r() * W, r() * H, 3, 1); }
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); x.fillStyle = g; x.fillRect(0, 0, W, H); });

  /* ---------- mallas de abeja (largo total 1) ---------- */
  const mallaDura = () => MA.cache('abeja|dura', () => {
    const partes = [], S = (r) => MA.esfera(12), cil = MA.cilindro(0.012, 0.006, 1, 5, false);
    partes.push({ malla: MA.esfera(14), m: M.mul(M.tras(0.1, 0.02, 0), M.esc(0.19, 0.17, 0.17)) });                                  // torax peludo
    partes.push({ malla: MA.esfera(12), m: M.mul(M.tras(0.31, 0.0, 0), M.esc(0.1, 0.095, 0.105)) });                                  // cabeza
    for (const z of [-1, 1]) {
      partes.push({ malla: cil, m: M.mul(M.tras(0.4, 0.07, z * 0.03), M.mul(M.rotZ(-1.1), M.mul(M.rotX(z * 0.5), M.esc(1, 0.2, 1)))) });   // antenas
      for (const [lx, ang] of [[0.17, -0.25], [0.09, 0.0], [0.0, 0.3]]) partes.push({ malla: cil, m: M.mul(M.tras(lx, -0.04, z * 0.07), M.mul(M.rotX(z * 0.9), M.mul(M.rotZ(ang), M.esc(1, 0.22, 1)))) }); // patas
    }
    return MA.fusionar(partes, 'abeja|dura');
  });
  const mallaOjos = () => MA.cache('abeja|ojos', () => MA.fusionar([-1, 1].map(z => ({ malla: MA.esfera(10), m: M.mul(M.tras(0.33, 0.02, z * 0.062), M.esc(0.05, 0.058, 0.04)) })), 'abeja|ojos'));
  const mallaAbd = (largo) => MA.parametrica(26, 14, (u, v) => { const x = -0.04 - u * largo, r = 0.17 * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(0.999, u * 0.92 + 0.08), 0.85)), 0.7) * (1 - 0.35 * u * u), ph = v * TAU; return [x, Math.sin(ph) * r * 0.95 - 0.015, Math.cos(ph) * r]; }, { clave: 'abeja|abd|' + largo.toFixed(2) });
  const ala = () => MA.cache('abeja|alaf', () => { // elipse plana en XZ: largo (z) 0.42, ancho (x) 0.15
    const pos = [], nor = [], uv = [], idx = [], N = 14; pos.push(0, 0, 0.0); nor.push(0, 1, 0); uv.push(0.5, 0.5);
    for (let i = 0; i <= N; i++) { const a = i / N * TAU, x = -0.08 + Math.cos(a) * 0.075, z = 0.21 + Math.sin(a) * 0.21; pos.push(x, 0, z); nor.push(0, 1, 0); uv.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5); }
    for (let i = 1; i <= N; i++) idx.push(0, i, i + 1);
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint16Array(idx) }; });

  MO.abeja = (o = {}) => {
    const rol = o.rol || 'obrera', L = o.esc == null ? 1 : o.esc, t = o.t || 0, id = o.id || 0, fase = id * 1.7;
    const largo = rol === 'reina' ? 0.95 : 0.52, ale = c01(o.aleteo == null ? 0 : o.aleteo);
    const flap = ale > 0.02 ? Math.sin(t * 60 + fase) * 0.55 * ale : 0, base = 0.25 + 0.35 * (1 - ale);                // alas plegadas atras si no aletea
    const matD = { color: '#4a2f16', esp: 0.2, dureza: 18, envolver: 0.55, borde: 0.4 }, matA = { color: '#ffffff', mapa: texAbdomen(rol === 'reina' ? 'reina' : 'obrera'), esp: 0.3, dureza: 24, envolver: 0.4, borde: 0.4 };
    const matAla = { color: '#eef5ff', alfa: 0.4, esp: 0.6, dureza: 60, envolver: 0.5, dobleCara: true, tipo: 'plano' };
    const sh = 0.025 * Math.sin(t * 9 + fase) * (1 - ale);                                                           // el abdomen se mueve al respirar
    const hijos = [nodo({ malla: mallaDura(), mat: matD }), nodo({ malla: mallaAbd(largo), mat: matA, rot: [0, 0, sh] })];
    const elev = 0.18 + 0.82 * ale + flap, barr = 1.35 - 0.95 * ale;
    for (const z of [-1, 1]) hijos.push(nodo({ malla: ala(), mat: matAla, pos: [0.12, 0.1, z * 0.04], rot: [-z * elev, -z * barr, 0], esc: [1, 1, z], sinSombra: true }));
    if (o.ojos) hijos.push(nodo({ malla: mallaOjos(), mat: { color: '#14100c', esp: 0.8, dureza: 90, envolver: 0.2, tipo: 'brillo' } }));
    if (rol === 'forrajera' || o.polen) for (const z of [-1, 1]) hijos.push(nodo({ malla: MA.esfera(8), pos: [-0.05, -0.11, z * 0.14], esc: [0.07, 0.06, 0.045], mat: { color: '#f0a020', esp: 0.2, dureza: 15, envolver: 0.5 } }));
    const cuerpo = nodo({ rot: o.plano ? [PI / 2, 0, 0] : [0, 0, 0], esc: L, hijos });
    return nodo({ pos: o.pos, rot: o.rot || [0, 0, 0], esc: o.escG, alfa: o.alfa, nombre: o.nombre, hijos: [cuerpo] });
  };

  /* ---------- panal pintado ---------- */
  const hexTex = (clave, W, H, cols, tipo, semilla) => V.textura(clave, W, H, (x, Wt, Ht) => {
    const rn = VE.rng('panal' + semilla), ch = Ht / (cols * 0.866 * 1.15), rows = Math.ceil(Ht / (Wt / cols * 0.866)) + 1, cw = Wt / cols;
    const fondo = x.createLinearGradient(0, 0, 0, Ht); fondo.addColorStop(0, tipo === 'nuevo' ? '#d9c690' : '#8a5a1a'); fondo.addColorStop(1, tipo === 'nuevo' ? '#cdb97c' : '#6b4416'); x.fillStyle = fondo; x.fillRect(0, 0, Wt, Ht);
    const R = cw * 0.5 * 1.0;
    const hex = (cx, cy, r, rot) => { x.beginPath(); for (let i = 0; i < 6; i++) { const a = PI / 6 + i * PI / 3 + (rot || 0); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); };
    for (let j = -1; j < rows; j++) for (let i = -1; i <= cols; i++) {
      const cx = (i + (j % 2 ? 0.5 : 0)) * cw + cw * 0.5, cy = j * cw * 0.866 + cw * 0.5, yy = cy / Ht, xx = cx / Wt, h = rn();
      let kind;
      if (tipo === 'nuevo') kind = h < 0.9 ? 'vacia' : 'huevo';
      else if (tipo === 'miel') kind = h < 0.72 ? 'mielTapa' : (h < 0.9 ? 'miel' : 'polen');
      else if (tipo === 'cria') kind = yy < 0.12 ? (h < 0.6 ? 'mielTapa' : 'miel') : (h < 0.62 ? 'cria' : (h < 0.72 ? 'larva' : (h < 0.84 ? 'huevo' : (h < 0.93 ? 'vacia' : 'polen'))));
      else kind = yy < 0.3 ? (h < 0.65 ? 'mielTapa' : (h < 0.9 ? 'miel' : 'polen')) : (yy < 0.4 ? (h < 0.7 ? 'polen' : (h < 0.85 ? 'miel' : 'mielTapa')) : (h < 0.6 ? 'cria' : (h < 0.7 ? 'larva' : (h < 0.8 ? 'huevo' : (h < 0.9 ? 'vacia' : (h < 0.95 ? 'polen' : 'miel'))))));
      // pared de cera
      hex(cx, cy, R * 1.02); x.fillStyle = tipo === 'nuevo' ? '#efe3b4' : '#e0b45a'; x.fill();
      hex(cx, cy, R * 0.86);
      const g = x.createRadialGradient(cx - R * 0.15, cy - R * 0.2, R * 0.05, cx, cy, R * 0.9);
      if (kind === 'mielTapa') { g.addColorStop(0, '#fbeec2'); g.addColorStop(1, '#e2c27a'); }
      else if (kind === 'miel') { g.addColorStop(0, '#ffcf4a'); g.addColorStop(0.6, '#f0a010'); g.addColorStop(1, '#b86a08'); }
      else if (kind === 'polen') { const pc = ['#f2a31c', '#e8d23a', '#d9582a', '#c9a04a', '#7aa84a'][Math.floor(rn() * 5)]; g.addColorStop(0, pc); g.addColorStop(1, '#8a5a18'); }
      else if (kind === 'cria') { g.addColorStop(0, '#d9b57a'); g.addColorStop(0.7, '#b98a52'); g.addColorStop(1, '#8a6232'); }
      else { g.addColorStop(0, '#9a6a2c'); g.addColorStop(0.55, '#5e3a14'); g.addColorStop(1, '#2a1708'); }
      x.fillStyle = g; x.fill();
      if (kind === 'larva') { x.fillStyle = '#fff4dc'; x.beginPath(); x.ellipse(cx, cy + R * 0.05, R * 0.5, R * 0.34, 0.5, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,0.12)'; x.beginPath(); x.arc(cx + R * 0.1, cy + R * 0.1, R * 0.3, 0, 7); x.fill(); }
      if (kind === 'huevo') { x.strokeStyle = '#fffbe8'; x.lineWidth = Math.max(2, R * 0.12); x.beginPath(); x.moveTo(cx, cy + R * 0.1); x.lineTo(cx + R * 0.04, cy - R * 0.2); x.stroke(); }
      if (kind === 'cria' || kind === 'mielTapa') { x.fillStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(cx - R * 0.22, cy - R * 0.25, R * 0.28, 0, 7); x.fill(); x.fillStyle = 'rgba(70,40,10,0.35)'; x.beginPath(); x.arc(cx, cy + R * 0.05, R * 0.06, 0, 7); x.fill(); }
      if (kind === 'miel') { x.fillStyle = 'rgba(255,255,230,0.55)'; x.beginPath(); x.arc(cx - R * 0.28, cy - R * 0.3, R * 0.16, 0, 7); x.fill(); }
      hex(cx, cy, R * 0.9); x.strokeStyle = 'rgba(60,35,8,0.55)'; x.lineWidth = Math.max(1.5, R * 0.08); x.stroke();
    }
    const v = x.createRadialGradient(Wt * 0.5, Ht * 0.5, Wt * 0.3, Wt * 0.5, Ht * 0.5, Ht * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,5,0,0.35)'); x.fillStyle = v; x.fillRect(0, 0, Wt, Ht);
  });
  MO.panal = (o = {}) => {
    const w = o.ancho || 2.4, h = o.alto || 3.2, tipo = o.tipo || 'mixto', cols = o.cols || 48, TW = 1536, TH = Math.round(TW * h / w);
    const mat = { color: '#ffffff', mapa: hexTex('panal|' + tipo + '|' + cols + '|' + (o.semilla || 1) + '|' + TH, TW, TH, cols, tipo, o.semilla || 1), esp: 0.25, dureza: 20, envolver: 0.3, borde: 0.2 };
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, nombre: o.nombre || 'panal', hijos: [nodo({ malla: MA.plano(w, h, 1), rot: [PI / 2, 0, 0], mat })] });
  };

  /* ---------- parche 3D de celdas (primeros planos) ---------- */
  const hexPos = (i, j, r) => [(i + (j % 2 ? 0.5 : 0)) * r * 1.732, j * r * 1.5];
  MO.celdas = (o = {}) => {
    const F = o.filas || 5, C = o.cols || 5, r = o.r || 0.05, prof = o.prof || 0.07, sw = r * 0.96;
    const tubo = MA.cilindro(sw, sw, prof, 6, false), ps = [];
    for (let j = 0; j < F; j++) for (let i = 0; i < C; i++) { const [px, py] = hexPos(i, j, r); ps.push({ malla: tubo, m: M.mul(M.tras(px, py, prof / 2), M.mul(M.rotX(PI / 2), M.rotY(PI / 6))) }); }
    const malla = MA.fusionar(ps, 'celdas|' + F + '|' + C + '|' + r + '|' + prof);
    const fondo = MA.cache('celdas|fondo|' + F + '|' + C + '|' + r, () => MA.fusionar(Array.from({ length: F * C }, (_, k) => { const i = k % C, j = Math.floor(k / C), [px, py] = hexPos(i, j, r); return { malla: MA.cilindro(sw, sw, 0.004, 6, true), m: M.mul(M.tras(px, py, 0.002), M.mul(M.rotX(PI / 2), M.rotY(PI / 6))) }; }), 'celdas|fondo|' + F + '|' + C + '|' + r));
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, nombre: o.nombre || 'celdas', hijos: [nodo({ malla, mat: { color: '#e6bb62', esp: 0.3, dureza: 20, envolver: 0.45, dobleCara: true, borde: 0.3 } }), nodo({ malla: fondo, mat: { color: '#7a4e1c', envolver: 0.4 } })] });
  };
  MO.celdaPos = (i, j, r) => hexPos(i, j, r || 0.05);
  MO.huevo3d = (o = {}) => nodo({ pos: o.pos, rot: o.rot || [PI / 2 - 0.2, 0, 0], esc: o.esc, alfa: o.alfa, hijos: [nodo({ malla: MA.capsula(0.006, 0.005, 0.03, 8), pos: [0, 0.015, 0], mat: { color: '#fffbe8', esp: 0.5, dureza: 40, envolver: 0.4 } })] });
  MO.larva3d = (o = {}) => { const k = o.k == null ? 0.5 : o.k, R = (o.r || 0.045) * (0.35 + 0.65 * k);
    const m = MA.parametrica(24, 10, (u, v) => { const a = (0.15 + u * 4.1) , rad = R * 0.55 * (0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.04))) , c = [Math.cos(a) * R, Math.sin(a) * R * 0.8], p = v * TAU; return [c[0] + Math.cos(p) * rad * Math.cos(a), c[1] + Math.cos(p) * rad * Math.sin(a), Math.sin(p) * rad]; }, { clave: 'larva|' + R.toFixed(3) });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [nodo({ malla: m, mat: { color: '#fff1d4', esp: 0.5, dureza: 35, envolver: 0.5 } })] }); };
  MO.tapa3d = (o = {}) => nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [nodo({ malla: MA.esfera(14), esc: [(o.r || 0.045), (o.r || 0.045), 0.02], mat: { color: '#c9a066', esp: 0.2, dureza: 15, envolver: 0.5 } })] });
  MO.pupa3d = (o = {}) => { const r = o.r || 0.04, k = c01(o.k == null ? 0.5 : o.k), pr = k < 0.5 ? '#f6ecd6' : (k < 0.8 ? '#d9c08a' : '#b89050');
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [nodo({ malla: MA.capsula(r * 0.4, r * 0.3, r * 1.5, 10), rot: [PI / 2, 0, 0], pos: [0, 0, r * 0.7], mat: { color: pr, esp: 0.4, dureza: 30, envolver: 0.5 } }), nodo({ malla: MA.esfera(10), pos: [0, 0, r * 0.0], esc: [r * 0.38, r * 0.38, r * 0.38], mat: { color: pr, esp: 0.4, dureza: 30, envolver: 0.5 } })] }); };

  /* ---------- colmena de cajas ---------- */
  const texMadera = (c) => V.textura('colmena|madera|' + c, 256, 256, (x, W, H) => { x.fillStyle = c; x.fillRect(0, 0, W, H); const r = VE.rng('mad'); for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, i * H / 8, W, 2); } for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.05})`; x.fillRect(r() * W, r() * H, 18 + r() * 40, 1); } });
  MO.colmena = (o = {}) => {
    const W = 0.5, D = 0.42, Hc = 0.24, af = o.alfaCaja == null ? 1 : o.alfaCaja, corte = !!o.corte;
    const mat = (c, a) => { const q = { color: '#ffffff', mapa: texMadera(c), esp: 0.15, dureza: 14, envolver: 0.35, borde: 0.4 }; if (a != null && a < 1) { q.alfa = a; q.dobleCara = true; } return q; };
    const caja = (y, c) => { const hs = []; if (corte) { hs.push(nodo({ malla: MA.caja(W, Hc, 0.02, 0.01), pos: [0, y, -D / 2], mat: mat(c, af) }), nodo({ malla: MA.caja(0.02, Hc, D, 0.01), pos: [-W / 2, y, 0], mat: mat(c, af) }), nodo({ malla: MA.caja(0.02, Hc, D, 0.01), pos: [W / 2, y, 0], mat: mat(c, af) })); }
      else hs.push(nodo({ malla: MA.caja(W, Hc, D, 0.012), pos: [0, y, 0], mat: mat(c, af) })); return hs; };
    const hijos = [nodo({ malla: MA.caja(W * 1.06, 0.03, D * 1.06, 0.01), pos: [0, 0.02, 0], mat: mat('#c9c2a8') }), nodo({ malla: MA.caja(W * 0.9, 0.12, D * 0.9, 0.01), pos: [0, -0.08, 0], mat: mat('#8a6a44') }),
      ...caja(0.15, '#f1ecdc'), ...caja(0.39, '#8fb3d6'), nodo({ malla: MA.caja(W * 1.08, 0.04, D * 1.08, 0.015), pos: [0, 0.53, 0], mat: mat('#e8e2d0') }), nodo({ malla: MA.caja(0.2, 0.02, 0.14, 0.01), pos: [0, 0.015, D * 0.5 + 0.06], mat: mat('#d6caa8') }),
      nodo({ malla: MA.caja(0.22, 0.012, 0.02, 0.004), pos: [0, 0.045, D * 0.5 + 0.005], mat: { color: '#140c06', tipo: 'plano' } })];
    if (corte) for (let k = 0; k < 9; k++) for (const [y, c] of [[0.15, '#d9b05a'], [0.39, '#e6a824']]) hijos.push(nodo({ malla: MA.caja(0.012, Hc * 0.88, D * 0.82, 0.004), pos: [-W / 2 + 0.04 + k * 0.058, y, 0], mat: { color: c, esp: 0.2, dureza: 16, envolver: 0.4 } }));
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, nombre: 'colmena', hijos });
  };
  MO.flor = (o = {}) => { const c = o.color || '#f2d24a', hs = [nodo({ malla: MA.cilindro(0.004, 0.005, 0.32, 6, true), pos: [0, 0.16, 0], mat: { color: '#4c8a3a' } }), nodo({ malla: MA.esfera(10), pos: [0, 0.33, 0], esc: [0.03, 0.012, 0.03], mat: { color: '#8a5a1a' } })];
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; hs.push(nodo({ malla: MA.esfera(8), pos: [Math.cos(a) * 0.05, 0.325, Math.sin(a) * 0.05], rot: [0, -a, 0], esc: [0.035, 0.006, 0.014], mat: { color: c, envolver: 0.5 } })); }
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: hs }); };
})(window.VE);
