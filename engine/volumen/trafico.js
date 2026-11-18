/* ============================================================================================
   TRAFICO Y CALLE (3D): coche, volante (vista del conductor), semaforo, farola y tramo de calle de ciudad.
   Registrado en engine/video/index.html tras cetaceos.js. Todo por piezas (V.malla); medidas en metros; el coche mira a +Z.
     V.modelos.coche({ color, freno 0..1, faros 0..1, pos, rot, esc })     turismo 4,2 x 1,8 x 1,45 con ruedas, cristales, faros y pilotos (freno enciende los pilotos)
     V.modelos.volante({ giro, pos, rot, esc })                            volante + salpicadero + retrovisor para la vista en primera persona (ojos en el origen, mira a +Z)
     V.modelos.semaforo({ estado: 'verde'|'ambar'|'rojo', pos, rot, esc }) semaforo de poste (3,2 m) con la luz activa encendida
     V.modelos.farola({ enc 0..1, pos, rot, esc })                         farola de 5 m con foco calido
     V.modelos.calle({ z0, largo, ancho, semaforos: [z...], seed, pisos, noche, pos })
          calzada de 2 carriles (ancho 7 m) con rayas discontinuas, aceras, farolas cada 16 m y fachadas a ambos lados; sin coche.
   Revision: `vid.py qa <tema> --stills t`. */
