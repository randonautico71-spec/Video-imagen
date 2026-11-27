/* VOLUMEN — MARINOS: tiburón blanco y ballena jorobada de una sola pieza (sin trozos), que nadan ondulando el cuerpo
   y abren la boca de verdad: la mandíbula baja y se ve el interior (paladar, lengua, garganta), con dientes o barbas.
   (la ballena abre ~34°; en la embestida real la garganta además se hincha, eso no se simula)

     V.modelos.tiburon({ id, t, boca: 0..1, nado: 0..1, pos, rot, esc })
     V.modelos.ballena({ id, t, boca: 0..1, nado: 0..1, pos, rot, esc })
       boca: 0 cerrada, 1 abierta del todo (el tiburón ~42°, la ballena ~34°)
       nado: amplitud de la ondulación (el tiburón ondula de lado a lado; la ballena arriba y abajo, como los cetáceos)
       id:   nombre único por animal en la escena
   Miran hacia +X. Tamaño en reposo: tiburón 2,2 de largo, ballena 3,4 (escalar con esc).
   Cómo están hechos: igual que V.modelos.persona (engine/volumen/organico.js): cuerpo como función de distancia con
   aletas fundidas, malla única, zonas de color con bordes limpios y esqueleto (columna en 5 tramos + mandíbula).
   La malla se modela con la boca entreabierta para que tenga interior; abrir o cerrar es girar la mandíbula.
   Revisión: demo/volumen.html?modo=mar (&vista=tiburon|ballena) */
