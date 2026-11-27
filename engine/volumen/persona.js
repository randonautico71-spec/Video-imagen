/* VOLUMEN — PERSONA: personaje 3D de cuerpo entero (una sola malla continua, sin piezas ni bolas en las articulaciones)
   que se deforma con un esqueleto (skinning), con ropa por zonas y cara pintada (ojos, brillo, cejas, boca y colorete).

     V.modelos.persona({ pose, pos, rot, esc, apoyo: 'pies', suelo, id, colores, cara, t })
       pose:    las mismas poses que el maniqui (V.poses, V.pose.andar/correr/mezclar) y además V.pose.paseo(fase)
                (andar natural: tobillos que despegan, giro de hombros contra caderas) y V.pose.saludo(t).
                Claves extra: giro, balanceo, mirar (girar la cabeza), abrir_d / abrir_i (separar cada brazo por su cuenta),
                rotar_d / rotar_i (girar el brazo sobre su eje: para saludar con el antebrazo hacia arriba).
       id:      nombre único por personaje en la escena (cada uno tiene sus propias mallas dinámicas)
       colores: { piel, pelo, camiseta, pantalon, zapatos, ojos, boca, colorete }
       cara:    { sonrisa: -1..1, boca: 0..1 (abierta, para hablar), cejas: -1..1 (tristes..sorprendidas),
                  parpadeo: 0..1 (si no se da, parpadea solo con t), mirada: [dx, dy] (-1..1) }
       t:       segundos (parpadeo automático y respiración)

   Cómo está hecho: el cuerpo en reposo se define como una función de distancia (elipsoides y cápsulas unidas con
   uniones suaves, así hombros, axilas, cuello y caderas salen de una pieza) y se convierte una vez en malla
   (surface nets). Cada vértice tiene pesos de hasta 3 huesos; en cada fotograma se mueve con la mezcla de sus huesos
   (skinning lineal). La cara se pinta encima en el hueso de la cabeza. Coste: la malla se crea una vez (~1 s);
   cada fotograma solo transforma ~15 000 vértices. Revisión: demo/volumen.html?modo=persona */
