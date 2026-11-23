/* VOLUMEN — APAGON / CLIMA ESPACIAL: ciudad nocturna que se apaga por barrios, Sol con eyeccion de plasma, campo magnetico
   de la Tierra, auroras, torres de alta tension, transformador (con nucleo para rayos X), tractor y satelite.
     V.modelos.ciudad({semilla, bloques, porTrozo, luz(x, z) -> 0..1.6})   ciudad en el plano XZ (1 u ~ 40 m) troceada en barrios;
                                                                        luz: brillo de cada barrio (0 apagado, >1 subidon antes de apagarse)
     V.modelos.ciudad.trozos(o) -> [{x, z, s}]                             centros de los barrios (para el resplandor 2D)
     V.modelos.sol({t})                                                    esfera de radio 1 con granulacion (emisiva)
     V.modelos.aurora({radio, alto, ancho, semilla, alfa, t})              cortina de aurora (aditiva) de x = -ancho/2..ancho/2
     V.modelos.ovaloAurora({lat, alfa, t})                                 anillo de aurora sobre el polo norte de una Tierra de radio 1
     V.modelos.torre({})                                                   torre de alta tension (celosia), 1 u = 1 m / 10; cruceta a y 3.2
     V.modelos.transformador({calor, rayos, tapa})                         transformador de potencia con bornas; calor 0..1 pone el nucleo al rojo
     V.modelos.tractor({t, ruedas})                                        tractor agricola, morro hacia +Z
     V.modelos.satelite({})                                                satelite GPS con paneles
   Ayudas 2D (para usar tras V.render, con esc.ctx): VE.vol.brillo(esc, x, y, r, color, a) resplandor horneado aditivo,
   VE.vol.chispas(esc, cam, {origen, t, n, semilla, vel, g, color}) chispas balisticas en 3D proyectadas, VE.vol.rayo(esc, a, b, t, {color, ancho})
   arco electrico quebrado entre dos puntos 2D, VE.vol.campo(esc, cam, {k, sol, t, a, color}) lineas del campo magnetico (con oclusion de la Tierra). */