(function () {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI;
  const m = (color, extra) => Object.assign({ color, esp: 0.12, dureza: 24, envolver: 0.35 }, extra || {});
  const luz = (color, e) => ({ color, esp: 0.2, emision: e, envolver: 0.5 });

  /* ---------------------------------------------------------------- coche */
  MO.coche = (o = {}) => {
    const col = o.color || '#c8372d', fr = o.freno || 0, fa = o.faros == null ? 1 : o.faros, pint = m(col, { tipo: 'brillo', esp: 0.7, dureza: 70 });
    const cristal = { color: '#1d2b3b', tipo: 'brillo', esp: 0.9, dureza: 90, envolver: 0.2 };
    const rueda = (x, z) => nodo({ pos: [x, 0.33, z], hijos: [
      nodo({ malla: MA.cilindro(0.33, 0.33, 0.24, 20, true), rot: [0, 0, PI / 2], mat: m('#16181c') }),
      nodo({ malla: MA.cilindro(0.2, 0.2, 0.25, 16, true), rot: [0, 0, PI / 2], pos: [Math.sign(x) * 0.005, 0, 0], mat: m('#b7bcc4', { tipo: 'brillo', esp: 0.8 }) }) ] });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [
      nodo({ malla: MA.caja(1.8, 0.58, 4.2, 0.2, 5), pos: [0, 0.58, 0], mat: pint }),                                  // carroceria baja
      nodo({ malla: MA.caja(1.58, 0.5, 2.15, 0.22, 5), pos: [0, 1.06, -0.25], mat: pint }),                            // habitaculo
      nodo({ malla: MA.caja(1.62, 0.34, 2.0, 0.14, 4), pos: [0, 1.08, -0.25], mat: cristal }),                         // cristales (banda)
      nodo({ malla: MA.caja(1.5, 0.07, 1.45, 0.03, 3), pos: [0, 1.33, -0.28], mat: pint }),                            // techo
      nodo({ malla: MA.caja(1.7, 0.1, 0.18, 0.04, 3), pos: [0, 0.34, 2.06], mat: m('#26292f') }),                      // paragolpes delantero
      nodo({ malla: MA.caja(1.7, 0.1, 0.18, 0.04, 3), pos: [0, 0.34, -2.06], mat: m('#26292f') }),                     // paragolpes trasero
      nodo({ malla: MA.caja(0.34, 0.14, 0.05, 0.02, 3), pos: [-0.62, 0.72, 2.1], mat: luz('#fff4d0', 0.15 + 0.85 * fa), sinSombra: true }),
      nodo({ malla: MA.caja(0.34, 0.14, 0.05, 0.02, 3), pos: [0.62, 0.72, 2.1], mat: luz('#fff4d0', 0.15 + 0.85 * fa), sinSombra: true }),
      nodo({ malla: MA.caja(0.36, 0.12, 0.05, 0.02, 3), pos: [-0.62, 0.78, -2.1], mat: luz('#ff2a1a', 0.35 + 0.65 * fr), sinSombra: true }),
      nodo({ malla: MA.caja(0.36, 0.12, 0.05, 0.02, 3), pos: [0.62, 0.78, -2.1], mat: luz('#ff2a1a', 0.35 + 0.65 * fr), sinSombra: true }),
      rueda(-0.86, 1.3), rueda(0.86, 1.3), rueda(-0.86, -1.3), rueda(0.86, -1.3) ] });
  };

  /* ---------------------------------------------------------------- volante (primera persona) */
  MO.volante = (o = {}) => {
    const g = (o.giro || 0) * PI / 180, plastico = m('#16181d', { esp: 0.25, dureza: 40 });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.caja(1.7, 0.34, 0.8, 0.12, 4), pos: [0, -0.62, 0.95], mat: plastico }),                                  // salpicadero
      nodo({ malla: MA.caja(0.62, 0.32, 0.2, 0.06, 3), pos: [0.0, -0.4, 0.55], mat: m('#0d0f13') }),                              // cuadro de relojes
      nodo({ malla: MA.cilindro(0.04, 0.05, 0.5, 10, true), pos: [0, -0.42, 0.42], rot: [-1.1, 0, 0], mat: plastico }),            // columna
      nodo({ pos: [0, -0.3, 0.42], rot: [-1.05, 0, g], hijos: [
        nodo({ malla: MA.toro(0.18, 0.017, 28, 10), mat: m('#101216', { esp: 0.3, dureza: 40 }) }),
        nodo({ malla: MA.caja(0.3, 0.02, 0.03, 0.008, 2), mat: plastico }), nodo({ malla: MA.caja(0.03, 0.02, 0.17, 0.008, 2), pos: [0, 0, -0.09], mat: plastico }),
        nodo({ malla: MA.caja(0.09, 0.025, 0.09, 0.02, 3), mat: m('#2b2f37') }) ] }),
      nodo({ malla: MA.caja(0.26, 0.07, 0.03, 0.015, 3), pos: [0, 0.34, 0.72], mat: m('#262a31', { tipo: 'brillo' }) }),             // retrovisor
      nodo({ malla: MA.caja(0.2, 0.045, 0.012, 0.006, 2), pos: [0, 0.34, 0.700], mat: { color: '#0d1626', tipo: 'brillo', esp: 0.9, dureza: 80, emision: 0.25 }, sinSombra: true }),   // luna del retrovisor
      nodo({ malla: MA.esfera(8), esc: 0.011, pos: [-0.045, 0.342, 0.692], mat: { color: '#fff4d0', tipo: 'plano' }, sinSombra: true }), nodo({ malla: MA.esfera(8), esc: 0.011, pos: [-0.012, 0.342, 0.692], mat: { color: '#fff4d0', tipo: 'plano' }, sinSombra: true }),   // faros que vienen detras
      nodo({ malla: MA.caja(0.06, 0.62, 0.06, 0.02, 3), pos: [-0.78, 0.18, 0.7], rot: [0, 0, -0.12], mat: plastico }),             // montantes
      nodo({ malla: MA.caja(0.06, 0.62, 0.06, 0.02, 3), pos: [0.78, 0.18, 0.7], rot: [0, 0, 0.12], mat: plastico }) ] });
  };

  /* ---------------------------------------------------------------- semaforo y farola */
  MO.semaforo = (o = {}) => {
    const est = o.estado || 'verde', c = { rojo: ['#ff2a1a', 0], ambar: ['#ffb020', 1], verde: ['#2fe07a', 2] }, caja = m('#1c1f25', { esp: 0.2 });
    const foco = (i, col, on) => nodo({ malla: MA.esfera(12), esc: 0.085, pos: [0, 3.0 - i * 0.22, 0.07], mat: on ? { color: col, tipo: 'plano' } : m('#2a2d33'), sinSombra: true });
    const act = c[est][1];
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.cilindro(0.045, 0.055, 3.2, 10, true), pos: [0, 1.6, 0], mat: m('#3b3f46') }),
      nodo({ malla: MA.caja(0.26, 0.74, 0.2, 0.05, 3), pos: [0, 2.8, 0], mat: caja }),
      foco(0, '#ff2a1a', act === 0), foco(1, '#ffb020', act === 1), foco(2, '#2fe07a', act === 2),
      nodo({ malla: MA.esfera(10), esc: 0.35, pos: [0, 2.8, 0.0], mat: { color: c[est][0], tipo: 'plano', alfa: 0.12 }, sinSombra: true }) ] });
  };
  MO.farola = (o = {}) => {
    const e = o.enc == null ? 1 : o.enc;
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.cilindro(0.05, 0.07, 5, 10, true), pos: [0, 2.5, 0], mat: m('#3a3f47') }),
      nodo({ malla: MA.caja(0.9, 0.05, 0.05, 0.015, 2), pos: [0.4, 5.0, 0], mat: m('#3a3f47') }),
      nodo({ malla: MA.caja(0.34, 0.07, 0.16, 0.03, 3), pos: [0.82, 4.97, 0], mat: luz('#ffd9a0', 0.9 * e), sinSombra: true }),
      nodo({ malla: MA.esfera(10), esc: [0.7, 0.45, 0.7], pos: [0.82, 4.8, 0], mat: { color: '#ffcf8a', tipo: 'plano', alfa: 0.16 * e }, sinSombra: true }) ] });
  };

  /* bloque de pisos barato: caja + una sola textura de fachada (ventanas encendidas al azar). medidas en metros, fachada a +Z */
  MO.bloque = (o = {}) => {
    const P = o.pisos || 6, C = o.cols || 4, col = o.color || '#cdb89c', sd = o.seed || 0, W = C * 2.6, H = P * 3.0, D = o.fondo || 8;
    const mapa = V.textura('bloque|' + P + '|' + C + '|' + col + '|' + sd, 256, Math.round(256 * H / W), (x, w, h) => {
      const r = VE.rng('bl' + sd + P + C); x.fillStyle = col; x.fillRect(0, 0, w, h);
      for (let p = 0; p < P; p++) for (let c = 0; c < C; c++) { const ww = w / C, hh = h / P, on = r() < 0.32; x.fillStyle = on ? '#ffd89a' : '#27323f'; x.fillRect(c * ww + ww * 0.2, p * hh + hh * 0.22, ww * 0.6, hh * 0.52);
        x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(c * ww + ww * 0.2, p * hh + hh * 0.74, ww * 0.6, hh * 0.05); }
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, h - h / P * 0.5, w, h / P * 0.5); });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.caja(W, H, D, 0.1, 3), pos: [0, H / 2, 0], mat: m(col) }),
      nodo({ malla: MA.plano(W, H, 1), rot: [PI / 2, 0, 0], pos: [0, H / 2, D / 2 + 0.02], mat: { color: '#ffffff', mapa, esp: 0.05, envolver: 0.4, borde: 0 }, sinSombra: true }) ] });
  };

  /* ---------------------------------------------------------------- tramo de calle */
  const FACHADAS = ['#cdb89c', '#c9a98a', '#b8b4a8', '#d4c3a0', '#a9a39a', '#c7b0a0'];
  MO.calle = (o = {}) => {
    const z0 = o.z0 || 0, L = o.largo || 120, W = o.ancho || 7, sem = o.semaforos || [], rng = VE.rng(o.seed || 'calle'), noche = o.noche !== false, hijos = [];
    const zc = z0 + L / 2;
    hijos.push(nodo({ malla: MA.caja(W, 0.1, L, 0.02, 2), pos: [0, -0.05, zc], mat: m('#2a2d33', { esp: 0.08, envolver: 0.2 }) }));                                  // calzada
    for (const s of [-1, 1]) {
      hijos.push(nodo({ malla: MA.caja(3.2, 0.2, L, 0.04, 3), pos: [s * (W / 2 + 1.6), 0.0, zc], mat: m('#6c6f75') }));                                           // acera
      hijos.push(nodo({ malla: MA.caja(0.06, 0.05, L, 0.01, 2), pos: [s * (W / 2 - 0.4), 0.003, zc], mat: m('#d9d9d2', { esp: 0.1 }) }));                         // linea de borde
    }
    for (let z = Math.ceil(z0 / 6) * 6; z < z0 + L; z += 6) hijos.push(nodo({ malla: MA.caja(0.14, 0.02, 2.6, 0.01, 2), pos: [0, 0.005, z], mat: m('#e8e6dc', { esp: 0.1 }) }));    // raya central
    for (let z = Math.ceil(z0 / 16) * 16; z < z0 + L; z += 16) { hijos.push(MO.farola({ enc: noche ? 1 : 0, pos: [W / 2 + 0.5, 0, z + 4], rot: [0, -PI / 2, 0] })); hijos.push(MO.farola({ enc: noche ? 1 : 0, pos: [-W / 2 - 0.5, 0, z + 12], rot: [0, PI / 2, 0] })); }
    for (const z of sem) hijos.push(MO.semaforo({ estado: 'verde', pos: [W / 2 + 0.3, 0.1, z], rot: [0, PI, 0] }));
    for (const s of [-1, 1]) for (let z = Math.ceil(z0 / 11) * 11, k = 0; z < z0 + L; z += 11, k++) {
      const pisos = (o.pisos || 5) + Math.floor(rng() * 5), cols = 3 + Math.floor(rng() * 2);
      hijos.push(MO.bloque({ pisos, cols, fondo: 9, color: FACHADAS[Math.floor(rng() * FACHADAS.length)], seed: k + (s > 0 ? 50 : 0),
        pos: [s * (W / 2 + 3.2 + 4.5), 0, z + 5.5], rot: [0, s > 0 ? -PI / 2 : PI / 2, 0] }));
    }
    return nodo({ pos: o.pos, hijos });
  };
})();