(function (VE) {
  const V = VE.vol, MA = V.malla, M4 = V.m4, PI = Math.PI, D = PI / 180;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const smin = (a, b, k) => { const h = cl(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };
  const ell = (x, y, z, c, r) => { const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2], k0 = Math.hypot(px, py, pz), k1 = Math.hypot(px / r[0], py / r[1], pz / r[2]); return k0 * (k0 - 1) / (k1 || 1e-9); };
  const capR = (x, y, z, a, b, r1, r2) => { const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], px = x - a[0], py = y - a[1], pz = z - a[2], h = cl((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz), 0, 1);
    return Math.hypot(px - bx * h, py - by * h, pz - bz * h) - (r1 + (r2 - r1) * h); };
  const segD = (p, a, b) => { const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], px = p[0] - a[0], py = p[1] - a[1], pz = p[2] - a[2], h = cl((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz), 0, 1); return [Math.hypot(px - bx * h, py - by * h, pz - bz * h), h]; };
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

  // ---------------------------------------------------------------- esqueleto en reposo (origen = centro de la pelvis, mira a +X, Z = lado)
  const A0 = 14;   // brazos algo separados del cuerpo en reposo (así no se pegan al tronco)
  const G = { cuelloJ: [0, 0.47, 0], troncoJ: [0, 0.06, 0], cabeza: [0.02, 0.685, 0] };
  for (const s of [1, -1]) { const L = s > 0 ? 'd' : 'i', dir = [0, -Math.cos(A0 * D), s * Math.sin(A0 * D)], S = [0, 0.385, s * 0.19], E = add(S, dir, 0.29), W = add(E, dir, 0.25), H = [0, -0.02, s * 0.095], K = add(H, [0, -0.43, 0]), A = add(K, [0, -0.42, 0]);
    G['hombro_' + L] = S; G['codo_' + L] = E; G['muneca_' + L] = W; G['mano_' + L] = add(W, dir, 0.12); G['dir_' + L] = dir; G['cadera_' + L] = H; G['rodilla_' + L] = K; G['tobillo_' + L] = A; G['punta_' + L] = add(A, [0.17, -0.055, 0]); }

  const HS = 1.12, HC = [0.02, 0.6, 0];   // cabeza algo grande (más expresiva), escalada desde la barbilla
  const escH = (f) => (x, y, z) => f(HC[0] + (x - HC[0]) / HS, HC[1] + (y - HC[1]) / HS, z / HS) * HS;
  // piezas del cuerpo (distancias) en reposo
  function cabeza0(x, y, z) {
    let h = ell(x, y, z, [0.02, 0.685, 0], [0.112, 0.128, 0.104]);
    h = smin(h, ell(x, y, z, [0.045, 0.633, 0], [0.086, 0.075, 0.086]), 0.05);
    h = smin(h, ell(x, y, z, [0.127, 0.664, 0], [0.019, 0.024, 0.016]), 0.016);   // nariz pequeña
    for (const s of [1, -1]) h = smin(h, ell(x, y, z, [-0.004, 0.672, s * 0.1], [0.022, 0.032, 0.014]), 0.012);   // orejas
    return h; }
  function pelo0(x, y, z) { const e = ell(x, y, z, [-0.006, 0.71, 0], [0.122, 0.13, 0.113]); return Math.max(e, Math.min(0.742 - y + 0.3 * Math.max(0, x - 0.04), x + 0.025)); }
  const cabezaD = escH(cabeza0), peloD = escH(pelo0);
  function troncoD(x, y, z) {
    let t = ell(x, y, z, [0, 0.02, 0], [0.125, 0.115, 0.165]);
    t = smin(t, ell(x, y, z, [0.012, 0.16, 0], [0.115, 0.12, 0.15]), 0.07);
    t = smin(t, ell(x, y, z, [0, 0.31, 0], [0.125, 0.15, 0.172]), 0.07);
    t = smin(t, capR(x, y, z, [0, 0.385, -0.165], [0, 0.385, 0.165], 0.062, 0.062), 0.06);
    return smin(t, capR(x, y, z, [0.0, 0.43, 0], [0.012, 0.56, 0], 0.058, 0.052), 0.05); }
  function brazoD(x, y, z, L) { const S = G['hombro_' + L], E = G['codo_' + L], W = G['muneca_' + L], d = G['dir_' + L];
    let a = capR(x, y, z, S, E, 0.056, 0.044); a = smin(a, capR(x, y, z, E, W, 0.043, 0.033), 0.025);
    a = smin(a, capR(x, y, z, add(W, d, 0.02), add(W, d, 0.105), 0.036, 0.031), 0.02);
    return smin(a, capR(x, y, z, add(add(W, d, 0.035), [0.022, 0, 0]), add(add(W, d, 0.075), [0.045, 0, 0]), 0.014, 0.012), 0.01); }
  function piernaD(x, y, z, L) { const H = G['cadera_' + L], K = G['rodilla_' + L], A = G['tobillo_' + L];
    let l = capR(x, y, z, H, K, 0.08, 0.055); l = smin(l, capR(x, y, z, K, A, 0.053, 0.037), 0.03);
    const pie = Math.max(capR(x, y, z, add(A, [-0.035, -0.042, 0]), add(A, [0.125, -0.045, 0]), 0.05, 0.045), -(y - (A[1] - 0.088)));
    return smin(l, pie, 0.03); }
  const PIEZAS = ['tronco', 'cabeza', 'pelo', 'brazo_d', 'brazo_i', 'pierna_d', 'pierna_i'];
  function piezas(x, y, z) { return [troncoD(x, y, z), cabezaD(x, y, z), peloD(x, y, z), brazoD(x, y, z, 'd'), brazoD(x, y, z, 'i'), piernaD(x, y, z, 'd'), piernaD(x, y, z, 'i')]; }
  function cuerpoD(x, y, z) { const p = piezas(x, y, z); let d = smin(p[0], p[1], 0.03); d = smin(d, p[2], 0.012); d = smin(d, p[3], 0.04); d = smin(d, p[4], 0.04); d = smin(d, p[5], 0.05); return smin(d, p[6], 0.05); }
  const grad = (f, x, y, z, e = 0.0007) => { const g = [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)], l = Math.hypot(...g) || 1; return [g[0] / l, g[1] / l, g[2] / l]; };

  // ---------------------------------------------------------------- malla de reposo (surface nets), zonas de ropa y pesos de huesos
  const HUESOS = ['pelvis', 'tronco', 'cuello', 'hombro_d', 'hombro_i', 'codo_d', 'codo_i', 'cadera_d', 'cadera_i', 'rodilla_d', 'rodilla_i', 'tobillo_d', 'tobillo_i'];
  const SEG = { pelvis: [[0, -0.07, 0], [0, 0.08, 0]], tronco: [[0, 0.13, 0], [0, 0.42, 0]], cuello: [[0.01, 0.47, 0], [0.02, 0.8, 0]] };
  for (const L of ['d', 'i']) { SEG['hombro_' + L] = [G['hombro_' + L], G['codo_' + L]]; SEG['codo_' + L] = [G['codo_' + L], G['mano_' + L]]; SEG['cadera_' + L] = [G['cadera_' + L], G['rodilla_' + L]]; SEG['rodilla_' + L] = [G['rodilla_' + L], G['tobillo_' + L]]; SEG['tobillo_' + L] = [G['tobillo_' + L], G['punta_' + L]]; }
  const CANDIDATOS = { tronco: ['pelvis', 'tronco', 'cuello', 'hombro_d', 'hombro_i', 'cadera_d', 'cadera_i'], cabeza: ['cuello'], pelo: ['cuello'],
    brazo_d: ['tronco', 'hombro_d', 'codo_d'], brazo_i: ['tronco', 'hombro_i', 'codo_i'], pierna_d: ['pelvis', 'cadera_d', 'rodilla_d', 'tobillo_d'], pierna_i: ['pelvis', 'cadera_i', 'rodilla_i', 'tobillo_i'] };
  // fronteras de la ropa como funciones (f = 0 en el borde): se usan para clasificar y para alinear los vértices del borde
  const manga = (p) => { const L = p[2] > 0 ? 'd' : 'i'; return segD(p, G['hombro_' + L], G['codo_' + L])[1] - 0.42; };
  const cintura = (p) => p[1] - (0.045 + 0.02 * p[0]), cuelloC = (p) => p[1] - (0.437 + 0.05 * Math.max(0, p[0])), tobilloC = (p) => p[1] - (G.tobillo_d[1] + 0.035);
  const nacimiento = (p) => { const x = HC[0] + (p[0] - HC[0]) / HS, y = HC[1] + (p[1] - HC[1]) / HS; return Math.min(0.742 - y + 0.3 * Math.max(0, x - 0.04), x + 0.025); };
  function frontera(a, b, p) { const k = [a, b].sort().join('|');
    if (k === 'camiseta|pantalon') return cintura; if (k === 'pantalon|zapatos') return tobilloC; if (k === 'pelo|piel') return nacimiento;
    if (k === 'camiseta|piel') return Math.abs(p[2]) > 0.15 && p[1] < 0.43 ? manga : cuelloC; return null; }
  function zona(p) { const d = piezas(p[0], p[1], p[2]); let k = 0; for (let i = 1; i < d.length; i++) if (d[i] < d[k] - (i === 2 ? -0.003 : 0)) k = i; const pz = PIEZAS[k], [x, y] = p;
    if (pz === 'pelo' || pz === 'cabeza') return nacimiento(p) < 0.004 && peloD(...p) <= cabezaD(...p) + 0.0015 ? 'pelo' : 'piel';
    if (pz.startsWith('brazo')) return manga(p) < 0 ? 'camiseta' : 'piel';
    if (pz.startsWith('pierna')) { const L = pz.slice(-1); return y < G['tobillo_' + L][1] + 0.035 ? 'zapatos' : 'pantalon'; }
    if (cintura(p) < 0) return 'pantalon'; if (cuelloC(p) < 0) return 'camiseta'; return 'piel'; }
  function pesos(p) { const d = piezas(p[0], p[1], p[2]); let k = 0; for (let i = 1; i < d.length; i++) if (d[i] < d[k]) k = i;
    const pz = PIEZAS[k], lista = CANDIDATOS[pz].map(n => { const [dist] = segD(p, SEG[n][0], SEG[n][1]); let w = Math.pow(1 / (dist + 0.012), 5);
      if (pz === 'tronco' && n.startsWith('hombro')) w *= cl((Math.abs(p[2]) - 0.1) / 0.08, 0, 1) * cl((p[1] - 0.29) / 0.08, 0, 1) * 0.6;   // el brazo solo arrastra el hombro, no el pecho
      return [HUESOS.indexOf(n), w]; }).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const s = lista.reduce((a, b) => a + b[1], 0); while (lista.length < 3) lista.push([0, 0]); return lista.map(([i, w]) => [i, w / s]); }

  let REPOSO = null;
  function reposo() {
    if (REPOSO) return REPOSO;
    const h = 0.0105, b0 = [-0.2, -1.0, -0.43], b1 = [0.3, 0.86, 0.43], nx = Math.ceil((b1[0] - b0[0]) / h) + 1, ny = Math.ceil((b1[1] - b0[1]) / h) + 1, nz = Math.ceil((b1[2] - b0[2]) / h) + 1;
    const F = new Float32Array(nx * ny * nz), I = (i, j, k) => i + nx * (j + ny * k);
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[I(i, j, k)] = cuerpoD(b0[0] + i * h, b0[1] + j * h, b0[2] + k * h);
    const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], AR = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    const cx = nx - 1, cy = ny - 1, cz = nz - 1, vid = new Int32Array(cx * cy * cz).fill(-1), P = [], CI = (i, j, k) => i + cx * (j + cy * k);
    for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
      const v = C.map(c => F[I(i + c[0], j + c[1], k + c[2])]); let neg = 0; for (const q of v) if (q < 0) neg++; if (!neg || neg === 8) continue;
      let sx = 0, sy = 0, sz = 0, n = 0; for (const [a, b] of AR) { if ((v[a] < 0) === (v[b] < 0)) continue; const t = v[a] / (v[a] - v[b]); sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t; n++; }
      vid[CI(i, j, k)] = P.length; P.push([b0[0] + (i + sx / n) * h, b0[1] + (j + sy / n) * h, b0[2] + (k + sz / n) * h]); }
    // ajustar cada vértice a la superficie (dos pasos de Newton) y normal analítica
    const N = P.map(p => { for (let it = 0; it < 2; it++) { const d = cuerpoD(...p), g = grad(cuerpoD, ...p); p[0] -= g[0] * d; p[1] -= g[1] * d; p[2] -= g[2] * d; } return grad(cuerpoD, ...p); });
    const T = [], tri = (a, b, c) => { if (a < 0 || b < 0 || c < 0) return; const pa = P[a], pb = P[b], pc = P[c], u = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]], w = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]], fn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], nn = N[a];
      if (fn[0] * nn[0] + fn[1] * nn[1] + fn[2] * nn[2] < 0) T.push(a, c, b); else T.push(a, b, c); };
    const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
    for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 0; i < cx; i++) if ((F[I(i, j, k)] < 0) !== (F[I(i + 1, j, k)] < 0)) quad(vid[CI(i, j - 1, k - 1)], vid[CI(i, j, k - 1)], vid[CI(i, j, k)], vid[CI(i, j - 1, k)]);
    for (let k = 1; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 1; i < cx; i++) if ((F[I(i, j, k)] < 0) !== (F[I(i, j + 1, k)] < 0)) quad(vid[CI(i - 1, j, k - 1)], vid[CI(i, j, k - 1)], vid[CI(i, j, k)], vid[CI(i - 1, j, k)]);
    for (let k = 0; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) if ((F[I(i, j, k)] < 0) !== (F[I(i, j, k + 1)] < 0)) quad(vid[CI(i - 1, j - 1, k)], vid[CI(i, j - 1, k)], vid[CI(i, j, k)], vid[CI(i - 1, j, k)]);
    // zona de cada triángulo y bordes limpios: los vértices entre dos zonas se llevan a la línea de la frontera (sin escalones)
    const zt = []; for (let t = 0; t < T.length; t += 3) { const a = T[t], b = T[t + 1], c = T[t + 2]; zt.push(zona([(P[a][0] + P[b][0] + P[c][0]) / 3, (P[a][1] + P[b][1] + P[c][1]) / 3, (P[a][2] + P[b][2] + P[c][2]) / 3])); }
    const vz = new Map(); zt.forEach((z, k) => { for (let j = 0; j < 3; j++) { const v = T[k * 3 + j]; (vz.get(v) || vz.set(v, new Set()).get(v)).add(z); } });
    for (const [v, set] of vz) { if (set.size !== 2) continue; const [za, zb] = [...set], f = frontera(za, zb, P[v]); if (!f) continue; const p = P[v];
      for (let it = 0; it < 4; it++) { const e = 0.0008, fv = f(p), g = [(f([p[0] + e, p[1], p[2]]) - f([p[0] - e, p[1], p[2]])) / (2 * e), (f([p[0], p[1] + e, p[2]]) - f([p[0], p[1] - e, p[2]])) / (2 * e), (f([p[0], p[1], p[2] + e]) - f([p[0], p[1], p[2] - e])) / (2 * e)], g2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2] || 1;
        const k = Math.min(1, 0.006 / (Math.abs(fv) / Math.sqrt(g2) + 1e-9)); p[0] -= fv * g[0] / g2 * k; p[1] -= fv * g[1] / g2 * k; p[2] -= fv * g[2] / g2 * k;
        for (let j = 0; j < 2; j++) { const d = cuerpoD(...p), n = grad(cuerpoD, ...p); p[0] -= n[0] * d; p[1] -= n[1] * d; p[2] -= n[2] * d; } }
      N[v] = grad(cuerpoD, ...p); }
    // pesos y zonas
    const nV = P.length, pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), hb = new Uint8Array(nV * 3), hw = new Float32Array(nV * 3);
    P.forEach((p, i) => { pos.set(p, i * 3); nor.set(N[i], i * 3); pesos(p).forEach(([b, w], j) => { hb[i * 3 + j] = b; hw[i * 3 + j] = w; }); });
    const sub = {};
    for (let t = 0; t < T.length; t += 3) { const z = zt[t / 3]; (sub[z] = sub[z] || []).push(T[t], T[t + 1], T[t + 2]); }
    const zonas = {};
    for (const z in sub) { const mapa = new Map(), glob = [], idx = []; for (const v of sub[z]) { if (!mapa.has(v)) { mapa.set(v, glob.length); glob.push(v); } idx.push(mapa.get(v)); }
      zonas[z] = { glob: Uint32Array.from(glob), idx: glob.length > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx) }; }
    return (REPOSO = { pos, nor, hb, hw, zonas, nV });
  }

  // ---------------------------------------------------------------- poses: matrices de cada hueso (de reposo a pose), en espacio del modelo
  const piv = (p, R) => M4.mul(M4.mul(M4.tras(p[0], p[1], p[2]), R), M4.tras(-p[0], -p[1], -p[2]));
  function huesos(P) {
    const g = (k, def = 0) => (P[k] == null ? def : P[k]) * D, B = {};
    B.pelvis = piv([0, 0, 0], M4.mul(M4.rotY(-g('giro') * 0.4), M4.rotX(g('balanceo'))));
    B.tronco = M4.mul(B.pelvis, piv(G.troncoJ, M4.mul(M4.rotY(g('giro')), M4.rotZ(-g('tronco')))));
    B.cuello = M4.mul(B.tronco, piv(G.cuelloJ, M4.mul(M4.rotY(-g('giro') * 0.7 + g('mirar')), M4.rotZ(-g('cuello')))));
    for (const s of [1, -1]) { const L = s > 0 ? 'd' : 'i', ab = -(P['abrir_' + L] == null ? g('abrir', 6) : g('abrir_' + L)) * s, ab0 = -A0 * D * s;
      B['hombro_' + L] = M4.mul(B.tronco, piv(G['hombro_' + L], M4.mul(M4.mul(M4.mul(M4.rotX(ab), M4.rotZ(g('hombro_' + L))), M4.rotY(g('rotar_' + L) * s)), M4.rotX(-ab0))));
      B['codo_' + L] = M4.mul(B['hombro_' + L], piv(G['codo_' + L], M4.mul(M4.mul(M4.rotX(ab0), M4.rotZ(g('codo_' + L))), M4.rotX(-ab0))));
      B['cadera_' + L] = M4.mul(B.pelvis, piv(G['cadera_' + L], M4.rotZ(g('cadera_' + L))));
      B['rodilla_' + L] = M4.mul(B['cadera_' + L], piv(G['rodilla_' + L], M4.rotZ(-g('rodilla_' + L))));
      B['tobillo_' + L] = M4.mul(B['rodilla_' + L], piv(G['tobillo_' + L], M4.rotZ(g('tobillo_' + L)))); }
    return HUESOS.map(n => B[n]);
  }
  /* Andar natural (fase en vueltas): el talón apoya con la punta arriba, el pie despega con la punta abajo,
     rodilla doblada en el vuelo, hombros que giran contra las caderas y brazos sueltos con el codo algo doblado. */
  V.pose.paseo = function (fase, amp = 1) { const a = fase * 2 * PI, s = Math.sin(a), c = Math.cos(a), sw = (x) => Math.max(0, x);
    const pierna = (s, c) => ({ cad: 24 * s, rod: 5 + 52 * Math.pow(sw(c), 1.6) + 6 * sw(-c) * sw(s), tob: 12 * sw(s) * sw(-c) - 24 * Math.pow(sw(-s), 1.5) * sw(c + 0.35) + 8 * sw(c) });
    const d = pierna(s, c), i = pierna(-s, -c);
    return { tronco: 5 * amp, cuello: -4, giro: 7 * s * amp, balanceo: 2.5 * c * amp, cadera_d: d.cad * amp, cadera_i: i.cad * amp, rodilla_d: d.rod * amp, rodilla_i: i.rod * amp, tobillo_d: d.tob * amp, tobillo_i: i.tob * amp,
      hombro_d: -20 * s * amp, hombro_i: 20 * s * amp, codo_d: 16 + 12 * sw(s) * amp, codo_i: 16 + 12 * sw(-s) * amp, abrir: 9 }; };

  /* Saludar con la mano (t en segundos): brazo derecho abierto, antebrazo hacia arriba que se mueve de lado a lado. */
  V.pose.saludo = function (t) { const o = Math.sin(t * 7); return Object.assign({}, V.poses.de_pie, { hombro_d: 18, abrir_d: 78, rotar_d: -90 + 16 * o, codo_d: 100 + 6 * o, hombro_i: -4, abrir_i: 8, codo_i: 12, cuello: -4, tronco: -2 }); };

  // ---------------------------------------------------------------- modelo
  const MALLAS = new Map();
  const COLORES = { piel: '#f2c3a2', pelo: '#4a2f22', camiseta: '#e9604c', pantalon: '#2f4f7a', zapatos: '#f2efe8', ojos: '#1f1712', boca: '#7a2e2a', colorete: '#ff8a80', cejas: '#3a2519' };
  const MAT = { piel: { esp: 0.14, dureza: 22, envolver: 0.45, borde: 0.55 }, pelo: { esp: 0.35, dureza: 40, envolver: 0.3, borde: 0.4 }, camiseta: { esp: 0.06, dureza: 12, envolver: 0.35, borde: 0.5 },
    pantalon: { esp: 0.08, dureza: 14, envolver: 0.3, borde: 0.4 }, zapatos: { esp: 0.25, dureza: 30, envolver: 0.3, borde: 0.4 } };
  // punto de la superficie de la cabeza (en reposo) delante de (y, z), con su normal
  const supCabeza = (y0, z0) => { const y = HC[1] + (y0 - HC[1]) * HS, z = z0 * HS; const f = (a, b, c) => Math.min(cabezaD(a, b, c), peloD(a, b, c) + 1); let x = 0.02; while (f(x, y, z) < 0 && x < 0.3) x += 0.004; let lo = x - 0.004, hi = x; for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (f(m, y, z) < 0) lo = m; else hi = m; } return { p: [hi, y, z], n: grad(cabezaD, hi, y, z) }; };
  const CARA = {}; for (const s of [1, -1]) { CARA['ojo' + s] = supCabeza(0.688, s * 0.046); CARA['col' + s] = supCabeza(0.648, s * 0.068); }
  const disco = (M, sp, ancho, alto, sobre) => { const n = sp.n, u = V.v3.norm(V.v3.res([0, 1, 0], V.v3.por(n, n[1]))), w = V.v3.cruz(u, n), p = add(sp.p, n, sobre), B = new Float32Array([u[0], u[1], u[2], 0, n[0], n[1], n[2], 0, w[0], w[1], w[2], 0, p[0], p[1], p[2], 1]);
    return M4.mul(M, M4.mul(B, M4.esc(alto, 0.0012, ancho))); };

  V.modelos = V.modelos || {};
  V.modelos.persona = function (o = {}) {
    const R = reposo(), id = o.id || 'persona', col = Object.assign({}, COLORES, o.colores || {}), t = o.t || 0;
    const P = Object.assign({}, V.poses.de_pie, { abrir: 8 }, typeof o.pose === 'string' ? V.poses[o.pose] : (o.pose || {}));
    // respiración: el pecho sube un poco
    P.tronco = (P.tronco || 0) + 0.8 * Math.sin(t * 1.6);
    const B = huesos(P), { pos, nor, hb, hw, nV } = R;
    if (!MALLAS.has(id)) MALLAS.set(id, { pos: new Float32Array(nV * 3), nor: new Float32Array(nV * 3), sub: {} });
    const Mm = MALLAS.get(id), op = Mm.pos, on = Mm.nor;
    for (let i = 0; i < nV; i++) { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], a = nor[i * 3], b = nor[i * 3 + 1], c = nor[i * 3 + 2]; let px = 0, py = 0, pz = 0, qx = 0, qy = 0, qz = 0;
      for (let j = 0; j < 3; j++) { const w = hw[i * 3 + j]; if (!w) continue; const m = B[hb[i * 3 + j]];
        px += w * (m[0] * x + m[4] * y + m[8] * z + m[12]); py += w * (m[1] * x + m[5] * y + m[9] * z + m[13]); pz += w * (m[2] * x + m[6] * y + m[10] * z + m[14]);
        qx += w * (m[0] * a + m[4] * b + m[8] * c); qy += w * (m[1] * a + m[5] * b + m[9] * c); qz += w * (m[2] * a + m[6] * b + m[10] * c); }
      const l = Math.hypot(qx, qy, qz) || 1; op[i * 3] = px; op[i * 3 + 1] = py; op[i * 3 + 2] = pz; on[i * 3] = qx / l; on[i * 3 + 1] = qy / l; on[i * 3 + 2] = qz / l; }
    const hijos = [];
    for (const z in R.zonas) { const Z = R.zonas[z]; let m = Mm.sub[z];
      if (!m) m = Mm.sub[z] = { pos: new Float32Array(Z.glob.length * 3), nor: new Float32Array(Z.glob.length * 3), uv: new Float32Array(Z.glob.length * 2), idx: Z.idx, dinamica: true, version: 0, clave: 'persona|' + id + '|' + z };
      for (let k = 0; k < Z.glob.length; k++) { const g = Z.glob[k] * 3; m.pos[k * 3] = op[g]; m.pos[k * 3 + 1] = op[g + 1]; m.pos[k * 3 + 2] = op[g + 2]; m.nor[k * 3] = on[g]; m.nor[k * 3 + 1] = on[g + 1]; m.nor[k * 3 + 2] = on[g + 2]; }
      m.version++; hijos.push(V.nodo({ nombre: 'persona_' + z, malla: m, mat: Object.assign({ color: col[z] }, MAT[z]) })); }
    // cara pintada sobre el hueso de la cabeza
    const C = Object.assign({ sonrisa: 0.6, boca: 0, cejas: 0, mirada: [0, 0] }, o.cara || {}), Mc = B[2];
    const ciclo = (t + (id.length * 0.37)) % 3.7, auto = ciclo < 0.13 ? Math.sin(ciclo / 0.13 * PI) : 0, cierre = cl(C.parpadeo == null ? auto : C.parpadeo, 0, 1);
    const tinta = { color: col.ojos, esp: 0.5, dureza: 80, envolver: 0.6, borde: 0, sinSombra: true }, disc = MA.cilindro(1, 1, 1, 24);
    for (const s of [1, -1]) { const E = CARA['ojo' + s], mx = C.mirada[0] * 0.006, my = C.mirada[1] * 0.006;
      const ojo = { p: add(add(E.p, [0, my, 0]), [0, 0, mx * s]), n: E.n };
      hijos.push(V.nodo({ malla: disc, m: disco(Mc, ojo, 0.019, 0.028 * (1 - 0.92 * cierre), 0.0015), mat: tinta, sinSombra: true }));
      if (cierre < 0.5) hijos.push(V.nodo({ malla: disc, m: disco(Mc, { p: add(ojo.p, [0.0, 0.009, -0.005]), n: E.n }, 0.0055, 0.0065, 0.0032), mat: { color: '#ffffff', emision: 0.6, esp: 0, envolver: 1, borde: 0 }, sinSombra: true }));
      const Cc = CARA['col' + s]; hijos.push(V.nodo({ malla: disc, m: disco(Mc, Cc, 0.02, 0.013, 0.0012), mat: { color: col.colorete, alfa: 0.45, esp: 0, envolver: 0.8, borde: 0 }, sinSombra: true }));
      // ceja: arco corto sobre el ojo (sube con sorpresa, se inclina con tristeza)
      const cj = []; for (let k = 0; k <= 6; k++) { const u = k / 6 - 0.5, y = 0.724 + 0.008 * C.cejas + 0.006 * (0.25 - u * u) * 2 + (C.cejas < 0 ? -C.cejas * 0.008 * u * s : 0), sp = supCabeza(y, s * 0.046 + u * 0.034); cj.push(M4.ap(Mc, add(sp.p, sp.n, 0.002))); }
      hijos.push(V.nodo({ malla: MA.tubo(cj, (q) => 0.0042 * (1 - 0.5 * Math.abs(q - 0.5)), 6, { dinamica: 'ceja' + s + '|' + id }), mat: { color: col.cejas, esp: 0.1, envolver: 0.6, borde: 0 }, sinSombra: true })); }
    // boca: sonrisa (curva) o abierta (óvalo oscuro con labio)
    if (C.boca > 0.08) { const sp = supCabeza(0.616 - 0.004 * C.boca, 0); hijos.push(V.nodo({ malla: disc, m: disco(Mc, sp, 0.024 - 0.006 * C.boca + 0.006 * C.sonrisa, 0.006 + 0.022 * C.boca, 0.0015), mat: { color: col.boca, esp: 0.3, envolver: 0.6, borde: 0 }, sinSombra: true }));
      const lg = supCabeza(0.616 - 0.004 * C.boca - 0.004 - 0.008 * C.boca, 0); hijos.push(V.nodo({ malla: disc, m: disco(Mc, lg, 0.011, 0.0045 * C.boca, 0.0022), mat: { color: '#e86a6a', esp: 0.2, envolver: 0.8, borde: 0 }, sinSombra: true })); }
    else { const bo = []; for (let k = 0; k <= 10; k++) { const u = k / 10 - 0.5, sp = supCabeza(0.618 + C.sonrisa * 0.012 * (u * u * 4 - 0.35), u * 0.05 * (1 + 0.15 * C.sonrisa)); bo.push(M4.ap(Mc, add(sp.p, sp.n, 0.0018))); }
      hijos.push(V.nodo({ malla: MA.tubo(bo, (q) => 0.0036 * (1 - 0.45 * Math.pow(Math.abs(q - 0.5) * 2, 2)), 6, { dinamica: 'boca|' + id }), mat: { color: col.boca, esp: 0.2, envolver: 0.6, borde: 0 }, sinSombra: true })); }
    const raiz = V.nodo({ nombre: 'persona', pos: (o.pos || [0, 0, 0]).slice(), rot: o.rot, esc: o.esc, hijos });
    if (o.apoyo === 'pies') { let minY = 1e9; for (const z of ['zapatos']) { const m = Mm.sub[z]; if (m) for (let k = 1; k < m.pos.length; k += 3) if (m.pos[k] < minY) minY = m.pos[k]; }
      const e = typeof o.esc === 'number' ? o.esc : (Array.isArray(o.esc) ? o.esc[1] : 1); raiz.pos[1] += (o.suelo || 0) - minY * e; }
    return raiz;
  };
})(window.VE = window.VE || {});
