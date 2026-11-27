/* VOLUMEN — MALLAS: generadores de geometria (todo por codigo). Cada funcion devuelve {pos, nor, uv, idx} y se guarda
   en cache por sus parametros, asi que llamarla en cada fotograma no cuesta nada.
     esfera(seg)                           radio 1, centrada
     capsula(r1, r2, largo, seg)           extremidad: de (0,0,0) hacia -Y, radio r1 arriba y r2 abajo (se estrecha)
     caja(w, h, d, bisel, seg)             caja con aristas redondeadas (bisel en unidades)
     cilindro(r1, r2, h, seg, tapas)       eje Y, centrado; r2 = 0 da un cono
     torno(perfil, seg, clave)             revolucion alrededor de Y de un perfil [[r, y], ...] de arriba a abajo
                                           (empezar y acabar con r = 0 para cerrarlo; un punto repetido = arista viva)
     toro(R, r, seg1, seg2)                anillo en el plano XZ
     extrusion(poli, prof, clave)          poligono 2D [[x,y]...] (plano XY) extruido en Z, centrado
     loft(secciones, clave, {tapas})       piel a traves de secciones cerradas 3D con el mismo numero de puntos (alas, cascos)
     plano(w, d, div)                      suelo en XZ, normal +Y
     tubo(puntos, radio, seg, {dinamica})  tubo a lo largo de una polilinea 3D (radio: numero o f(t) 0..1)
     parametrica(nu, nv, f, {clave, abierta, dinamica:'nombre'})   f(u, v) -> [x,y,z] con u, v en 0..1 (dinamica: oleaje, banderas)
     fusionar([{malla, m}], clave)         une varias mallas (con su matriz) en una sola: menos llamadas de dibujo */
