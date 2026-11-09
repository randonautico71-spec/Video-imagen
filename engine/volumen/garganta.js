/* VOLUMEN — CORTE DE CABEZA Y GARGANTA (plano sagital, mira a +X, camara en +Z; unidades de cabeza: la cabeza mide ~2,5 de alto, el cuello baja hasta y = -2,4)
     V.modelos.garganta({ bajar, bolo, epiglotis, piel, rotulos, pos, rot, esc })
        bajar     0..1  altura de la laringe (0 = alta, como un bebe o un mono; 1 = baja, como un adulto)
        bolo      -1..1 posicion del bocado: -1 = no se ve · 0 = en la boca · 1 = ya en el esofago (baja por la garganta)
        epiglotis 0..1  tapa de la laringe (0 = abierta, 1 = cerrada sobre la via del aire)
        piel      0..1  opacidad de la piel (1 = cabeza solida, 0 = solo se ven los conductos)
        aire      0..1  brillo de la via del aire (resalta el conducto azul)
        comida    0..1  brillo de la via de la comida
   Devuelve ademas puntos de anclaje para grafismos: V.modelos.garganta.puntos(o) -> { laringe, epiglotis, bolo, boca, esofago, traquea } en coordenadas locales. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, M4 = V.m4;
  const c01 = (v) => Math.max(0, Math.min(1, v)), mix = (a, b, p) => a + (b - a) * p;
  const base = [[-0.2, 1.3], [0.3, 1.28], [0.7, 1.0], [0.86, 0.65], [0.9, 0.4], [0.88, 0.22], [1.14, -0.02], [0.95, -0.14], [0.98, -0.3], [0.9, -0.46], [0.95, -0.62], [0.82, -0.86], [0.6, -1.0], [0.2, -1.0], [0.15, -1.5], [0.13, -2.4], [-0.45, -2.4], [-0.55, -1.4], [-0.62, -0.9], [-0.95, -0.2], [-1.02, 0.5], [-0.8, 1.1]];
  const chaikin = (P, n) => { for (let k = 0; k < n; k++) { const Q = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; Q.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]); } P = Q; } return P; };
  const PERFIL = chaikin(base, 2);
  const PELO = chaikin([[0.7, 1.02], [0.3, 1.34], [-0.25, 1.38], [-0.85, 1.12], [-1.08, 0.5], [-1.06, -0.1], [-0.9, -0.5], [-0.78, -0.2], [-0.8, 0.45], [-0.55, 0.95], [0.0, 1.12], [0.5, 0.98]], 2);
  const CAMISETA = chaikin([[0.2, -2.3], [0.55, -2.5], [0.95, -3.0], [1.0, -4.8], [-1.2, -4.8], [-1.1, -3.1], [-0.7, -2.5], [-0.4, -2.3]], 2);
  const yLaringe = (b) => mix(-0.66, -1.38, c01(b));
  const rutaComida = (yL) => [[0.62, -0.48, -0.06], [0.3, -0.52, -0.06], [0.0, -0.62, -0.06], [-0.18, -0.8, -0.06], [-0.2, yL - 0.05, -0.04], [-0.22, mix(yL - 0.4, -1.8, 0.5), 0], [-0.22, -2.3, 0]];
  const sobre = (pts, u) => { const n = pts.length - 1, s = c01(u) * n, i = Math.min(n - 1, Math.floor(s)), f = s - i; return [0, 1, 2].map(k => mix(pts[i][k], pts[i + 1][k], f)); };
  MO.garganta = function (o = {}) {
    const yL = yLaringe(o.bajar), ep = c01(o.epiglotis || 0), pel = o.piel == null ? 1 : o.piel, bl = o.bolo == null ? -1 : o.bolo, aire = o.aire || 0, com = o.comida || 0;
    const ruta = rutaComida(yL);
    const liso = (c, e) => Object.assign({ color: c, esp: 0.35, dureza: 40, envolver: 0.35, borde: 0.6 }, e || {});
    const H = [];
    // piel: carcasa del perfil, mas o menos transparente
    H.push(V.nodo({ malla: MA.extrusion(PERFIL, 0.78, 'garganta|perfil'), pos: [0, 0, 0], alfa: pel, mat: { color: '#e5b08c', esp: 0.2, dureza: 20, envolver: 0.5, borde: 1.0, alfa: 0.96, dobleCara: true } }));
    // busto: pelo y camiseta (la persona entera, no solo la cara)
    if (o.busto !== false) {
      H.push(V.nodo({ malla: MA.extrusion(PELO, 0.84, 'garganta|pelo'), alfa: mix(0.45, 1, pel), mat: { color: '#2a1a12', esp: 0.2, dureza: 16, envolver: 0.5, borde: 0.5 } }));
      H.push(V.nodo({ malla: MA.extrusion(CAMISETA, 1.9, 'garganta|camiseta'), mat: { color: '#3f78b5', esp: 0.1, dureza: 10, envolver: 0.55, borde: 0.4 } }));
    }
    // ojo y oreja (solo con piel)
    H.push(V.nodo({ malla: MA.esfera(14), pos: [0.66, 0.42, 0.36], esc: [0.1, 0.075, 0.05], alfa: pel, mat: { color: '#f4efe6', esp: 0.4, envolver: 0.4 } }));
    H.push(V.nodo({ malla: MA.esfera(12), pos: [0.71, 0.42, 0.405], esc: [0.045, 0.045, 0.02], alfa: pel, mat: { color: '#22303c', esp: 0.6, envolver: 0.3 } }));
    H.push(V.nodo({ malla: MA.esfera(14), pos: [-0.2, -0.1, 0.4], esc: [0.14, 0.26, 0.05], alfa: pel, mat: { color: '#d99a78', esp: 0.2, envolver: 0.5 } }));
    // via del aire: nariz -> faringe -> laringe -> traquea
    const aireRuta = [[0.95, -0.04, 0.05], [0.55, 0.1, 0.05], [0.0, 0.0, 0.05], [-0.14, -0.42, 0.05], [-0.04, -0.66, 0.05], [0.04, yL + 0.32, 0.03], [0.05, yL + 0.1, 0]];
    H.push(V.nodo({ malla: MA.tubo(aireRuta, 0.085, 14, { clave: 'garganta|aire|' + yL.toFixed(2) }), mat: { color: '#6fb6ee', esp: 0.5, dureza: 50, emision: 0.18 + 0.5 * aire, envolver: 0.4, alfa: 0.92 }, sinSombra: true }));
    H.push(V.nodo({ malla: MA.tubo([[0.02, yL, 0], [0.01, mix(yL, -2.4, 0.5), 0], [0.0, -2.4, 0]], 0.115, 16, { clave: 'garganta|traq|' + yL.toFixed(2) }), mat: { color: '#9fd0f2', esp: 0.4, dureza: 40, emision: 0.1 + 0.4 * aire, envolver: 0.4 }, sinSombra: true }));
    // anillos de la traquea
    for (let i = 0; i < 9; i++) { const y = mix(yL - 0.22, -2.3, i / 8); H.push(V.nodo({ malla: MA.toro(0.118, 0.016, 18, 6), pos: [0.005, y, 0], rot: [Math.PI / 2, 0, 0], mat: { color: '#d7ecfa', esp: 0.4, envolver: 0.4 }, sinSombra: true })); }
    // via de la comida: boca -> faringe -> esofago
    H.push(V.nodo({ malla: MA.tubo(ruta, 0.15, 14, { clave: 'garganta|com|' + yL.toFixed(2) }), mat: { color: '#c75a5c', esp: 0.35, dureza: 30, emision: 0.08 + 0.35 * com, envolver: 0.45, alfa: 0.8 }, sinSombra: true }));
    // boca: cavidad oscura y lengua
    H.push(V.nodo({ malla: MA.esfera(20), pos: [0.52, -0.43, 0], esc: [0.4, 0.22, 0.26], mat: { color: '#4a1c22', esp: 0.2, envolver: 0.4 }, sinSombra: true }));
    H.push(V.nodo({ malla: MA.esfera(20), pos: [0.38, -0.5 + 0.04 * c01(ep), 0], rot: [0, 0, 0.12], esc: [0.42, 0.14, 0.22], mat: { color: '#e07a86', esp: 0.4, dureza: 30, envolver: 0.5 } }));
    // laringe (cartilago), hioides y epiglotis
    H.push(V.nodo({ malla: MA.caja(0.2, 0.3, 0.24, 0.06, 4), pos: [0.05, yL - 0.1, 0], mat: { color: '#efe6c9', esp: 0.4, dureza: 30, envolver: 0.4 } }));
    H.push(V.nodo({ malla: MA.toro(0.1, 0.022, 14, 6), pos: [0.06, yL + 0.24, 0], rot: [Math.PI / 2, 0, 0], esc: [1, 1, 0.8], mat: { color: '#efe6c9', esp: 0.4, envolver: 0.4 } }));
    const ang = mix(0.05, 1.45, ep);
    H.push(V.nodo({ pos: [0.13, yL + 0.1, 0], rot: [0, 0, ang], hijos: [V.nodo({ malla: MA.caja(0.07, 0.32, 0.2, 0.025, 3), pos: [0, 0.16, 0], mat: { color: '#ffd27a', esp: 0.5, dureza: 40, emision: 0.25, envolver: 0.4 } })] }));
    // bocado
    if (bl > -0.99) { const p = sobre(ruta, c01(bl)); const r = 0.13; H.push(V.nodo({ malla: MA.esfera(16), pos: p, esc: [r * 1.25, r, r], mat: { color: '#e9b04c', esp: 0.5, dureza: 40, emision: 0.3, envolver: 0.5 } })); }
    return V.nodo({ nombre: 'garganta', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H });
  };
  MO.garganta.puntos = (o = {}) => { const yL = yLaringe(o.bajar), ruta = rutaComida(yL); return { laringe: [0.05, yL - 0.1, 0], epiglotis: [0.13, yL + 0.26, 0], bolo: sobre(ruta, c01(o.bolo == null ? 0 : o.bolo)), boca: [0.7, -0.45, 0], esofago: [-0.22, -1.8, 0], traquea: [0.0, -1.9, 0], nariz: [1.1, 0.0, 0], yL }; };
})(window.VE = window.VE || {});