(function (VE) {
  const V = VE.vol, M4 = V.m4, MA = V.malla, O = V.organico, { cl, smin, smax, ell, capR, aleta } = O.sd, PI = Math.PI, D = PI / 180;
  const nrm = (v) => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
  const rotH = (p, H, a) => { const c = Math.cos(a), s = Math.sin(a), x = p[0] - H[0], y = p[1] - H[1]; return [H[0] + x * c - y * s, H[1] + x * s + y * c, p[2]]; };

  /* Montaje común: cuerpo cerrado S, línea de la boca y bisagra -> cuerpo con la mandíbula bajada th0 y cavidad. */
  function conBoca(S, B) {
    const corte = (x) => B.y0 + B.pend * (x - B.H[0]), fx = (z) => B.xF - B.curva * z * z;   // plano de la boca y contorno en media luna (visto desde abajo)
    const r = (x, y, z) => Math.max(B.H[0] - x, x - fx(z), y - corte(x));                      // < 0 dentro de la mandíbula inferior (cerrada)
    const U = (x, y, z) => smax(S(x, y, z), -r(x, y, z), B.labio);
    const L = (x, y, z) => { const q = rotH([x, y, z], B.H, B.th0); return smax(S(q[0], q[1], q[2]), r(q[0], q[1], q[2]), B.labio); };
    const F = (x, y, z) => smax(smin(U(x, y, z), L(x, y, z), B.labio * 1.5), -ell(x, y, z, B.gc, B.gr), B.labio * 1.5);
    return { U, L, F, corte, r, fx, esMandibula: (p) => L(...p) < U(...p) - 0.002 };
  }
  /* Pesos de la columna: tramos de delante (0) a atrás; mezcla suave alrededor de cada articulación. */
  function pesosColumna(x, J, ancho) {
    let s = J.length; for (let i = 0; i < J.length; i++) if (x > J[i]) { s = i; break; }
    for (let i = 0; i < J.length; i++) { const t = (x - J[i]) / ancho + 0.5; if (t > 0 && t < 1) return [[i, t], [i + 1, 1 - t]]; }
    return [[s, 1]];
  }
  function huesosColumna(J, angs, eje) { const R = (a) => eje === 'y' ? M4.rotY(a) : M4.rotZ(a), B = [];
    B[1] = M4.id(); B[0] = O.pivote([J[0], 0, 0], R(angs[0]));
    for (let i = 2; i <= J.length; i++) B[i] = M4.mul(B[i - 1], O.pivote([J[i - 1], 0, 0], R(angs[i])));
    return B; }
  // punto de la superficie: se marcha desde un punto interior en una dirección hasta salir
  function superficie(f, p0, dir) { let t = 0; while (f(p0[0] + dir[0] * t, p0[1] + dir[1] * t, p0[2] + dir[2] * t) < 0 && t < 3) t += 0.004; let lo = t - 0.004, hi = t;
    for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (f(p0[0] + dir[0] * m, p0[1] + dir[1] * m, p0[2] + dir[2] * m) < 0) lo = m; else hi = m; } return [p0[0] + dir[0] * hi, p0[1] + dir[1] * hi, p0[2] + dir[2] * hi]; }
  // dientes a lo largo de la media luna de la boca (solo donde hay cabeza), con la hoja girada según el contorno
  function borde(S, BB, B, n, dentro) { const w = Math.sqrt((B.xF - B.H[0]) / B.curva), cand = [];
    for (let i = 0; i <= 200; i++) { const z = -w + 2 * w * i / 200, x = BB.fx(z) - dentro; if (x > B.H[0] + 0.03 && S(x, BB.corte(x) + 0.004, z) < -0.012) cand.push([x, z]); }
    const out = []; for (let k = 0; k < n; k++) { const [x, z] = cand[Math.round(k * (cand.length - 1) / (n - 1))]; out.push({ p: [x, BB.corte(x), z], a: Math.atan2(-1, -2 * B.curva * z) + PI / 2 }); } return out; }
  // ================================================================ TIBURÓN BLANCO
  const TB = { H: [0.5, -0.1, 0], y0: -0.1, pend: 0.12, xF: 0.79, curva: 3.2, th0: 26 * D, thMax: 42 * D, labio: 0.012, gc: [0.53, -0.115, 0], gr: [0.1, 0.05, 0.1] };
  function cuerpoT(x, y, z) {
    let d = ell(x, y, z, [0.1, 0, 0], [0.72, 0.25, 0.23]);
    d = smin(d, ell(x, y, z, [0.6, 0, 0], [0.42, 0.19, 0.2]), 0.12);
    d = smin(d, ell(x, y, z, [0.86, 0.015, 0], [0.16, 0.095, 0.11]), 0.08);
    d = smin(d, capR(x, y, z * 1.25, [-0.35, 0.03, 0], [-0.93, 0.05, 0], 0.17, 0.045), 0.1);
    return smin(d, ell(x, y, z, [-0.82, 0.045, 0], [0.11, 0.022, 0.065]), 0.03); }                                               // quilla de la cola
  function tiburonCerrado(x, y, z) {
    let d = cuerpoT(x, y, z);
    d = smin(d, aleta(x, y, z, [0.17, 0.19, 0], [1, 0, 0], [0, 1, 0], [[0.16, 0], [-0.13, 0.38], [-0.18, 0.365], [-0.24, 0]], 0.03), 0.04);   // dorsal
    for (const s of [1, -1]) d = smin(d, aleta(x, y, z, [0.4, -0.12, s * 0.16], [1, 0, 0], nrm([0, -0.42, s * 0.9]), [[0.08, 0], [-0.26, 0.47], [-0.34, 0.43], [-0.27, 0]], 0.032), 0.035);   // pectorales
    for (const s of [1, -1]) d = smin(d, aleta(x, y, z, [-0.3, -0.16, s * 0.07], [1, 0, 0], nrm([0, -0.7, s * 0.7]), [[0.02, 0], [-0.09, 0.11], [-0.14, 0.09], [-0.12, 0]], 0.013), 0.02);
    d = smin(d, aleta(x, y, z, [-0.6, 0.09, 0], [1, 0, 0], [0, 1, 0], [[0.04, 0], [-0.03, 0.075], [-0.08, 0.065], [-0.08, 0]], 0.012), 0.015);
    d = smin(d, aleta(x, y, z, [-0.62, -0.06, 0], [1, 0, 0], [0, -1, 0], [[0.04, 0], [-0.03, 0.07], [-0.08, 0.06], [-0.08, 0]], 0.012), 0.015);
    d = smin(d, aleta(x, y, z, [-0.92, 0.05, 0], [1, 0, 0], [0, 1, 0], [[0.05, 0.02], [-0.16, 0.5], [-0.26, 0.53], [-0.17, 0.12], [-0.13, 0], [-0.22, -0.36], [-0.14, -0.37], [0.05, -0.04]], 0.022), 0.04);   // cola en media luna
    return d; }
  const TBB = conBoca(tiburonCerrado, TB), TJ = [0.45, 0.05, -0.35, -0.7];
  const contraT = (x) => -0.03 + 0.03 * Math.sin(x * 5 + 1) - 0.05 * Math.max(0, x - 0.55);   // línea que separa el lomo gris del vientre blanco
  function zonaT(p) { const mand = TBB.esMandibula(p), q = mand ? rotH(p, TB.H, TB.th0) : p;
    if (ell(...p, TB.gc, TB.gr) > -0.012 && ell(...p, TB.gc, TB.gr) < 0.012 && tiburonCerrado(...q) < -0.01) return 'garganta';
    if (Math.abs(TBB.r(...q)) < 0.007 && tiburonCerrado(...q) < -0.03) return mand ? 'lengua' : 'paladar';   // solo la cara de dentro: el labio redondeado conserva el color de fuera
    if (cuerpoT(...q) > 0.015) return 'lomo';   // aletas de color del lomo
    if (q[0] < 0.45 && q[0] > 0.29 && Math.abs(((q[0] - 0.29) / 0.034) % 1 - 0.5) < 0.09 && q[1] < 0.06 && q[1] > -0.07 && Math.abs(q[2]) > 0.14) return 'branquia';
    return q[1] > contraT(q[0]) ? 'lomo' : 'vientre'; }
  const interior = (z) => z === 'lengua' || z === 'paladar';
  const fronteraT = (a, b, p) => interior(a) !== interior(b) && a !== 'garganta' && b !== 'garganta' ? ((r) => tiburonCerrado(...(TBB.esMandibula(r) ? rotH(r, TB.H, TB.th0) : r)) + 0.03) : (a + b === 'lomovientre' || a + b === 'vientrelomo') && cuerpoT(...p) < 0.012 ? ((r) => { const q = TBB.esMandibula(r) ? rotH(r, TB.H, TB.th0) : r; return q[1] - contraT(q[0]); }) : null;
  const pesosT = (p) => TBB.esMandibula(p) ? [[5, 1]] : pesosColumna(p[0], TJ, 0.16);

  V.modelos = V.modelos || {};
  V.modelos.tiburon = function (o = {}) {
    const R = O.preparar({ clave: 'tiburon', f: TBB.F, caja: [[-1.25, -0.62, -0.62], [1.06, 0.66, 0.62]], paso: 0.0115, zona: zonaT, pesos: pesosT, frontera: fronteraT });
    const t = o.t || 0, id = o.id || 'tiburon', nado = o.nado == null ? 1 : o.nado, w = 2 * PI * 0.9, A = [-0.05, 0, 0.07, 0.15, 0.27];
    const ang = A.map((a, i) => a * nado * Math.sin(w * t - i * 0.85));
    const B = huesosColumna(TJ, ang, 'y'), th = TB.thMax * cl(o.boca == null ? 0 : o.boca, 0, 1) + 3 * D;
    B[5] = M4.mul(B[0], O.pivote(TB.H, M4.rotZ(-(th - TB.th0))));
    const mats = { lomo: { color: '#6d7c8c', esp: 0.4, dureza: 40, envolver: 0.35, borde: 0.6 }, vientre: { color: '#f1efe9', esp: 0.3, dureza: 30, envolver: 0.45, borde: 0.4 },
      paladar: { color: '#c05a64', esp: 0.5, dureza: 40, envolver: 0.5 }, lengua: { color: '#d06a72', esp: 0.5, dureza: 40, envolver: 0.5 }, garganta: { color: '#3a1218', esp: 0.1, envolver: 0.2, borde: 0 }, branquia: { color: '#3e4752', esp: 0.2, envolver: 0.3 } };
    const hijos = O.deformar(R, B, id, mats);
    // dientes triangulares (arriba en la cabeza, abajo en la mandíbula) y ojos negros
    if (!R.dientes) { const sup = borde(tiburonCerrado, TBB, TB, 15, 0.012), inf = borde(tiburonCerrado, TBB, TB, 13, 0.02);
      R.dientes = { sup, inf }; R.ojos = [1, -1].map(s => superficie(TBB.F, [0.72, 0.045, 0], nrm([0.1, 0.12, s]))); }
    const diente = MA.cilindro(1, 0, 1, 3), blanco = { color: '#f4f1e6', esp: 0.6, dureza: 50, envolver: 0.5, borde: 0.2 };
    for (const { p, a } of R.dientes.sup) { const h = 0.036 * (1 - 0.5 * Math.min(1, Math.abs(p[2]) / 0.2)); hijos.push(V.nodo({ malla: diente, m: M4.mul(B[0], M4.mul(M4.tras(p[0], p[1] - h / 2 + 0.004, p[2]), M4.mul(M4.rotY(a), M4.esc(0.013, h, 0.005)))), mat: blanco, sinSombra: true })); }
    for (const { p, a } of R.dientes.inf) { const h = 0.028 * (1 - 0.5 * Math.min(1, Math.abs(p[2]) / 0.2)), q = rotH([p[0], p[1] + h / 2 - 0.004, p[2]], TB.H, -TB.th0);
      hijos.push(V.nodo({ malla: diente, m: M4.mul(B[5], M4.mul(M4.tras(...q), M4.mul(M4.rotZ(-TB.th0), M4.mul(M4.rotY(a), M4.mul(M4.rotX(PI), M4.esc(0.011, h, 0.0045)))))), mat: blanco, sinSombra: true })); }
    for (const p of R.ojos) hijos.push(V.nodo({ malla: MA.esfera(16), m: M4.mul(B[0], M4.mul(M4.tras(...p), M4.esc(0.019))), mat: { color: '#08090c', esp: 1.2, dureza: 120, envolver: 0.2, borde: 0.3 }, sinSombra: true }));
    return V.nodo({ nombre: id, pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };

  // ================================================================ BALLENA JOROBADA
  const BL = { H: [0.52, -0.06, 0], y0: -0.06, pend: 0.06, xF: 1.6, curva: 1.1, th0: 22 * D, thMax: 34 * D, labio: 0.02, gc: [0.62, -0.1, 0], gr: [0.2, 0.07, 0.25] };
  let NUDOS = null;
  function cuerpoB(x, y, z) {
    let d = ell(x, y, z, [0, 0, 0], [1.15, 0.42, 0.44]);
    d = smin(d, ell(x, y, z, [0.85, -0.03, 0], [0.75, 0.29, 0.36]), 0.2);
    d = smin(d, ell(x, y, z, [1.38, -0.06, 0], [0.32, 0.12, 0.2]), 0.12);
    d = smin(d, capR(x, y, z * 1.35, [-0.6, 0.02, 0], [-1.45, 0.05, 0], 0.33, 0.07), 0.22);
    return smin(d, ell(x, y, z, [-0.68, 0.33, 0], [0.15, 0.09, 0.045]), 0.07); }                                                 // pequeña aleta dorsal (joroba)
  const PECT = (s) => ({ o: [0.5, -0.2, s * 0.36], dir: nrm([-0.4, -0.22, s * 0.89]), cuerda: nrm([1, 0.08, 0]) });
  function ballenaBase(x, y, z) {
    let d = cuerpoB(x, y, z);
    d = smin(d, aleta(x, y, z, [-1.42, 0.05, 0], [1, 0, 0], [0, 0, 1], [[0.06, 0], [-0.06, 0.5], [-0.16, 0.74], [-0.24, 0.7], [-0.25, 0.4], [-0.31, 0.12], [-0.27, 0], [-0.31, -0.12], [-0.25, -0.4], [-0.24, -0.7], [-0.16, -0.74], [-0.06, -0.5]], 0.04), 0.06);   // aleta caudal
    for (const s of [1, -1]) { const { o, dir, cuerda } = PECT(s);   // aletas pectorales largas con el borde de ataque ondulado
      d = smin(d, aleta(x, y, z, o, cuerda, dir, [[0.1, 0], [0.15, 0.16], [0.12, 0.26], [0.15, 0.38], [0.11, 0.5], [0.13, 0.62], [0.08, 0.75], [0.08, 0.88], [0.02, 1.08], [-0.04, 1.06], [-0.07, 0.8], [-0.09, 0.45], [-0.15, 0]], 0.055), 0.07); }
    return d; }
  function ballenaCerrada(x, y, z) {
    let d = ballenaBase(x, y, z);
    if (!NUDOS) { NUDOS = []; for (const s of [0.07, 0.15, -0.07, -0.15]) for (let k = 0; k < 6; k++) { const nx = 1.05 + k * 0.1 - Math.abs(s) * 0.4; NUDOS.push(superficie(ballenaBase, [nx, -0.05, s * 0.5], nrm([0, 1, s * 1.4]))); } }
    for (const c of NUDOS) if (Math.abs(x - c[0]) < 0.06 && Math.abs(y - c[1]) < 0.06) d = smin(d, Math.hypot(x - c[0], y - c[1], z - c[2]) - 0.024, 0.014);     // tubérculos de la cabeza
    const surcos = cl((-0.1 - y) / 0.1, 0, 1) * cl((x + 0.35) / 0.3, 0, 1) * cl((1.55 - x) / 0.2, 0, 1);                       // pliegues de la garganta
    return d + 0.007 * surcos * (0.5 + 0.5 * Math.cos(z * 58)); }
  const BLB = conBoca(ballenaCerrada, BL), BJ = [0.7, 0.1, -0.5, -1.05];
  const vientreB = (x, z) => -0.12 - 0.05 * Math.sin(x * 3) + 0.03 * Math.sin(z * 9 + x * 4);
  function zonaB(p) { const mand = BLB.esMandibula(p), q = mand ? rotH(p, BL.H, BL.th0) : p;
    if (ell(...p, BL.gc, BL.gr) > -0.02 && ell(...p, BL.gc, BL.gr) < 0.02 && ballenaCerrada(...q) < -0.015) return 'garganta';
    if (Math.abs(BLB.r(...q)) < 0.012 && ballenaCerrada(...q) < -0.05) return mand ? 'lengua' : 'paladar';
    if (cuerpoB(...q) > 0.03) return q[0] > -1.15 ? 'aleta' : 'lomo';   // pectorales blancas; la cola, oscura
    return q[1] > vientreB(q[0], q[2]) ? 'lomo' : 'vientre'; }
  const fronteraB = (a, b, p) => interior(a) !== interior(b) && a !== 'garganta' && b !== 'garganta' ? ((r) => ballenaCerrada(...(BLB.esMandibula(r) ? rotH(r, BL.H, BL.th0) : r)) + 0.05) : (a + b === 'lomovientre' || a + b === 'vientrelomo') && cuerpoB(...p) < 0.025 ? ((r) => { const q = BLB.esMandibula(r) ? rotH(r, BL.H, BL.th0) : r; return q[1] - vientreB(q[0], q[2]); }) : null;
  const pesosB = (p) => BLB.esMandibula(p) ? [[5, 1]] : pesosColumna(p[0], BJ, 0.3);

  V.modelos.ballena = function (o = {}) {
    const R = O.preparar({ clave: 'ballena', f: BLB.F, caja: [[-1.85, -1.05, -1.15], [1.95, 0.62, 1.15]], paso: 0.02, zona: zonaB, pesos: pesosB, frontera: fronteraB });
    const t = o.t || 0, id = o.id || 'ballena', nado = o.nado == null ? 1 : o.nado, w = 2 * PI * 0.32, A = [-0.015, 0, 0.04, 0.1, 0.2];
    const ang = A.map((a, i) => a * nado * Math.sin(w * t - i * 0.8));
    const B = huesosColumna(BJ, ang, 'z'), th = BL.thMax * cl(o.boca == null ? 0 : o.boca, 0, 1) + 1 * D;
    B[5] = M4.mul(B[0], O.pivote(BL.H, M4.rotZ(-(th - BL.th0))));
    const mats = { lomo: { color: '#2d3442', esp: 0.35, dureza: 30, envolver: 0.35, borde: 0.6 }, vientre: { color: '#dfe2e6', esp: 0.25, dureza: 24, envolver: 0.45, borde: 0.4 }, aleta: { color: '#e8eaee', esp: 0.3, dureza: 26, envolver: 0.45, borde: 0.5 },
      paladar: { color: '#b9777a', esp: 0.4, dureza: 30, envolver: 0.5 }, lengua: { color: '#d07c86', esp: 0.45, dureza: 30, envolver: 0.5 }, garganta: { color: '#3a161a', esp: 0.1, envolver: 0.2, borde: 0 } };
    const hijos = O.deformar(R, B, id, mats);
    // barbas (láminas oscuras que cuelgan del maxilar) y ojos
    if (!R.barbas) { R.barbas = []; for (const s of [1, -1]) for (let k = 0; k < 34; k++) { const z = s * (0.04 + k * 0.0105), x = BLB.fx(z) - 0.03, yc = BLB.corte(x); if (x > BL.H[0] + 0.05 && ballenaCerrada(x, yc + 0.006, z) < -0.02) R.barbas.push([x, yc, z]); }
      R.ojos = [1, -1].map(s => superficie(BLB.F, [0.47, -0.02, 0], nrm([0.05, 0.05, s]))); }
    const lam = MA.caja(1, 1, 1, 0.1), negro = { color: '#2a2622', esp: 0.2, envolver: 0.4, borde: 0.2 };
    for (const p of R.barbas) { const hgt = 0.05 + 0.05 * cl((p[0] - BL.H[0]) / 0.25, 0, 1) * cl((1.5 - p[0]) / 0.3, 0, 1); hijos.push(V.nodo({ malla: lam, m: M4.mul(B[0], M4.mul(M4.tras(p[0], p[1] - hgt / 2 + 0.006, p[2]), M4.esc(0.008, hgt, 0.045))), mat: negro, sinSombra: true })); }
    for (const p of R.ojos) hijos.push(V.nodo({ malla: MA.esfera(16), m: M4.mul(B[0], M4.mul(M4.tras(...p), M4.esc(0.022))), mat: { color: '#0a0a0c', esp: 1.2, dureza: 120, envolver: 0.2 }, sinSombra: true }));
    return V.nodo({ nombre: id, pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };
})(window.VE = window.VE || {});