(function (VE) {
  const V = VE.vol = VE.vol || {}, MA = V.malla, MO = V.modelos, PI = Math.PI;
  const lienzo = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const hash = (a, b = 0, c = 0) => { let h = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return h - Math.floor(h); };

  // ---------------------------------------------------------------- ciudad
  /* Textura de fachadas: rejilla de 8 x 16 ventanas que se repite (las caras llevan uv en «ventanas»). luz: encendidas o apagadas. */
  function texFachada(luz) {
    return V.textura('fachada|' + luz, 512, 1024, (x, W, H, c) => {
      c.repetirV = true; const r = VE.rng('fach');
      x.fillStyle = luz ? '#1c2232' : '#202634'; x.fillRect(0, 0, W, H);
      const cw = W / 8, chh = H / 16;
      for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) {
        const on = r() < 0.72, tono = r(), X = i * cw + cw * 0.18, Y = j * chh + chh * 0.22, w = cw * 0.64, h = chh * 0.56;
        if (luz && on) { x.fillStyle = tono < 0.6 ? '#ffd27a' : (tono < 0.85 ? '#fff1c4' : '#9fd0ff'); x.fillRect(X, Y, w, h); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(X, Y, w, h * 0.25); }
        else { x.fillStyle = luz ? '#0c1018' : '#141a26'; x.fillRect(X, Y, w, h); x.fillStyle = 'rgba(120,150,210,0.10)'; x.fillRect(X, Y, w * 0.4, h); }
      }
      x.fillStyle = luz ? '#1c2232' : '#202634'; x.fillRect(0, 0, 6, 6);            // texel de tejado
    });
  }
  /* Suelo de un barrio: manzanas oscuras y calles con farolas (encendido) o asfalto (apagado). n manzanas por lado. */
  function texSuelo(luz, n, cal) {
    return V.textura('suelo|' + luz + '|' + n, 1024, 1024, (x, W, H) => {
      const r = VE.rng('suelo' + n), paso = W / n, ca = paso * cal / 2;
      x.fillStyle = '#07090e'; x.fillRect(0, 0, W, H);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { x.fillStyle = luz ? '#141822' : '#0d1018'; x.fillRect(i * paso + ca, j * paso + ca, paso - 2 * ca, paso - 2 * ca); }
      if (!luz) return;
      for (let k = 0; k <= n; k++) {
        for (const vert of [0, 1]) {
          const p = k * paso;
          const g = vert ? x.createLinearGradient(p - ca, 0, p + ca, 0) : x.createLinearGradient(0, p - ca, 0, p + ca);
          g.addColorStop(0, 'rgba(255,150,50,0)'); g.addColorStop(0.5, 'rgba(255,170,70,0.85)'); g.addColorStop(1, 'rgba(255,150,50,0)'); x.fillStyle = g;
          if (vert) x.fillRect(p - ca, 0, 2 * ca, H); else x.fillRect(0, p - ca, W, 2 * ca);
          for (let s = 0; s < W; s += 9) { const q = s + r() * 4; x.fillStyle = r() < 0.5 ? '#fff6d8' : (r() < 0.5 ? '#ff4a3a' : '#ffd27a'); const a = r() < 0.6;
            if (!a) continue; if (vert) x.fillRect(p - ca * 0.5 + r() * ca, q, 3, 3); else x.fillRect(q, p - ca * 0.5 + r() * ca, 3, 3); }
        }
      }
    });
  }
  /* Malla de los edificios de un barrio: cajas con uv en unidades de ventana (u ~ 0,11 u, v ~ 0,075 u por planta). */
  function mallaBarrio(sem, bx, bz, nb, paso, manz, centro) {
    return MA.cache('barrio|' + sem + '|' + bx + '|' + bz + '|' + nb, () => {
      const r = VE.rng(sem + bx + ',' + bz), pos = [], nor = [], uv = [], idx = [];
      const cara = (p, n, us, vs) => { const b = pos.length / 3; for (let i = 0; i < 4; i++) { pos.push(...p[i]); nor.push(...n); uv.push(us[i], vs[i]); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
      const caja = (x0, z0, w, d, h) => {
        const x1 = x0 + w, z1 = z0 + d, uo = Math.floor(r() * 8) / 8, U = (l) => uo + l / 0.11 / 8, Vv = h / 0.075 / 16, vo = Math.floor(r() * 16) / 16;
        cara([[x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1]], [0, 0, 1], [U(0), U(w), U(w), U(0)], [vo, vo, vo + Vv, vo + Vv]);
        cara([[x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0]], [0, 0, -1], [U(0), U(w), U(w), U(0)], [vo, vo, vo + Vv, vo + Vv]);
        cara([[x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1]], [1, 0, 0], [U(0), U(d), U(d), U(0)], [vo, vo, vo + Vv, vo + Vv]);
        cara([[x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]], [-1, 0, 0], [U(0), U(d), U(d), U(0)], [vo, vo, vo + Vv, vo + Vv]);
        cara([[x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0]], [0, 1, 0], [0.001, 0.001, 0.001, 0.001], [0.001, 0.001, 0.001, 0.001]);
      };
      for (let j = 0; j < nb; j++) for (let i = 0; i < nb; i++) {
        const mx = (bx * nb + i) * paso, mz = (bz * nb + j) * paso, cx = mx + paso / 2, cz = mz + paso / 2, dc = Math.hypot(cx - centro[0], cz - centro[1]);
        const alto = 0.25 + 2.6 * Math.exp(-dc * dc / 40) + 0.35 * r();                          // centro de rascacielos
        const k = r() < 0.5 ? 2 : 3, sub = manz / k;
        for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) {
          if (r() < 0.12) continue;
          const w = sub * (0.6 + 0.3 * r()), d = sub * (0.6 + 0.3 * r()), h = alto * (0.3 + 0.9 * r() * r()) + 0.12;
          caja(mx + (paso - manz) / 2 + a * sub + (sub - w) / 2, mz + (paso - manz) / 2 + b * sub + (sub - d) / 2, w, d, h);
        }
      }
      return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint32Array(idx) };
    });
  }
  function opcCiudad(o) { const bloques = o.bloques || 24, porTrozo = o.porTrozo || 3, paso = 1.35, manz = 1.0; return { bloques, porTrozo, paso, manz, n: bloques / porTrozo, sem: o.semilla || 'ciudad', L: bloques * paso }; }
  MO.ciudad = function (o = {}) {
    const C = opcCiudad(o), h = [], ts = C.porTrozo * C.paso, off = -C.L / 2, f = o.luz || (() => 1), cen = [C.L / 2 + (o.centro ? o.centro[0] : 0), C.L / 2 + (o.centro ? o.centro[1] : 0)];
    const litF = texFachada(true), osF = texFachada(false), litS = texSuelo(true, C.porTrozo, (C.paso - C.manz) / C.paso), osS = texSuelo(false, C.porTrozo, (C.paso - C.manz) / C.paso);
    for (let bz = 0; bz < C.n; bz++) for (let bx = 0; bx < C.n; bx++) {
      const x = off + (bx + 0.5) * ts, z = off + (bz + 0.5) * ts, b = f(x, z), on = b > 0.5, em = on ? Math.min(1.6, b) : 0;
      h.push(V.nodo({ malla: mallaBarrio(C.sem, bx, bz, C.porTrozo, C.paso, C.manz, cen), pos: [off, 0, off], mat: { color: on ? '#ffffff' : '#9aa6c0', mapa: on ? litF : osF, emision: em * 0.95, esp: on ? 0 : 0.25, dureza: 30, envolver: 0.3, borde: on ? 0.1 : 0.35 } }));
      h.push(V.nodo({ malla: MA.plano(ts, ts, 1), pos: [x, 0.002, z], sinSombra: true, mat: { color: '#ffffff', mapa: on ? litS : osS, emision: on ? em : 0.05, esp: 0, envolver: 0.5, borde: 0 } }));
    }
    return V.nodo({ nombre: 'ciudad', hijos: h, pos: o.pos, rot: o.rot, esc: o.esc });
  };
  MO.ciudad.trozos = function (o = {}) { const C = opcCiudad(o), ts = C.porTrozo * C.paso, off = -C.L / 2, l = [];
    for (let bz = 0; bz < C.n; bz++) for (let bx = 0; bx < C.n; bx++) l.push({ x: off + (bx + 0.5) * ts, z: off + (bz + 0.5) * ts, s: ts }); return l; };
  MO.ciudad.lado = (o = {}) => opcCiudad(o).L;

  // ---------------------------------------------------------------- Sol
  function texSol() {
    return V.textura('sol', 1024, 512, (x, W, H) => {
      const r = VE.rng('sol'), g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff9a2a'); g.addColorStop(0.5, '#ffc04a'); g.addColorStop(1, '#ff9a2a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 9000; i++) { const px = r() * W, py = r() * H, rr = 2 + r() * 7; x.fillStyle = r() < 0.5 ? 'rgba(255,240,170,0.35)' : 'rgba(200,70,10,0.30)'; x.beginPath(); x.arc(px, py, rr, 0, 2 * PI); x.fill(); }
      for (let i = 0; i < 14; i++) { const px = r() * W, py = H * (0.3 + 0.4 * r()), rr = 5 + r() * 14; x.fillStyle = 'rgba(70,15,0,0.85)'; x.beginPath(); x.arc(px, py, rr, 0, 2 * PI); x.fill(); x.fillStyle = 'rgba(140,40,0,0.5)'; x.beginPath(); x.arc(px, py, rr * 1.8, 0, 2 * PI); x.fill(); }
    });
  }
  MO.sol = function (o = {}) {
    return V.nodo({ nombre: 'sol', pos: o.pos, esc: o.esc, rot: [0, (o.t || 0) * 0.05, 0.1], hijos: [V.nodo({ malla: MA.esfera(96), sinSombra: true, mat: { tipo: 'plano', color: '#ffffff', mapa: texSol() } }),
      V.nodo({ malla: MA.esfera(64), esc: 1.04, sinSombra: true, mat: { tipo: 'rayosx', color: '#ffb347', fresnel: 1.6, borde: 2.2, emision: 0.0 } })] });
  };

  // ---------------------------------------------------------------- auroras
  function texAurora(sem) {
    return V.textura('aurora|' + sem, 1024, 256, (x, W, H) => {
      const r = VE.rng('aur' + sem);
      for (let i = 0; i < W; i++) {
        const ondas = Math.pow(Math.abs(Math.sin(i * 0.031 + Math.sin(i * 0.007) * 3)), 1.5), rayos = Math.pow(r(), 2.2), k = 0.06 + 0.55 * ondas * (0.35 + 0.65 * rayos);
        const g = x.createLinearGradient(0, H, 0, 0);
        g.addColorStop(0, 'rgba(60,255,140,0)'); g.addColorStop(0.08, `rgba(110,255,170,${0.9 * k})`); g.addColorStop(0.3, `rgba(50,230,130,${0.55 * k})`);
        g.addColorStop(0.6, `rgba(150,80,255,${0.28 * k})`); g.addColorStop(0.82, `rgba(255,70,150,${0.1 * k})`); g.addColorStop(1, 'rgba(255,60,140,0)');
        x.fillStyle = g; x.fillRect(i, 0, 1, H);
      }
    });
  }
  /* Cortina vertical: base a y = 0, alto, ondulando en z. Malla dinamica (un nombre por cortina). */
  MO.aurora = function (o = {}) {
    const t = o.t || 0, an = o.ancho || 40, al = o.alto || 10, sem = o.semilla || 'a', am = o.onda || 3;
    const m = MA.parametrica(80, 6, (u, v) => { const x = (u - 0.5) * an; return [x, v * al * (0.8 + 0.2 * Math.sin(u * 9 + t * 0.7)), am * Math.sin(u * 5.3 + t * 0.35 + hash(sem.length)) + 0.6 * am * Math.sin(u * 13 - t * 0.6)]; }, { abierta: true, dinamica: 'aur|' + sem });
    return V.nodo({ nombre: 'aurora', malla: m, pos: o.pos, rot: o.rot, esc: o.esc, sinSombra: true, mat: { tipo: 'rayosx', color: '#ffffff', mapa: texAurora(sem), emision: 0.85 * (o.alfa == null ? 1 : o.alfa), fresnel: 1, borde: 0, alfa: o.alfa == null ? 1 : o.alfa, dobleCara: true, sinNiebla: true } });
  };
  MO.ovaloAurora = function (o = {}) {
    const t = o.t || 0, la0 = (o.lat || 66) * PI / 180, sem = 'oval';
    const m = MA.parametrica(160, 4, (u, v) => { const a = u * 2 * PI, la = la0 + 0.05 * Math.sin(a * 3 + t * 0.4) + 0.03 * Math.sin(a * 7 - t), r = 1.008 + v * 0.07;
      return [Math.cos(la) * Math.cos(a) * r, Math.sin(la) * r, Math.cos(la) * Math.sin(a) * r]; }, { abierta: true, dinamica: 'oval' });
    return V.nodo({ nombre: 'ovalo', malla: m, pos: o.pos, rot: o.rot, esc: o.esc, sinSombra: true, mat: { tipo: 'rayosx', color: '#ffffff', mapa: texAurora(sem), emision: o.alfa == null ? 1 : o.alfa, fresnel: 1, borde: 0, dobleCara: true, repetir: [6, 1] } });
  };

  // ---------------------------------------------------------------- torre de alta tension
  MO.torre = function (o = {}) {
    const m = MA.cache('torre', () => {
      const P = [], barra = (a, b, g = 0.035) => { const d = V.v3.res(b, a), L = V.v3.lon(d), mid = V.v3.por(V.v3.sum(a, b), 0.5), y = V.v3.norm(d);
        let x = V.v3.cruz(y, [0, 0, 1]); if (V.v3.lon(x) < 1e-3) x = V.v3.cruz(y, [1, 0, 0]); x = V.v3.norm(x); const z = V.v3.cruz(x, y), T = V.m4.id();
        T[0] = x[0]; T[1] = x[1]; T[2] = x[2]; T[4] = y[0]; T[5] = y[1]; T[6] = y[2]; T[8] = z[0]; T[9] = z[1]; T[10] = z[2]; T[12] = mid[0]; T[13] = mid[1]; T[14] = mid[2];
        P.push({ malla: MA.caja(g, L, g, 0), m: T }); };
      const w = (y) => 0.75 * (1 - y / 4.6) + 0.12, esq = (y, i) => [(i & 1 ? 1 : -1) * w(y), y, (i & 2 ? 1 : -1) * w(y)];
      const nv = [0, 0.8, 1.6, 2.4, 3.2, 3.9, 4.6];
      for (let i = 0; i < 4; i++) for (let k = 0; k < nv.length - 1; k++) barra(esq(nv[k], i), esq(nv[k + 1], i), 0.05);
      const lados = [[0, 1], [1, 3], [3, 2], [2, 0]];
      for (let k = 0; k < nv.length - 1; k++) for (const [a, b] of lados) { barra(esq(nv[k], a), esq(nv[k + 1], b), 0.025); barra(esq(nv[k], b), esq(nv[k + 1], a), 0.025); barra(esq(nv[k + 1], a), esq(nv[k + 1], b), 0.03); }
      for (const y of [3.2, 3.9]) { const L = y < 3.5 ? 1.9 : 1.4; for (const s of [-1, 1]) { barra([s * w(y), y, -0.15], [s * L, y, -0.08], 0.04); barra([s * w(y), y, 0.15], [s * L, y, 0.08], 0.04); barra([s * w(y), y - 0.35, 0], [s * L, y, 0], 0.03); } }
      barra([0, 4.6, 0], [0, 5.0, 0], 0.04);
      return MA.fusionar(P, 'torre|f');
    });
    const h = [V.nodo({ malla: m, mat: { color: o.color || '#8a93a3', esp: 0.5, dureza: 40, borde: 0.4 } })];
    for (const [x, y] of [[-1.75, 3.2], [1.75, 3.2], [-1.3, 3.9], [1.3, 3.9]]) h.push(V.nodo({ malla: MA.cilindro(0.06, 0.06, 0.4, 10), pos: [x, y - 0.22, 0], mat: { color: '#c9d6e0', esp: 0.8, dureza: 60, emision: o.aislador || 0 } }));
    return V.nodo({ nombre: 'torre', hijos: h, pos: o.pos, rot: o.rot, esc: o.esc });
  };
  MO.torre.puntas = [[-1.75, 2.98, 0], [1.75, 2.98, 0], [-1.3, 3.68, 0], [1.3, 3.68, 0]];   // donde cuelgan los cables

  // ---------------------------------------------------------------- transformador
  MO.transformador = function (o = {}) {
    const c = o.calor || 0, h = [], acero = { color: '#5e6b5a', esp: 0.45, dureza: 30, envolver: 0.2, borde: 0.5 };
    h.push(V.nodo({ nombre: 'cuba', malla: MA.caja(2.4, 2.0, 1.4, 0.06), pos: [0, 1.0, 0], mat: acero }));
    for (let i = 0; i < 12; i++) for (const s of [-1, 1]) h.push(V.nodo({ malla: MA.caja(0.04, 1.6, 0.5, 0.01), pos: [-1.05 + i * 0.19, 0.95, s * 0.98], mat: acero }));
    h.push(V.nodo({ malla: MA.cilindro(0.28, 0.28, 1.5, 24), pos: [0.2, 2.55, -0.45], rot: [0, 0, PI / 2], mat: acero }));         // depósito de expansión
    const tapa = o.tapa || [0, 0, 0];
    h.push(V.nodo({ nombre: 'tapa', malla: MA.caja(2.5, 0.08, 1.5, 0.02), pos: [tapa[0], 2.04 + tapa[1], tapa[2]], rot: [tapa[1] * 0.4, 0, tapa[1] * 0.25], mat: acero }));
    const perfil = []; for (let i = 0; i <= 12; i++) { const y = 1.2 - i * 0.1; perfil.push([i % 2 ? 0.1 : 0.17, y]); } perfil.unshift([0, 1.25]); perfil.push([0, 0]);
    const borna = MA.torno(perfil, 20, 'borna');
    (o.bornas || [[-0.7, 0, 0], [0, 0, 0], [0.7, 0, 0]]).forEach((b, i) => h.push(V.nodo({ nombre: 'borna' + i, malla: borna, pos: [-0.7 + 0.7 * i + b[0], 2.08 + b[1], 0.25 + b[2]], rot: [b[1] * 0.3 * (i - 1), 0, b[1] * 0.25 * (i - 1)], mat: { color: '#7d4a2e', esp: 0.8, dureza: 70, envolver: 0.2 } })));
    for (let i = 0; i < 3; i++) h.push(V.nodo({ nombre: 'bobina' + i, sinRayos: !o.rayos, oculto: !o.rayos, malla: MA.cilindro(0.3, 0.3, 1.4, 28), pos: [-0.72 + 0.72 * i, 1.0, 0],
      mat: { tipo: 'plano', color: c > 0.02 ? mezclar('#c86a2a', '#ffffff', c) : '#c86a2a', alfa: 1 } }));
    if (o.rayos) h.push(V.nodo({ nombre: 'nucleo', malla: MA.caja(2.1, 0.18, 0.5, 0), pos: [0, 1.78, 0], mat: { tipo: 'plano', color: mezclar('#556070', '#ff5020', c) } }));
    return V.nodo({ nombre: 'transformador', hijos: h, pos: o.pos, rot: o.rot, esc: o.esc });
  };
  function mezclar(a, b, k) { const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    const ki = Math.max(0, Math.min(1, k)); const m = A.map((v, i) => v + (B[i] - v) * (ki < 0.5 ? ki * 1.2 : 0.6 + (ki - 0.5) * 0.8)); return '#' + m.map(v => Math.round(Math.min(255, v)).toString(16).padStart(2, '0')).join(''); }
  MO.transformador.bornas = [[-0.7, 3.33, 0.25], [0, 3.33, 0.25], [0.7, 3.33, 0.25]];

  // ---------------------------------------------------------------- tractor y satelite
  MO.tractor = function (o = {}) {
    const g = o.ruedas || 0, verde = { color: o.color || '#2f8a3a', esp: 0.6, dureza: 50, envolver: 0.2 }, neg = { color: '#1a1a1a', esp: 0.15, dureza: 10 }, h = [];
    h.push(V.nodo({ malla: MA.caja(0.8, 0.55, 2.0, 0.08), pos: [0, 0.95, 0.25], mat: verde }));                  // capo
    h.push(V.nodo({ malla: MA.caja(1.05, 0.25, 1.1, 0.04), pos: [0, 0.75, -0.55], mat: { color: '#2b2b2b', esp: 0.3 } }));
    h.push(V.nodo({ malla: MA.caja(1.0, 1.0, 1.0, 0.04), pos: [0, 1.55, -0.55], mat: { color: '#9fd2ff', alfa: 0.45, esp: 0.95, dureza: 90, emision: 0.15 } }));   // cabina de cristal
    h.push(V.nodo({ malla: MA.caja(1.1, 0.07, 1.1, 0.02), pos: [0, 2.07, -0.55], mat: verde }));
    for (const [x, z] of [[-0.5, -0.05], [0.5, -0.05], [-0.5, -1.05], [0.5, -1.05]]) h.push(V.nodo({ malla: MA.cilindro(0.025, 0.025, 1.0, 6), pos: [x, 1.55, z], mat: neg }));
    h.push(V.nodo({ malla: MA.cilindro(0.05, 0.05, 0.8, 10), pos: [0.25, 1.5, 0.75], mat: { color: '#444', esp: 0.8 } }));
    const rueda = (x, z, r, a) => V.nodo({ pos: [x, r, z], rot: [g, 0, PI / 2], hijos: [V.nodo({ malla: MA.cilindro(r, r, a, 28), mat: neg }), V.nodo({ malla: MA.cilindro(r * 0.55, r * 0.55, a * 1.02, 20), mat: { color: '#f2c12e', esp: 0.5 } })] });
    h.push(rueda(-0.78, -0.75, 0.8, 0.5), rueda(0.78, -0.75, 0.8, 0.5), rueda(-0.62, 0.95, 0.45, 0.3), rueda(0.62, 0.95, 0.45, 0.3));
    h.push(V.nodo({ malla: MA.esfera(14), esc: [0.16, 0.16, 0.05], pos: [0, 2.15, -0.02], mat: { color: '#ff8a00', emision: o.baliza || 0.6, tipo: 'plano' } }));
    return V.nodo({ nombre: 'tractor', hijos: h, pos: o.pos, rot: o.rot, esc: o.esc });
  };
  MO.satelite = function (o = {}) {
    const h = [], panel = V.textura('panel', 128, 256, (x, W, H) => { x.fillStyle = '#0c1a4a'; x.fillRect(0, 0, W, H); x.strokeStyle = '#6f8fd8'; x.lineWidth = 2; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * W / 4, 0); x.lineTo(i * W / 4, H); x.stroke(); } for (let j = 0; j <= 8; j++) { x.beginPath(); x.moveTo(0, j * H / 8); x.lineTo(W, j * H / 8); x.stroke(); } });
    h.push(V.nodo({ malla: MA.caja(0.8, 0.8, 1.1, 0.03), mat: { color: '#d8b04a', esp: 0.9, dureza: 80 } }));
    for (const s of [-1, 1]) { h.push(V.nodo({ malla: MA.caja(2.2, 0.03, 0.9, 0), pos: [s * 1.6, 0, 0], mat: { color: '#ffffff', mapa: panel, esp: 0.9, dureza: 90 } })); h.push(V.nodo({ malla: MA.cilindro(0.03, 0.03, 0.5, 6), pos: [s * 0.45, 0, 0], rot: [0, 0, PI / 2], mat: { color: '#aaa' } })); }
    h.push(V.nodo({ malla: MA.cilindro(0.25, 0.05, 0.3, 18), pos: [0, -0.55, 0], mat: { color: '#e8e8e8', esp: 0.7 } }));
    return V.nodo({ nombre: 'satelite', hijos: h, pos: o.pos, rot: o.rot, esc: o.esc });
  };

  // ---------------------------------------------------------------- ayudas 2D
  const SPR = new Map();
  function sprite(color) {
    if (SPR.has(color)) return SPR.get(color); const c = lienzo(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color); g.addColorStop(0.18, color); g.addColorStop(0.45, color.replace(/,[\d.]+\)$/, ',0.35)')); g.addColorStop(1, color.replace(/,[\d.]+\)$/, ',0)'));
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); SPR.set(color, c); return c;
  }
  V.brillo = function (esc, x, y, r, color = 'rgba(255,190,90,1)', a = 1, modo = 'lighter') {
    if (a <= 0.003 || r <= 0.5) return; const c = esc.ctx; c.save(); c.globalCompositeOperation = modo; c.globalAlpha = Math.min(1, a); c.drawImage(sprite(color), x - r, y - r, 2 * r, 2 * r); c.restore();
  };
  V.chispas = function (esc, cam, o) {
    const r = VE.rng(o.semilla || 'ch'), c = esc.ctx, t = o.t, n = o.n || 260, g = o.g == null ? 9 : o.g, v0 = o.vel || 9; if (t < 0) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const th = r() * 2 * PI, ph = Math.acos(1 - r() * (o.cono || 1.6)), v = v0 * (0.3 + 0.9 * r()), vida = 0.5 + 1.6 * r(), d = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      const tt = t - r() * (o.escalonar || 0); if (tt < 0 || tt > vida) continue;
      const p = (q) => [o.origen[0] + d[0] * v * q, o.origen[1] + d[1] * v * q - 0.5 * g * q * q, o.origen[2] + d[2] * v * q];
      const a = V.proyectar(esc, cam, p(tt)), b = V.proyectar(esc, cam, p(Math.max(0, tt - 0.045))); if (!a.delante || !b.delante) continue;
      const vi = 1 - tt / vida;
      c.strokeStyle = `rgba(255,${180 + 70 * vi | 0},${80 + 160 * vi * vi | 0},${0.9 * vi + 0.1})`; c.lineWidth = (1.2 + 3.5 * vi) * esc.k * (o.grosor || 1);
      c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(a.x, a.y); c.stroke();
    }
    c.restore();
  };
  V.rayo = function (esc, a, b, t, o = {}) {
    const c = esc.ctx, r = VE.rng('rayo' + Math.floor(t * 24) + (o.semilla || '')), n = 14, pts = [];
    for (let i = 0; i <= n; i++) { const k = i / n, j = i === 0 || i === n ? 0 : (r() - 0.5) * (o.salto || 60) * esc.k; pts.push([a[0] + (b[0] - a[0]) * k + j, a[1] + (b[1] - a[1]) * k + j * 0.6]); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round';
    for (const [w, col] of [[14, 'rgba(120,160,255,0.25)'], [6, 'rgba(170,200,255,0.6)'], [2.2, 'rgba(255,255,255,1)']]) {
      c.strokeStyle = o.color && w > 3 ? o.color : col; c.lineWidth = w * esc.k * (o.ancho || 1); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    }
    c.restore();
  };
  /* Lineas de campo dipolar (eje Y, radio de la Tierra 1). k: compresion por el viento solar (0..1), sol: direccion al Sol. */
  V.campo = function (esc, cam, o = {}) {
    const k = o.k || 0, S = V.v3.norm(o.sol || [-1, 0, 0]), t = o.t || 0, c = esc.ctx, col = o.color || [110, 200, 255], cp = cam.pos;
    const tapa = (p) => { const d = V.v3.res(p, cp), L = V.v3.lon(d), u = V.v3.por(d, 1 / L), b = V.v3.punto(cp, u), cc = V.v3.punto(cp, cp) - 1, disc = b * b - cc; if (disc < 0) return false; const s = -b - Math.sqrt(disc); return s > 0 && s < L; };
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const L0 of o.capas || [1.8, 2.6, 3.6, 5.0]) for (let j = 0; j < (o.meridianos || 10); j++) {
      const lon = j / (o.meridianos || 10) * 2 * PI + 0.2, pts = []; const lmax = Math.acos(Math.sqrt(1 / L0));
      for (let i = 0; i <= 48; i++) {
        const la = -lmax + 2 * lmax * i / 48, r = L0 * Math.cos(la) * Math.cos(la);
        let p = [Math.cos(la) * Math.cos(lon) * r, Math.sin(la) * r, Math.cos(la) * Math.sin(lon) * r];
        const n = V.v3.norm(p), d = V.v3.punto(n, S), ecu = Math.cos(la);
        const f = 1 - 0.42 * k * Math.max(0, d) * ecu + 1.4 * k * Math.pow(Math.max(0, -d), 1.3) * ecu * (r / L0) + 0.05 * k * Math.sin(t * 9 + i * 0.6 + j);
        p = V.v3.por(p, f); if (d < 0) p = V.v3.sum(p, V.v3.por(S, -1.2 * k * Math.pow(-d, 2) * ecu * L0 * 0.4));
        pts.push(p);
      }
      const pr = pts.map(p => ({ q: V.proyectar(esc, cam, p), oc: tapa(p) }));
      for (const [w, a] of [[7, 0.10], [2.4, 0.55]]) {
        c.lineWidth = w * esc.k; c.beginPath(); let on = false;
        for (let i = 0; i < pr.length; i++) { const P = pr[i]; if (!P.q.delante || P.oc) { on = false; continue; } const pul = 0.6 + 0.4 * Math.sin(t * 4 - i * 0.35 + j); if (!on) { c.moveTo(P.q.x, P.q.y); on = true; } else c.lineTo(P.q.x, P.q.y); }
        c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a * (o.a == null ? 1 : o.a)})`; c.stroke();
      }
    }
    c.restore();
  };
})(window.VE = window.VE || {});
