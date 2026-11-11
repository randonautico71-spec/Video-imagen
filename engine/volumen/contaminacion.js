/* VOLUMEN — CONTAMINACION Y TRANSICION (unidades: metros aprox.; todos se apoyan en y = 0 y miran a +X).
     V.modelos.fabrica({ t, humo, pos, rot, esc })       nave con tejado en dientes de sierra, 3 chimeneas a rayas y humo que sube con t (humo 0..1)
     V.modelos.coche({ color, pos, rot, esc })           turismo (largo ~1,9)
     V.modelos.camionCarga({ pos, rot, esc })            camion de caja (largo ~2,6)
     V.modelos.vaca({ pos, rot, esc })                   vaca frisona con manchas, cuernos cortos, rabo
     V.modelos.ciudad({ n, semilla, alto, pos, esc })    bloque de edificios con ventanas (n x n)
     V.modelos.torre({ alto, ancho, color, ventanas, pos, esc })  un edificio suelto
     V.modelos.botella({ color, pos, rot, esc })         botella de plastico (alto ~0,3)
     V.modelos.contenedor({ color, tapa, pos, rot, esc })  contenedor de reciclaje con flechas
     V.modelos.pilaRopa({ n, semilla, pos, esc })        monton de prendas de colores
     V.modelos.molino({ t, pos, esc })                   aerogenerador (alto ~3,2) con aspas que giran
     V.modelos.panelSolar({ pos, rot, esc })             panel fotovoltaico inclinado sobre soporte
   Probado en proyectos/reciclar. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const liso = (c, e) => Object.assign({ color: c, esp: 0.25, dureza: 30, envolver: 0.3 }, e || {});
  const caja = (w, h, d, mat, pos, rot, b) => V.nodo({ malla: MA.caja(w, h, d, b == null ? Math.min(w, h, d) * 0.12 : b, 3), mat, pos, rot });
  const ell = (mat, esc3, pos, rot) => V.nodo({ malla: MA.esfera(20), esc: esc3, pos, rot, mat });
  const ejeZ = [PI / 2, 0, 0];                                                       // cilindro con el eje a lo largo de z

  /* ---------------------------------------------------------------- FABRICA */
  MO.fabrica = function (o = {}) {
    const tex = V.textura('fab|ladrillo', 512, 256, (x, W, H) => { x.fillStyle = '#8a4b3a'; x.fillRect(0, 0, W, H); const r = VE.rng('fabladrillo');
      for (let y = 0; y < H; y += 12) { for (let xx = (y / 12 % 2) * 12; xx < W; xx += 24) { x.fillStyle = `rgba(${r() < 0.5 ? '40,10,5' : '255,190,150'},${0.05 + r() * 0.12})`; x.fillRect(xx, y, 22, 10); } x.fillStyle = 'rgba(20,8,4,0.4)'; x.fillRect(0, y + 10, W, 2); }
      x.fillStyle = '#2a3238'; for (let i = 0; i < 6; i++) { x.fillRect(30 + i * 80, 70, 52, 60); x.fillStyle = 'rgba(255,200,110,0.55)'; x.fillRect(34 + i * 80, 74, 44, 52); x.fillStyle = '#2a3238'; } });
    const texChim = V.textura('fab|chimenea', 128, 256, (x, W, H) => { x.fillStyle = '#c8c4bc'; x.fillRect(0, 0, W, H); x.fillStyle = '#b3342a'; for (let i = 0; i < 4; i++) x.fillRect(0, 18 + i * 62, W, 30);
      const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.4)'); x.fillStyle = g; x.fillRect(0, 0, W, H); });
    const mL = { color: '#ffffff', mapa: tex, esp: 0.08, dureza: 12, envolver: 0.35 }, mChim = { color: '#ffffff', mapa: texChim, esp: 0.2, dureza: 30, envolver: 0.3 };
    const mT = liso('#4a525a', { esp: 0.2 });
    const h = [caja(3.4, 1.3, 1.9, mL, [0, 0.65, 0], null, 0.04), caja(1.1, 1.9, 1.3, mL, [-1.0, 0.95, -0.35], null, 0.04), caja(1.2, 0.8, 1.0, mL, [1.1, 1.7, -0.5], null, 0.04)];
    for (let i = 0; i < 4; i++) h.push(V.nodo({ malla: MA.extrusion([[0, 0], [0.7, 0], [0, 0.34]], 1.9, 'fab|diente'), mat: mT, pos: [-1.35 + i * 0.7, 1.3, 0.95], rot: [0, 0, 0] }));   // dientes de sierra
    h.push(V.nodo({ malla: MA.cilindro(0.09, 0.09, 0.03, 12), mat: liso('#222'), pos: [0, 0, 0] }));
    const ch = [[-1.3, -0.72, 2.9], [-0.7, -0.72, 3.5], [-0.1, -0.72, 2.6]];
    ch.forEach(([x, z, alto]) => { h.push(V.nodo({ malla: MA.cilindro(0.13, 0.19, alto, 20), mat: mChim, pos: [x, 1.3 + alto / 2, z] })); h.push(V.nodo({ malla: MA.cilindro(0.2, 0.2, 0.05, 20), mat: liso('#222'), pos: [x, 1.3 + alto, z] })); });
    const t = o.t || 0, hu = o.humo == null ? 1 : o.humo;
    if (hu > 0.01) {
      ch.forEach(([x, z, alto], k) => { for (let i = 0; i < 9; i++) { const u = ((t * 0.16 + i / 9 + k * 0.31) % 1), y = 1.3 + alto + u * 3.4, r = 0.17 + u * 0.7, drift = u * u * 1.3;
        h.push(V.nodo({ malla: MA.esfera(14), pos: [x + drift + 0.06 * Math.sin(u * 9 + i), y, z + 0.05 * Math.cos(u * 7 + k)], esc: [r, r * 0.8, r], sinSombra: true,
          mat: { color: '#3b3d41', esp: 0.02, envolver: 0.6, alfa: hu * 0.78 * Math.pow(1 - u, 0.7) * Math.min(1, u * 6 + 0.25) } })); } });
    }
    return V.nodo({ nombre: 'fabrica', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  /* ---------------------------------------------------------------- COCHE y CAMION */
  const rueda = (x, z, r, ancho) => V.nodo({ pos: [x, r, z], hijos: [V.nodo({ malla: MA.cilindro(r, r, ancho, 22), rot: ejeZ, mat: liso('#15171a', { esp: 0.15, dureza: 12 }) }), V.nodo({ malla: MA.cilindro(r * 0.58, r * 0.58, ancho + 0.01, 18), rot: ejeZ, mat: liso('#b9bec4', { esp: 0.7, dureza: 70 }) })] });
  MO.coche = function (o = {}) {
    const col = liso(o.color || '#c0392b', { esp: 0.7, dureza: 80, envolver: 0.2, borde: 0.3 }), cri = liso('#1c2a36', { esp: 0.9, dureza: 100, envolver: 0.1 });
    const h = [caja(1.9, 0.38, 0.82, col, [0, 0.36, 0], null, 0.12), caja(1.0, 0.32, 0.72, cri, [-0.1, 0.66, 0], null, 0.12), caja(0.86, 0.06, 0.7, col, [-0.1, 0.84, 0], null, 0.03),
      ell(liso('#fff6c8', { emision: 0.9 }), [0.03, 0.06, 0.12], [0.95, 0.42, 0.28]), ell(liso('#fff6c8', { emision: 0.9 }), [0.03, 0.06, 0.12], [0.95, 0.42, -0.28]),
      ell(liso('#ff3b2f', { emision: 0.5 }), [0.03, 0.05, 0.12], [-0.95, 0.42, 0.28]), ell(liso('#ff3b2f', { emision: 0.5 }), [0.03, 0.05, 0.12], [-0.95, 0.42, -0.28]),
      rueda(0.6, 0.36, 0.17, 0.12), rueda(0.6, -0.36, 0.17, 0.12), rueda(-0.58, 0.36, 0.17, 0.12), rueda(-0.58, -0.36, 0.17, 0.12)];
    return V.nodo({ nombre: 'coche', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };
  MO.camionCarga = function (o = {}) {
    const caja1 = liso(o.caja || '#e8e6df', { esp: 0.25 }), cab = liso(o.cabina || '#2e6fb5', { esp: 0.6, dureza: 60 });
    const h = [caja(1.75, 0.95, 0.9, caja1, [-0.35, 0.95, 0], null, 0.05), caja(0.62, 0.78, 0.88, cab, [0.84, 0.82, 0], null, 0.08), caja(0.3, 0.3, 0.78, liso('#1c2a36', { esp: 0.9 }), [1.04, 1.0, 0], null, 0.05),
      caja(2.5, 0.16, 0.78, liso('#2a2d31'), [0, 0.34, 0], null, 0.04), rueda(0.85, 0.42, 0.24, 0.16), rueda(0.85, -0.42, 0.24, 0.16), rueda(-0.7, 0.42, 0.24, 0.16), rueda(-0.7, -0.42, 0.24, 0.16)];
    return V.nodo({ nombre: 'camion', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  /* ---------------------------------------------------------------- VACA */
  MO.vaca = function (o = {}) {
    const tex = V.textura('vaca|manchas', 512, 256, (x, W, H) => { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, W, H); const r = VE.rng('vacamanchas'); x.fillStyle = '#25211f';
      for (let i = 0; i < 9; i++) { const cx = r() * W, cy = H * (0.15 + r() * 0.7), rx = 30 + r() * 60, ry = 20 + r() * 40; x.beginPath(); for (let a = 0; a <= 12; a++) { const an = a / 12 * TAU, rr = 0.75 + r() * 0.5; x.lineTo(cx + Math.cos(an) * rx * rr, cy + Math.sin(an) * ry * rr); } x.closePath(); x.fill(); }
      for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.06})`; x.fillRect(r() * W, r() * H, 3, 1); } });
    const piel = { color: '#ffffff', mapa: tex, esp: 0.12, dureza: 16, envolver: 0.4, borde: 0.2 }, nariz = liso('#e7a7a0', { esp: 0.3 }), os = liso('#25211f'), cuerno = liso('#e8dcc0', { esp: 0.4 });
    const pata = (x, z) => V.nodo({ pos: [x, 0.62, z], hijos: [V.nodo({ malla: MA.capsula(0.075, 0.06, 0.45, 12), mat: piel }), V.nodo({ malla: MA.cilindro(0.065, 0.07, 0.07, 12), pos: [0, -0.5, 0], mat: os })] });
    const cab = V.nodo({ pos: [0.82, 0.98, 0], rot: [0, 0, -0.35], hijos: [ell(piel, [0.2, 0.17, 0.15], [0, 0, 0]), ell(nariz, [0.1, 0.09, 0.12], [0.18, -0.07, 0]), ell(os, [0.02, 0.025, 0.02], [0.27, -0.06, 0.04]), ell(os, [0.02, 0.025, 0.02], [0.27, -0.06, -0.04]),
      ell(os, [0.025, 0.03, 0.02], [0.09, 0.06, 0.12]), ell(os, [0.025, 0.03, 0.02], [0.09, 0.06, -0.12]), ell(piel, [0.05, 0.09, 0.04], [-0.04, 0.05, 0.17], [0.5, 0, 0.3]), ell(piel, [0.05, 0.09, 0.04], [-0.04, 0.05, -0.17], [-0.5, 0, 0.3]),
      ell(cuerno, [0.02, 0.07, 0.02], [-0.03, 0.17, 0.09], [0.3, 0, 0]), ell(cuerno, [0.02, 0.07, 0.02], [-0.03, 0.17, -0.09], [-0.3, 0, 0])] });
    const h = [ell(piel, [0.78, 0.42, 0.4], [0, 1.02, 0]), ell(piel, [0.36, 0.34, 0.36], [0.58, 1.08, 0]), ell(piel, [0.3, 0.3, 0.34], [-0.62, 1.04, 0]), V.nodo({ malla: MA.capsula(0.12, 0.08, 0.3, 12), pos: [0.66, 1.22, 0], rot: [0, 0, -0.9], mat: piel }),
      cab, ell(nariz, [0.12, 0.06, 0.1], [-0.12, 0.62, 0]), pata(0.5, 0.2), pata(0.5, -0.2), pata(-0.52, 0.2), pata(-0.52, -0.2),
      V.nodo({ malla: MA.capsula(0.025, 0.02, 0.55, 8), pos: [-0.86, 1.18, 0], rot: [0, 0, 0.18], mat: piel }), ell(os, [0.05, 0.1, 0.05], [-0.92, 0.6, 0])];
    return V.nodo({ nombre: 'vaca', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  /* ---------------------------------------------------------------- EDIFICIOS */
  const texVent = (clave, w, h, col, lit) => V.textura('torre|' + clave, 256, 512, (x, W, H) => { x.fillStyle = col; x.fillRect(0, 0, W, H); const r = VE.rng('vent' + clave), nx = Math.max(2, w), ny = Math.max(4, h);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const on = r() < lit; x.fillStyle = on ? `rgba(255,${200 + r() * 40 | 0},${120 + r() * 60 | 0},0.95)` : 'rgba(25,34,46,0.95)'; x.fillRect(W * (i + 0.18) / nx, H * (j + 0.2) / ny, W * 0.64 / nx, H * 0.6 / ny); } });
  MO.torre = function (o = {}) {
    const a = o.ancho || 0.5, hh = o.alto || 1.6, col = o.color || '#9aa3ad', k = Math.round(a * 10) + '|' + Math.round(hh * 10) + '|' + col.slice(1);
    const m = { color: '#ffffff', mapa: texVent(k, Math.round(a * 8), Math.round(hh * 5), col, o.ventanas == null ? 0.35 : o.ventanas), esp: 0.3, dureza: 40, envolver: 0.3 };
    return V.nodo({ nombre: 'torre', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ malla: MA.caja(a, hh, a, 0.02, 2), mat: m, pos: [0, hh / 2, 0] })] });
  };
  MO.ciudad = function (o = {}) {
    const n = o.n || 4, r = VE.rng('ciudad' + (o.semilla || 1)), h = [], pal = ['#8e99a5', '#a8a39a', '#7d8a96', '#b4aca0', '#96a0aa'];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const al = (o.alto || 1.6) * (0.4 + r() * 1.0), an = 0.42 + r() * 0.2;
      h.push(MO.torre({ alto: al, ancho: an, color: pal[Math.floor(r() * pal.length)], ventanas: 0.25 + r() * 0.45, pos: [(i - (n - 1) / 2) * 0.8, 0, (j - (n - 1) / 2) * 0.8] })); }
    return V.nodo({ nombre: 'ciudad', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  /* ---------------------------------------------------------------- BOTELLA, CONTENEDOR, ROPA */
  MO.botella = function (o = {}) {
    const perfil = [[0, 0], [0.05, 0], [0.06, 0.012], [0.062, 0.07], [0.062, 0.17], [0.05, 0.215], [0.026, 0.245], [0.024, 0.28], [0, 0.28]];
    const mat = { color: o.color || '#8fd0ff', esp: 0.9, dureza: 90, envolver: 0.15, borde: 0.6, alfa: o.alfa == null ? 0.72 : o.alfa };
    return V.nodo({ nombre: 'botella', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ malla: MA.torno(perfil, 20, 'botella|plastico'), mat }), V.nodo({ malla: MA.cilindro(0.027, 0.027, 0.03, 12), mat: liso(o.tapa || '#2f6fcf'), pos: [0, 0.295, 0] })] });
  };
  MO.contenedor = function (o = {}) {
    const col = o.color || '#f0c419', tex = V.textura('cont|flechas|' + col.slice(1), 256, 256, (x, W, H) => { x.fillStyle = col; x.fillRect(0, 0, W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(255,255,255,0.92)'; x.fillStyle = 'rgba(255,255,255,0.92)'; x.lineWidth = 12; x.lineCap = 'round'; const cx = W / 2, cy = H / 2 + 6;
      for (let i = 0; i < 3; i++) { const a0 = i * TAU / 3 + 0.35, a1 = a0 + 1.45; x.beginPath(); x.arc(cx, cy, 54, a0, a1); x.stroke(); const ax = cx + Math.cos(a1) * 54, ay = cy + Math.sin(a1) * 54, d = a1 + PI / 2; x.beginPath(); x.moveTo(ax + Math.cos(d) * 22, ay + Math.sin(d) * 22); x.lineTo(ax - Math.cos(d) * 22, ay - Math.sin(d) * 22); x.lineTo(ax + Math.cos(a1) * 24, ay + Math.sin(a1) * 24); x.closePath(); x.fill(); } });
    const m = { color: '#ffffff', mapa: tex, esp: 0.3, dureza: 40, envolver: 0.3 }, tapa = liso(o.tapa || '#cf9f10', { esp: 0.3 });
    return V.nodo({ nombre: 'contenedor', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [caja(0.7, 0.9, 0.55, m, [0, 0.45, 0], null, 0.04), caja(0.76, 0.07, 0.6, tapa, [0, 0.93, 0], null, 0.02), V.nodo({ malla: MA.cilindro(0.045, 0.045, 0.05, 14), mat: liso('#222'), pos: [0.22, 0.12, 0.3], rot: ejeZ }), V.nodo({ malla: MA.cilindro(0.045, 0.045, 0.05, 14), mat: liso('#222'), pos: [-0.22, 0.12, 0.3], rot: ejeZ })] });
  };
  MO.pilaRopa = function (o = {}) {
    const r = VE.rng('ropa' + (o.semilla || 1)), n = o.n || 40, pal = ['#c0392b', '#2e6fb5', '#e8c547', '#5a9e6f', '#8e5ea8', '#e9e5da', '#2b2f36', '#d9822b', '#3aa6b9'], h = [];
    const telas = V.textura('ropa|tela', 128, 128, (x, W, H) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.07})`; x.fillRect(0, r() * H, W, 2 + r() * 3); } for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 2; x.beginPath(); x.moveTo(r() * W, r() * H); x.lineTo(r() * W, r() * H); x.stroke(); } });
    const mats = pal.map(c => ({ color: c, mapa: telas, esp: 0.05, dureza: 8, envolver: 0.5, borde: 0.15 }));
    for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.pow(r(), 0.7) * 0.85, y = Math.max(0.05, 0.62 * (1 - d / 0.95) * (0.5 + r() * 0.7)) * 1.0;
      h.push(V.nodo({ malla: MA.esfera(12), mat: mats[Math.floor(r() * mats.length)], pos: [Math.cos(a) * d, y, Math.sin(a) * d * 0.8], esc: [0.2 + r() * 0.16, 0.07 + r() * 0.06, 0.15 + r() * 0.12], rot: [r() * 3, r() * 3, r() * 3] })); }
    return V.nodo({ nombre: 'pilaRopa', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  /* ---------------------------------------------------------------- RENOVABLES */
  MO.molino = function (o = {}) {
    const blanco = liso('#f1f3f4', { esp: 0.5, dureza: 50 }), ang = (o.t || 0) * (o.vel == null ? 1.4 : o.vel);
    const aspa = (a) => V.nodo({ rot: [a, 0, 0], hijos: [V.nodo({ malla: MA.extrusion([[0, 0.02], [0.05, 0.03], [0.02, 1.15], [-0.04, 1.15], [-0.08, 0.1]], 0.018, 'molino|aspa'), mat: blanco, pos: [0.02, 0, 0], rot: [0, PI / 2, PI / 2] })] });
    const h = [V.nodo({ malla: MA.cilindro(0.04, 0.075, 2.1, 20), mat: blanco, pos: [0, 1.05, 0] }), caja(0.28, 0.13, 0.13, blanco, [0.02, 2.12, 0], null, 0.04),
      V.nodo({ pos: [0.16, 2.12, 0], hijos: [ell(blanco, [0.06, 0.055, 0.055], [0, 0, 0]), V.nodo({ rot: [ang, 0, 0], hijos: [aspa(0), aspa(TAU / 3), aspa(2 * TAU / 3)] })] })];
    return V.nodo({ nombre: 'molino', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };
  MO.panelSolar = function (o = {}) {
    const tex = V.textura('panel|celdas', 256, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1b3d73'); g.addColorStop(1, '#0f2548'); x.fillStyle = g; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(190,210,235,0.55)'; x.lineWidth = 1.5;
      for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * W / 8, 0); x.lineTo(i * W / 8, H); x.stroke(); } for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(0, j * H / 4); x.lineTo(W, j * H / 4); x.stroke(); } });
    const m = { color: '#ffffff', mapa: tex, esp: 0.9, dureza: 90, envolver: 0.2, borde: 0.4 };
    return V.nodo({ nombre: 'panelSolar', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ pos: [0, 0.45, 0], rot: [0, 0, -0.5], hijos: [caja(0.05, 0.9, 1.5, liso('#8d949b', { esp: 0.5 }), [0, 0, 0], null, 0.015), V.nodo({ malla: MA.plano(0.82, 1.4, 1), mat: m, rot: [0, 0, -PI / 2], pos: [0.03, 0, 0] })] }),
      V.nodo({ malla: MA.cilindro(0.03, 0.03, 0.5, 10), mat: liso('#8d949b'), pos: [-0.12, 0.25, 0] })] });
  };
})(window.VE);