(function (VE) {
  const V = VE.vol = VE.vol || {}, MA = V.malla = {}, CACHE = new Map(), PI = Math.PI;
  const guardar = (k, f) => { if (k != null && CACHE.has(k)) return CACHE.get(k); const m = f(); if (k != null) { m.clave = k; CACHE.set(k, m); } return m; };
  MA.cache = guardar;

  function hacer(pos, nor, uv, idx) {
    const n = pos.length / 3;
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: n > 65535 ? new Uint32Array(idx) : new Uint16Array(idx) };
  }
  /* Normales suaves por acumulacion de caras (para superficies sin normal analitica). */
  function normalesCaras(pos, idx) {
    const nor = new Float32Array(pos.length);
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const k of [a, b, c]) { nor[k] += nx; nor[k + 1] += ny; nor[k + 2] += nz; }
    }
    for (let i = 0; i < nor.length; i += 3) { const l = Math.hypot(nor[i], nor[i + 1], nor[i + 2]) || 1; nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l; }
    return nor;
  }
  /* Une las normales de vertices que comparten posicion (costuras de superficies cerradas). */
  function soldarNormales(pos, nor) {
    const mapa = new Map();
    for (let i = 0; i < pos.length; i += 3) { const k = Math.round(pos[i] * 1e4) + ',' + Math.round(pos[i + 1] * 1e4) + ',' + Math.round(pos[i + 2] * 1e4); (mapa.get(k) || mapa.set(k, []).get(k)).push(i); }
    for (const l of mapa.values()) { if (l.length < 2) continue; let x = 0, y = 0, z = 0; for (const i of l) { x += nor[i]; y += nor[i + 1]; z += nor[i + 2]; }
      const n = Math.hypot(x, y, z) || 1; for (const i of l) { nor[i] = x / n; nor[i + 1] = y / n; nor[i + 2] = z / n; } }
    return nor;
  }
  function rejilla(nu, nv) { const idx = []; for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); } return idx; }

  MA.parametrica = function (nu, nv, f, o = {}) {
    if (o.dinamica) { const m = MA.parametrica(nu, nv, f, { abierta: o.abierta }); return reutilizar(o.dinamica, Object.assign(m, { dinamica: true, abierta: o.abierta })); }   // se recalcula cada vez (oleaje, banderas)
    return guardar(o.clave, () => {
      const pos = [], uv = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv, p = f(u, v); pos.push(p[0], p[1], p[2]); uv.push(u, v); }
      const idx = rejilla(nu, nv), nor = soldarNormales(pos, normalesCaras(pos, idx));
      const m = hacer(pos, nor, uv, idx); if (o.abierta) m.abierta = true; return m;
    });
  };

  MA.esfera = function (seg = 48) {
    return guardar('esfera|' + seg, () => {
      const pos = [], nor = [], uv = [], nu = seg * 2, nv = seg;
      for (let j = 0; j <= nv; j++) { const th = j / nv * PI; for (let i = 0; i <= nu; i++) { const ph = i / nu * 2 * PI;
        const x = Math.sin(th) * Math.sin(ph), y = Math.cos(th), z = Math.sin(th) * Math.cos(ph); pos.push(x, y, z); nor.push(x, y, z); uv.push(i / nu, j / nv); } }
      return hacer(pos, nor, uv, rejilla(nu, nv));
    });
  };

  /* Revolucion de un perfil 2D [[r, y], ...] (de arriba a abajo). Normales del perfil (aristas vivas con puntos repetidos). */
  MA.torno = function (perfil, seg = 48, clave) {
    return guardar(clave === undefined ? 'torno|' + seg + '|' + JSON.stringify(perfil) : clave, () => {
      const P = perfil, n = P.length, N2 = [], L = [0];
      const igual = (a, b) => a && b && Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
      for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      for (let i = 0; i < n; i++) {
        let a = i - 1, b = i + 1;
        if (igual(P[i], P[i + 1])) b = i; else while (b < n && igual(P[b], P[i])) b++;
        if (igual(P[i], P[i - 1])) a = i; else while (a >= 0 && igual(P[a], P[i])) a--;
        const pa = P[Math.max(0, a)], pb = P[Math.min(n - 1, b)]; let tr = pb[0] - pa[0], ty = pb[1] - pa[1]; const l = Math.hypot(tr, ty) || 1; tr /= l; ty /= l;
        N2.push([-ty, tr]);                                    // normal hacia fuera (perfil de arriba a abajo)
      }
      const pos = [], nor = [], uv = [], tot = L[n - 1] || 1;
      for (let j = 0; j < n; j++) for (let i = 0; i <= seg; i++) { const ph = i / seg * 2 * PI, s = Math.sin(ph), c = Math.cos(ph), r = P[j][0];
        pos.push(r * s, P[j][1], r * c); nor.push(N2[j][0] * s, N2[j][1], N2[j][0] * c); uv.push(i / seg, L[j] / tot); }
      return hacer(pos, nor, uv, rejilla(seg, n - 1));
    });
  };
  /* Arco del perfil: puntos de una circunferencia (centro cy, radio r) entre los angulos a0 y a1 (0 = derecha, PI/2 = arriba). */
  MA.arco = (cy, r, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([Math.max(0, Math.cos(a) * r), cy + Math.sin(a) * r]); } return o; };

  MA.capsula = function (r1 = 0.2, r2 = r1, largo = 1, seg = 32) {
    return guardar(`capsula|${r1}|${r2}|${largo}|${seg}`, () => {
      const a = Math.asin(Math.max(-0.99, Math.min(0.99, (r1 - r2) / largo))), k = Math.max(6, seg >> 2);
      const perfil = MA.arco(0, r1, PI / 2, a, k).concat(MA.arco(-largo, r2, a, -PI / 2, k));
      return MA.torno(perfil, seg, null);
    });
  };

  MA.cilindro = function (r1 = 1, r2 = r1, h = 1, seg = 40, tapas = true) {
    return guardar(`cil|${r1}|${r2}|${h}|${seg}|${tapas}`, () => {
      const y0 = h / 2, y1 = -h / 2, p = [];
      if (tapas && r1 > 0) p.push([0, y0], [r1, y0]); p.push([r1, y0], [r2, y1]); if (tapas && r2 > 0) p.push([r2, y1], [0, y1]);
      return MA.torno(p, seg, null);
    });
  };

  MA.toro = function (R = 1, r = 0.25, s1 = 64, s2 = 24) {
    return guardar(`toro|${R}|${r}|${s1}|${s2}`, () => {
      const pos = [], nor = [], uv = [];
      for (let j = 0; j <= s2; j++) { const v = j / s2 * 2 * PI; for (let i = 0; i <= s1; i++) { const u = i / s1 * 2 * PI;
        const nx = Math.cos(v) * Math.cos(u), ny = Math.sin(v), nz = Math.cos(v) * Math.sin(u);
        pos.push(R * Math.cos(u) + r * nx, r * ny, R * Math.sin(u) + r * nz); nor.push(nx, ny, nz); uv.push(i / s1, j / s2); } }
      return hacer(pos, nor, uv, rejilla(s1, s2));
    });
  };

  MA.caja = function (w = 1, h = 1, d = 1, bisel = 0.08, seg = 4) {
    return guardar(`caja|${w}|${h}|${d}|${bisel}|${seg}`, () => {
      const hs = [w / 2, h / 2, d / 2], r = Math.min(bisel, ...hs.map(v => v * 0.999)), pos = [], nor = [], uv = [], idx = [];
      const coords = (s) => { if (r <= 0) return [-s, s]; const b = s - r, o = []; for (let i = 0; i <= seg; i++) o.push(-s + r * i / seg); if (b > 1e-6) o.push(b); else o.pop(); for (let i = 1; i <= seg; i++) o.push(b + r * i / seg); return b > 1e-6 ? o : o; };
      const C = hs.map(coords);
      // 6 caras: eje fijo k con signo sg, ejes libres (i, j)
      for (const [k, i, j] of [[0, 2, 1], [1, 0, 2], [2, 0, 1]]) for (const sg of [1, -1]) {
        const ci = C[i], cj = C[j], base = pos.length / 3;
        for (let b = 0; b < cj.length; b++) for (let a = 0; a < ci.length; a++) {
          const p = [0, 0, 0]; p[k] = sg * hs[k]; p[i] = ci[a]; p[j] = cj[b];
          if (r > 0) { const inn = p.map((v, q) => Math.max(-(hs[q] - r), Math.min(hs[q] - r, v))), dv = p.map((v, q) => v - inn[q]), l = Math.hypot(...dv) || 1, nn = dv.map(v => v / l);
            pos.push(inn[0] + nn[0] * r, inn[1] + nn[1] * r, inn[2] + nn[2] * r); nor.push(...nn); }
          else { pos.push(...p); const nn = [0, 0, 0]; nn[k] = sg; nor.push(...nn); }
          uv.push((ci[a] / hs[i] + 1) / 2, (cj[b] / hs[j] + 1) / 2);
        }
        const nu = ci.length - 1; for (let b = 0; b < cj.length - 1; b++) for (let a = 0; a < nu; a++) {
          const p0 = base + b * (nu + 1) + a, p1 = p0 + 1, p2 = p0 + nu + 1, p3 = p2 + 1;
          // orientacion segun la cara para que el frente mire hacia fuera
          const e1 = [0, 0, 0], e2 = [0, 0, 0]; e1[i] = 1; e2[j] = 1; const cz = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]][k] * sg;
          if (cz > 0) idx.push(p0, p1, p2, p1, p3, p2); else idx.push(p0, p2, p1, p1, p2, p3);
        }
      }
      return hacer(pos, nor, uv, idx);
    });
  };

  MA.plano = function (w = 10, d = 10, div = 1) {
    return guardar(`plano|${w}|${d}|${div}`, () => {
      const pos = [], nor = [], uv = [];
      for (let j = 0; j <= div; j++) for (let i = 0; i <= div; i++) { pos.push((i / div - 0.5) * w, 0, (j / div - 0.5) * d); nor.push(0, 1, 0); uv.push(i / div, j / div); }
      return hacer(pos, nor, uv, rejilla(div, div));
    });
  };

  /* Triangulacion por orejas (poligonos simples, cualquier sentido). */
  function triangular(P) {
    let area = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1]; }
    const ids = P.map((_, i) => i); if (area < 0) ids.reverse(); const out = [];
    const cruz = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const dentro = (p, a, b, c) => cruz(a, b, p) >= 0 && cruz(b, c, p) >= 0 && cruz(c, a, p) >= 0;
    let guard = 0;
    while (ids.length > 3 && guard++ < 10000) {
      let hecho = false;
      for (let i = 0; i < ids.length; i++) {
        const ia = ids[(i + ids.length - 1) % ids.length], ib = ids[i], ic = ids[(i + 1) % ids.length], a = P[ia], b = P[ib], c = P[ic];
        if (cruz(a, b, c) <= 1e-12) continue;
        if (ids.some(j => j !== ia && j !== ib && j !== ic && dentro(P[j], a, b, c))) continue;
        out.push(ia, ib, ic); ids.splice(i, 1); hecho = true; break;
      }
      if (!hecho) break;
    }
    if (ids.length === 3) out.push(ids[0], ids[1], ids[2]);
    return out;                                      // triangulos en sentido antihorario
  }
  MA.triangular = triangular;

  MA.extrusion = function (poli, prof = 0.2, clave) {
    return guardar(clave === undefined ? 'ext|' + prof + '|' + JSON.stringify(poli) : clave, () => {
      const pos = [], nor = [], uv = [], idx = [], n = poli.length, z = prof / 2, T = triangular(poli);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; poli.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
      const U = (p) => [(p[0] - x0) / (x1 - x0 || 1), (p[1] - y0) / (y1 - y0 || 1)];
      for (const sg of [1, -1]) { const b = pos.length / 3; poli.forEach(p => { pos.push(p[0], p[1], sg * z); nor.push(0, 0, sg); uv.push(...U(p)); });
        for (let i = 0; i < T.length; i += 3) sg > 0 ? idx.push(b + T[i], b + T[i + 1], b + T[i + 2]) : idx.push(b + T[i], b + T[i + 2], b + T[i + 1]); }
      let area = 0; for (let i = 0; i < n; i++) { const a = poli[i], b = poli[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; } const s = area > 0 ? 1 : -1;
      for (let i = 0; i < n; i++) { const a = poli[i], b = poli[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = dy / l * s, ny = -dx / l * s, k = pos.length / 3;
        pos.push(a[0], a[1], z, b[0], b[1], z, a[0], a[1], -z, b[0], b[1], -z); for (let q = 0; q < 4; q++) nor.push(nx, ny, 0); uv.push(0, 0, 1, 0, 0, 1, 1, 1);
        if (s > 0) idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); else idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      return hacer(pos, nor, uv, idx);
    });
  };

  /* Piel a traves de secciones cerradas (cada una lista de [x,y,z], mismo numero de puntos y mismo sentido). */
  MA.loft = function (sec, clave, o = {}) {
    return guardar(clave, () => {
      const ns = sec.length, np = sec[0].length, pos = [], uv = [], idx = [];
      for (let j = 0; j < ns; j++) for (let i = 0; i <= np; i++) { const p = sec[j][i % np]; pos.push(p[0], p[1], p[2]); uv.push(i / np, j / (ns - 1)); }
      for (let j = 0; j < ns - 1; j++) for (let i = 0; i < np; i++) { const a = j * (np + 1) + i, b = a + 1, c = a + np + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      if (o.tapas !== false) for (const j of [0, ns - 1]) {
        const s = sec[j], cx = s.reduce((q, p) => [q[0] + p[0] / np, q[1] + p[1] / np, q[2] + p[2] / np], [0, 0, 0]), k = pos.length / 3; pos.push(...cx); uv.push(0.5, j ? 1 : 0);
        const b = j * (np + 1); for (let i = 0; i < np; i++) j ? idx.push(b + i, b + i + 1, k) : idx.push(b + i + 1, b + i, k);
      }
      let nor = normalesCaras(pos, idx); nor = soldarNormales(pos, nor);
      // orientar hacia fuera: si la mayoria de normales apuntan al centro, invertir
      let c = [0, 0, 0]; for (let i = 0; i < pos.length; i += 3) { c[0] += pos[i]; c[1] += pos[i + 1]; c[2] += pos[i + 2]; } c = c.map(v => v / (pos.length / 3));
      let dd = 0; for (let i = 0; i < pos.length; i += 3) dd += (pos[i] - c[0]) * nor[i] + (pos[i + 1] - c[1]) * nor[i + 1] + (pos[i + 2] - c[2]) * nor[i + 2];
      if (dd < 0) { for (let i = 0; i < nor.length; i++) nor[i] = -nor[i]; for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } }
      return hacer(pos, nor, uv, idx);
    });
  };

  /* Tubo por una polilinea 3D con marcos de transporte paralelo. radio: numero o f(t). dinamica: se recalcula cada vez (estelas). */
  MA.tubo = function (pts, radio = 0.05, seg = 12, o = {}) {
    const f = () => {
      const n = pts.length, pos = [], nor = [], uv = [], v3 = V.v3; if (n < 2) return hacer([0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0], [0, 1, 2]);
      const T = pts.map((p, i) => v3.norm(v3.res(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
      let N = Math.abs(T[0][1]) < 0.9 ? v3.norm(v3.cruz(T[0], [0, 1, 0])) : v3.norm(v3.cruz(T[0], [1, 0, 0]));
      for (let i = 0; i < n; i++) {
        if (i > 0) { const b = v3.cruz(T[i - 1], T[i]); if (v3.lon(b) > 1e-6) { const ax = v3.norm(b), an = Math.acos(Math.max(-1, Math.min(1, v3.punto(T[i - 1], T[i])))); N = rotar(N, ax, an); } }
        const B = v3.cruz(T[i], N), t = i / (n - 1), r = typeof radio === 'function' ? radio(t) : radio;
        for (let k = 0; k <= seg; k++) { const a = k / seg * 2 * PI, c = Math.cos(a), s = Math.sin(a), d = [N[0] * c + B[0] * s, N[1] * c + B[1] * s, N[2] * c + B[2] * s];
          pos.push(pts[i][0] + d[0] * r, pts[i][1] + d[1] * r, pts[i][2] + d[2] * r); nor.push(...d); uv.push(k / seg, t); }
      }
      return hacer(pos, nor, uv, rejilla(seg, n - 1));
    };
    if (o.dinamica) { const m = f(); m.dinamica = true; return reutilizar(o.dinamica, m); }
    return guardar(o.clave, f);
  };
  // Las mallas dinamicas reutilizan el mismo objeto (mismos buffers GL) entre fotogramas: se identifica por un nombre.
  const DIN = new Map();
  function reutilizar(nombre, m) { const k = typeof nombre === 'string' ? nombre : 'din'; const prev = DIN.get(k);
    if (prev) { prev.dinamica = true; prev.pos = m.pos; prev.nor = m.nor; prev.uv = m.uv; prev.idx = m.idx; prev.version = (prev.version || 0) + 1; return prev; }
    m.version = 1; DIN.set(k, m); return m; }
  function rotar(v, k, a) { const c = Math.cos(a), s = Math.sin(a), d = V.v3.punto(k, v), x = V.v3.cruz(k, v); return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)]; }
  V.v3rotar = rotar;

  MA.fusionar = function (partes, clave) {
    return guardar(clave, () => {
      const pos = [], nor = [], uv = [], idx = [];
      for (const { malla: m, m: T } of partes) {
        const b = pos.length / 3, NM = T ? V.m4.normal(T) : null;
        for (let i = 0; i < m.pos.length; i += 3) {
          const p = T ? V.m4.ap(T, [m.pos[i], m.pos[i + 1], m.pos[i + 2]]) : [m.pos[i], m.pos[i + 1], m.pos[i + 2]]; pos.push(...p);
          let n = [m.nor[i], m.nor[i + 1], m.nor[i + 2]]; if (NM) { n = [NM[0] * n[0] + NM[3] * n[1] + NM[6] * n[2], NM[1] * n[0] + NM[4] * n[1] + NM[7] * n[2], NM[2] * n[0] + NM[5] * n[1] + NM[8] * n[2]]; n = V.v3.norm(n); }
          nor.push(...n);
        }
        for (let i = 0; i < m.uv.length; i++) uv.push(m.uv[i]); for (let i = 0; i < m.idx.length; i++) idx.push(m.idx[i] + b);
      }
      return hacer(pos, nor, uv, idx);
    });
  };
})(window.VE = window.VE || {});
