/* VOLUMEN — ORGÁNICO: cuerpos de una sola malla continua que se deforman con un esqueleto (para animales y personajes).
   Se describe el cuerpo en reposo como una función de distancia (piezas unidas con uniones suaves), se convierte una vez
   en malla (surface nets), se reparte por zonas de color con bordes limpios y cada vértice se mueve con la mezcla de
   sus huesos (skinning lineal). Lo usan marinos.js (tiburón y ballena).

     const R = V.organico.preparar({ f, caja: [[x0,y0,z0],[x1,y1,z1]], paso, zona(p) -> 'nombre', pesos(p) -> [[hueso, peso], ...],
                                      frontera(zonaA, zonaB, p) -> f(p) | null })           // una vez (queda en caché por 'clave')
     const nodos = V.organico.deformar(R, matricesHuesos, id, { zona: material, ... })       // cada fotograma
   Utilidades de distancia: V.organico.sd = { smin, smax, ell, capR, aleta } */
(function (VE) {
  const V = VE.vol, M4 = V.m4, O = V.organico = {}, CACHE = new Map(), DIN = new Map();
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const smin = (a, b, k) => { const h = cl(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };
  const smax = (a, b, k) => -smin(-a, -b, k);
  const ell = (x, y, z, c, r) => { const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2], k0 = Math.hypot(px, py, pz), k1 = Math.hypot(px / r[0], py / r[1], pz / r[2]); return k0 * (k0 - 1) / (k1 || 1e-9); };
  const capR = (x, y, z, a, b, r1, r2) => { const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], px = x - a[0], py = y - a[1], pz = z - a[2], h = cl((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz), 0, 1);
    return Math.hypot(px - bx * h, py - by * h, pz - bz * h) - (r1 + (r2 - r1) * h); };
  /* Aleta: polígono 2D (en el plano de u, v) con grosor que se afina hacia el borde. o = origen, u, v = ejes del plano (unitarios), poli = [[a,b],...] */
  function dPoli(a, b, poli) { let d = 1e9, s = 1; for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) { const [xi, yi] = poli[i], [xj, yj] = poli[j], ex = xj - xi, ey = yj - yi, wx = a - xi, wy = b - yi, h = cl((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
      d = Math.min(d, Math.hypot(wx - ex * h, wy - ey * h)); if ((yi > b) !== (yj > b) && a < (xj - xi) * (b - yi) / (yj - yi) + xi) s = -s; } return s * d; }
  const aleta = (x, y, z, o, u, v, poli, grosor) => { const px = x - o[0], py = y - o[1], pz = z - o[2], a = px * u[0] + py * u[1] + pz * u[2], b = px * v[0] + py * v[1] + pz * v[2], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], w = px * n[0] + py * n[1] + pz * n[2];
    const d2 = dPoli(a, b, poli), g = grosor * cl(0.5 - d2 * 5, 0.5, 1); return Math.hypot(Math.max(d2, 0), Math.max(Math.abs(w) - g, 0)) + Math.min(Math.max(d2, Math.abs(w) - g), 0); };
  O.sd = { cl, smin, smax, ell, capR, aleta, dPoli };
  const grad = (f, x, y, z, e = 0.0008) => { const g = [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)], l = Math.hypot(...g) || 1; return [g[0] / l, g[1] / l, g[2] / l]; };
  O.grad = grad;

  O.preparar = function (o) {
    if (o.clave && CACHE.has(o.clave)) return CACHE.get(o.clave);
    const f = o.f, h = o.paso, [b0, b1] = o.caja, nx = Math.ceil((b1[0] - b0[0]) / h) + 1, ny = Math.ceil((b1[1] - b0[1]) / h) + 1, nz = Math.ceil((b1[2] - b0[2]) / h) + 1;
    const F = new Float32Array(nx * ny * nz), I = (i, j, k) => i + nx * (j + ny * k);
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[I(i, j, k)] = f(b0[0] + i * h, b0[1] + j * h, b0[2] + k * h);
    const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], AR = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    const cx = nx - 1, cy = ny - 1, cz = nz - 1, vid = new Int32Array(cx * cy * cz).fill(-1), P = [], CI = (i, j, k) => i + cx * (j + cy * k);
    for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
      const v = C.map(c => F[I(i + c[0], j + c[1], k + c[2])]); let neg = 0; for (const q of v) if (q < 0) neg++; if (!neg || neg === 8) continue;
      let sx = 0, sy = 0, sz = 0, n = 0; for (const [a, b] of AR) { if ((v[a] < 0) === (v[b] < 0)) continue; const t = v[a] / (v[a] - v[b]); sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t; n++; }
      vid[CI(i, j, k)] = P.length; P.push([b0[0] + (i + sx / n) * h, b0[1] + (j + sy / n) * h, b0[2] + (k + sz / n) * h]); }
    const ajustar = (p) => { for (let it = 0; it < 2; it++) { const d = f(...p), g = grad(f, ...p); p[0] -= g[0] * d; p[1] -= g[1] * d; p[2] -= g[2] * d; } };
    P.forEach(ajustar); const N = P.map(p => grad(f, ...p));
    const T = [], tri = (a, b, c) => { if (a < 0 || b < 0 || c < 0) return; const pa = P[a], pb = P[b], pc = P[c], u = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]], w = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]], fn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], nn = N[a];
      if (fn[0] * nn[0] + fn[1] * nn[1] + fn[2] * nn[2] < 0) T.push(a, c, b); else T.push(a, b, c); };
    const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
    for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 0; i < cx; i++) if ((F[I(i, j, k)] < 0) !== (F[I(i + 1, j, k)] < 0)) quad(vid[CI(i, j - 1, k - 1)], vid[CI(i, j, k - 1)], vid[CI(i, j, k)], vid[CI(i, j - 1, k)]);
    for (let k = 1; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 1; i < cx; i++) if ((F[I(i, j, k)] < 0) !== (F[I(i, j + 1, k)] < 0)) quad(vid[CI(i - 1, j, k - 1)], vid[CI(i, j, k - 1)], vid[CI(i, j, k)], vid[CI(i - 1, j, k)]);
    for (let k = 0; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) if ((F[I(i, j, k)] < 0) !== (F[I(i, j, k + 1)] < 0)) quad(vid[CI(i - 1, j - 1, k)], vid[CI(i, j - 1, k)], vid[CI(i, j, k)], vid[CI(i - 1, j, k)]);
    // zonas de color por triángulo y bordes limpios (los vértices entre dos zonas se llevan a la línea de la frontera)
    const zt = []; for (let t = 0; t < T.length; t += 3) { const a = P[T[t]], b = P[T[t + 1]], c = P[T[t + 2]]; zt.push(o.zona([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3])); }
    if (o.frontera) { const vz = new Map(); zt.forEach((z, k) => { for (let j = 0; j < 3; j++) { const v = T[k * 3 + j]; (vz.get(v) || vz.set(v, new Set()).get(v)).add(z); } });
      for (const [v, set] of vz) { if (set.size !== 2) continue; const [za, zb] = [...set], fr = o.frontera(za, zb, P[v]); if (!fr) continue; const p = P[v];
        for (let it = 0; it < 4; it++) { const e = 0.0008, fv = fr(p), g = [(fr([p[0] + e, p[1], p[2]]) - fr([p[0] - e, p[1], p[2]])) / (2 * e), (fr([p[0], p[1] + e, p[2]]) - fr([p[0], p[1] - e, p[2]])) / (2 * e), (fr([p[0], p[1], p[2] + e]) - fr([p[0], p[1], p[2] - e])) / (2 * e)], g2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2] || 1;
          const k = Math.min(1, h * 0.6 / (Math.abs(fv) / Math.sqrt(g2) + 1e-9)); p[0] -= fv * g[0] / g2 * k; p[1] -= fv * g[1] / g2 * k; p[2] -= fv * g[2] / g2 * k; ajustar(p); }
        N[v] = grad(f, ...p); } }
    const nV = P.length, pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), hb = new Uint8Array(nV * 3), hw = new Float32Array(nV * 3);
    P.forEach((p, i) => { pos.set(p, i * 3); nor.set(N[i], i * 3); const l = o.pesos(p).slice().sort((a, b) => b[1] - a[1]).slice(0, 3), s = l.reduce((a, b) => a + b[1], 0) || 1; l.forEach(([b, w], j) => { hb[i * 3 + j] = b; hw[i * 3 + j] = w / s; }); });
    const sub = {}; for (let t = 0; t < T.length; t += 3) (sub[zt[t / 3]] = sub[zt[t / 3]] || []).push(T[t], T[t + 1], T[t + 2]);
    const zonas = {}; for (const z in sub) { const mapa = new Map(), glob = [], idx = []; for (const v of sub[z]) { if (!mapa.has(v)) { mapa.set(v, glob.length); glob.push(v); } idx.push(mapa.get(v)); }
      zonas[z] = { glob: Uint32Array.from(glob), idx: glob.length > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx) }; }
    const R = { pos, nor, hb, hw, zonas, nV }; if (o.clave) CACHE.set(o.clave, R); return R;
  };

  /* Mueve la malla con los huesos (matrices de reposo -> pose) y devuelve un nodo por zona con su material. */
  O.deformar = function (R, B, id, mats) {
    const { pos, nor, hb, hw, nV } = R; if (!DIN.has(id)) DIN.set(id, { pos: new Float32Array(nV * 3), nor: new Float32Array(nV * 3), sub: {} });
    const D = DIN.get(id), op = D.pos, on = D.nor;
    for (let i = 0; i < nV; i++) { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], a = nor[i * 3], b = nor[i * 3 + 1], c = nor[i * 3 + 2]; let px = 0, py = 0, pz = 0, qx = 0, qy = 0, qz = 0;
      for (let j = 0; j < 3; j++) { const w = hw[i * 3 + j]; if (!w) continue; const m = B[hb[i * 3 + j]];
        px += w * (m[0] * x + m[4] * y + m[8] * z + m[12]); py += w * (m[1] * x + m[5] * y + m[9] * z + m[13]); pz += w * (m[2] * x + m[6] * y + m[10] * z + m[14]);
        qx += w * (m[0] * a + m[4] * b + m[8] * c); qy += w * (m[1] * a + m[5] * b + m[9] * c); qz += w * (m[2] * a + m[6] * b + m[10] * c); }
      const l = Math.hypot(qx, qy, qz) || 1; op[i * 3] = px; op[i * 3 + 1] = py; op[i * 3 + 2] = pz; on[i * 3] = qx / l; on[i * 3 + 1] = qy / l; on[i * 3 + 2] = qz / l; }
    const nodos = [];
    for (const z in R.zonas) { const Z = R.zonas[z]; let m = D.sub[z];
      if (!m) m = D.sub[z] = { pos: new Float32Array(Z.glob.length * 3), nor: new Float32Array(Z.glob.length * 3), uv: new Float32Array(Z.glob.length * 2), idx: Z.idx, dinamica: true, version: 0, clave: 'org|' + id + '|' + z };
      for (let k = 0; k < Z.glob.length; k++) { const g = Z.glob[k] * 3; m.pos[k * 3] = op[g]; m.pos[k * 3 + 1] = op[g + 1]; m.pos[k * 3 + 2] = op[g + 2]; m.nor[k * 3] = on[g]; m.nor[k * 3 + 1] = on[g + 1]; m.nor[k * 3 + 2] = on[g + 2]; }
      m.version++; nodos.push(V.nodo({ nombre: id + '_' + z, malla: m, mat: mats[z] || { color: '#888888' } })); }
    return nodos;
  };
  O.pivote = (p, R) => M4.mul(M4.mul(M4.tras(p[0], p[1], p[2]), R), M4.tras(-p[0], -p[1], -p[2]));
})(window.VE = window.VE || {});
