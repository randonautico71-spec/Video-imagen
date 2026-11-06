/* ============================================================================================
   VIVIENDA Y ALQUILER (3D): edificio de pisos, cartel, moneda, llave, puerta, balanza, edificio institucional, grua, candado y escudo.
   Registrado en engine/video/index.html tras sueno.js. Todo por piezas (V.malla); medidas en metros (un piso = 0,5).
     V.modelos.edificio({ pisos, cols, fondo, color, obra, luces(piso, col) -> {color, emision} | null, pos, rot, esc })
          fachada +Z con ventanas, balcones y puerta; obra:true = solo losas y pilares. V.modelos.edificio.punto(piso, col, o) -> punto local de una ventana
     V.modelos.cartel({ texto, color, w, h, pos, rot, esc })      cartel rectangular con texto («SE ALQUILA»), mira a +Z
     V.modelos.moneda({ color, emision, pos, rot, esc })           moneda de oro (disco tumbado, radio 0,057)
     V.modelos.llave({ color, pos, rot, esc })                      llave (aro arriba, dientes abajo, eje en Y, ~0,26 de alto)
     V.modelos.puerta({ abierta 0..1, color, pos, rot, esc })       puerta con marco, panelado, pomo y cerradura (0,9 x 2,05)
     V.modelos.balanza({ inc, izq, der, pos, rot, esc })           balanza de platillos; inc = inclinacion de la viga en rad (+ sube el lado derecho); izq/der: nodos sobre el platillo
     V.modelos.institucion({ pos, rot, esc })                       edificio con frontón y columnas (administracion)
     V.modelos.grua({ giro, gancho, cable, carga, pos, rot, esc })  grua torre amarilla; carga: nodos colgados del gancho
     V.modelos.candado({ color, pos, rot, esc })  ·  V.modelos.escudo({ color, borde, pos, rot, esc })
   Revision: `vid.py qa <tema> --stills t`. */
(function () {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI;
  const m = (color, extra) => Object.assign({ color, esp: 0.12, dureza: 24, envolver: 0.35 }, extra || {});
  const oro = (extra) => Object.assign({ color: '#e8b84a', tipo: 'brillo', esp: 0.9, dureza: 70, envolver: 0.3 }, extra || {});

  /* ---------------------------------------------------------------- cartel */
  MO.cartel = (o = {}) => {
    const w = o.w || 0.36, h = o.h || 0.13, tx = o.texto || 'SE ALQUILA', col = o.color || '#d6322a';
    const mapa = V.textura('cartel|' + tx + '|' + col, 512, Math.round(512 * h / w), (x, W, H) => {
      x.fillStyle = '#f8f4ec'; x.fillRect(0, 0, W, H); x.fillStyle = col; x.fillRect(10, 10, W - 20, H - 20); x.fillStyle = '#f8f4ec'; x.textAlign = 'center'; x.textBaseline = 'middle';
      let fs = H * 0.5; x.font = `800 ${fs}px Fredoka, sans-serif`; while (x.measureText(tx).width > W * 0.86 && fs > 10) { fs -= 4; x.font = `800 ${fs}px Fredoka, sans-serif`; } x.fillText(tx, W / 2, H / 2 + 3); });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.caja(w, h, 0.012, 0.004, 3), mat: m('#f1ece2') }),
      nodo({ malla: MA.plano(w - 0.012, h - 0.012, 1), rot: [PI / 2, 0, 0], pos: [0, 0, 0.0075], mat: { color: '#ffffff', mapa, esp: 0.05, envolver: 0.4, borde: 0 } }) ] });
  };

  /* ---------------------------------------------------------------- edificio de pisos */
  const PH = 0.5, CW = 0.8;
  MO.edificio = (o = {}) => {
    const P = o.pisos || 5, C = o.cols || 3, W = C * CW, D = o.fondo || 1.1, H = P * PH, luces = o.luces || (() => null), col = o.color || '#cdb89c', hijos = [];
    if (o.obra) {
      for (let p = 0; p <= P; p++) hijos.push(nodo({ malla: MA.caja(W, 0.06, D, 0.01, 3), pos: [0, p * PH, 0], mat: m('#9aa0a8') }));
      for (const x of [-W / 2 + 0.06, 0, W / 2 - 0.06]) for (const z of [-D / 2 + 0.06, D / 2 - 0.06]) hijos.push(nodo({ malla: MA.caja(0.07, H, 0.07, 0.01, 3), pos: [x, H / 2, z], mat: m('#b2b7bd') }));
    } else {
      hijos.push(nodo({ malla: MA.caja(W, H, D, 0.02, 4), pos: [0, H / 2, 0], mat: m(col) }));
      hijos.push(nodo({ malla: MA.caja(W + 0.08, 0.06, D + 0.08, 0.015, 3), pos: [0, H + 0.03, 0], mat: m('#8c8478') }));                                  // cornisa
      hijos.push(nodo({ malla: MA.caja(W + 0.04, 0.07, D + 0.04, 0.01, 3), pos: [0, 0.035, 0], mat: m('#8c8478') }));                                      // zocalo
      for (let p = 0; p < P; p++) for (let c = 0; c < C; c++) {
        const x = (c - (C - 1) / 2) * CW, y = p * PH + 0.3, z = D / 2, l = luces(p, c);
        if (p === 0 && c === Math.floor(C / 2)) { hijos.push(nodo({ malla: MA.caja(0.46, 0.46, 0.03, 0.006, 3), pos: [x, 0.25, z + 0.004], mat: m('#f3efe6') })); hijos.push(nodo({ malla: MA.caja(0.4, 0.42, 0.03, 0.006, 3), pos: [x, 0.25, z + 0.014], mat: m('#6b4a2f') })); continue; }
        hijos.push(nodo({ malla: MA.caja(0.44, 0.34, 0.03, 0.006, 3), pos: [x, y, z + 0.004], mat: m('#f3efe6') }));
        hijos.push(nodo({ malla: MA.caja(0.37, 0.27, 0.03, 0.004, 3), pos: [x, y, z + 0.012], mat: l ? { color: l.color, esp: 0.3, emision: l.emision == null ? 0.7 : l.emision, envolver: 0.5 } : m('#2b3a4c', { esp: 0.5, dureza: 60 }) }));
        hijos.push(nodo({ malla: MA.caja(0.008, 0.27, 0.03, 0.002, 2), pos: [x, y, z + 0.02], mat: m('#f3efe6') }));
        if (p >= 1) hijos.push(nodo({ malla: MA.caja(0.5, 0.025, 0.14, 0.006, 3), pos: [x, p * PH + 0.12, z + 0.07], mat: m('#9a9288') }));                      // balcon
      }
    }
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };
  MO.edificio.punto = (p, c, o = {}) => { const C = o.cols || 3, D = o.fondo || 1.1; return [(c - (C - 1) / 2) * CW, p * PH + 0.3, D / 2 + 0.03]; };
  MO.edificio.alto = (P = 5) => P * PH;
  MO.edificio.ancho = (C = 3) => C * CW;

  /* ---------------------------------------------------------------- moneda, llave */
  MO.moneda = (o = {}) => nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
    nodo({ malla: MA.torno([[0, 0.0075], [0.05, 0.0075], [0.057, 0.0055], [0.057, -0.0055], [0.05, -0.0075], [0, -0.0075]], 28, 'alq|moneda'), mat: oro({ color: o.color, emision: o.emision }) }),
    nodo({ malla: MA.toro(0.036, 0.0032, 26, 6), pos: [0, 0.0072, 0], mat: oro({ color: '#c99a2e', emision: o.emision }) }) ] });
  MO.llave = (o = {}) => { const mt = Object.assign({ color: '#d9dde3', tipo: 'brillo', esp: 1, dureza: 90, envolver: 0.3 }, o.color ? { color: o.color } : {});
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.toro(0.045, 0.013, 28, 10), rot: [PI / 2, 0, 0], pos: [0, 0.135, 0], mat: mt }),
      nodo({ malla: MA.capsula(0.012, 0.012, 0.19, 12), pos: [0, 0.092, 0], mat: mt }),
      nodo({ malla: MA.caja(0.04, 0.02, 0.014, 0.004, 3), pos: [0.026, -0.065, 0], mat: mt }), nodo({ malla: MA.caja(0.03, 0.02, 0.014, 0.004, 3), pos: [0.021, -0.043, 0], mat: mt }),
      nodo({ malla: MA.caja(0.034, 0.018, 0.014, 0.004, 3), pos: [0.023, -0.02, 0], mat: mt }) ] }); };

  /* ---------------------------------------------------------------- puerta */
  MO.puerta = (o = {}) => { const W = 0.9, H = 2.05, mad = m(o.color || '#7a4a2c', { esp: 0.3, dureza: 30 }), marco = m('#e9e3d6'), ab = (o.abierta || 0) * 1.45;
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.caja(0.07, H + 0.07, 0.12, 0.01, 3), pos: [-W / 2 - 0.02, H / 2, 0], mat: marco }), nodo({ malla: MA.caja(0.07, H + 0.07, 0.12, 0.01, 3), pos: [W / 2 + 0.02, H / 2, 0], mat: marco }),
      nodo({ malla: MA.caja(W + 0.16, 0.07, 0.12, 0.01, 3), pos: [0, H + 0.03, 0], mat: marco }),
      nodo({ pos: [-W / 2, 0, 0], rot: [0, -ab, 0], hijos: [
        nodo({ malla: MA.caja(W - 0.02, H - 0.03, 0.05, 0.008, 3), pos: [W / 2, H / 2, 0], mat: mad }),
        nodo({ malla: MA.caja(W * 0.62, H * 0.3, 0.02, 0.01, 3), pos: [W / 2, H * 0.72, 0.03], mat: m('#6a3f24') }), nodo({ malla: MA.caja(W * 0.62, H * 0.34, 0.02, 0.01, 3), pos: [W / 2, H * 0.3, 0.03], mat: m('#6a3f24') }),
        nodo({ malla: MA.esfera(14), esc: 0.032, pos: [W - 0.1, H * 0.5, 0.06], mat: oro() }),
        nodo({ malla: MA.caja(0.07, 0.17, 0.012, 0.004, 3), pos: [W - 0.1, H * 0.5 + 0.12, 0.034], mat: oro() }),
        nodo({ malla: MA.cilindro(0.012, 0.012, 0.02, 12), rot: [PI / 2, 0, 0], pos: [W - 0.1, H * 0.5 + 0.12, 0.045], mat: m('#1a1612', { tipo: 'plano' }) }) ] }) ] }); };
  MO.puerta.cerradura = [0.35, 1.14, 0.06];   // punto local de la cerradura (puerta cerrada)

  /* ---------------------------------------------------------------- balanza */
  MO.balanza = (o = {}) => { const inc = o.inc || 0, met = m('#c7a24a', { tipo: 'brillo', esp: 0.8, dureza: 60 }), L = 0.74, cab = 0.58;
    const lado = (s, items) => nodo({ pos: [s * L, 0, 0], rot: [0, 0, -inc], hijos: [
      nodo({ malla: MA.capsula(0.006, 0.006, 0.62, 8), rot: [0, 0, 0.4], mat: met }), nodo({ malla: MA.capsula(0.006, 0.006, 0.62, 8), rot: [0, 0, -0.4], mat: met }),
      nodo({ pos: [0, -cab, 0], hijos: [nodo({ malla: MA.cilindro(0.3, 0.24, 0.03, 32), mat: met }), nodo({ pos: [0, 0.015, 0], hijos: items || [] })] }) ] });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.cilindro(0.3, 0.36, 0.06, 32), pos: [0, 0.03, 0], mat: m('#5d3f2b', { esp: 0.3 }) }), nodo({ malla: MA.cilindro(0.035, 0.05, 1.15, 16), pos: [0, 0.62, 0], mat: met }),
      nodo({ malla: MA.esfera(18), esc: 0.065, pos: [0, 1.2, 0], mat: met }),
      nodo({ pos: [0, 1.2, 0], rot: [0, 0, inc], hijos: [nodo({ malla: MA.caja(2 * L, 0.05, 0.07, 0.012, 3), mat: met }), lado(-1, o.izq), lado(1, o.der)] }) ] }); };

  /* ---------------------------------------------------------------- edificio institucional */
  MO.institucion = (o = {}) => { const piedra = m('#e9e1cf', { esp: 0.1 }), oscuro = m('#cfc5ae'), h = [];
    h.push(nodo({ malla: MA.caja(2.1, 0.08, 1.3, 0.01, 3), pos: [0, 0.04, 0.1], mat: oscuro })); h.push(nodo({ malla: MA.caja(1.9, 0.08, 1.15, 0.01, 3), pos: [0, 0.12, 0.05], mat: oscuro })); h.push(nodo({ malla: MA.caja(1.72, 0.08, 1.0, 0.01, 3), pos: [0, 0.2, 0], mat: oscuro }));
    h.push(nodo({ malla: MA.caja(1.5, 1.0, 0.6, 0.01, 3), pos: [0, 0.74, -0.2], mat: piedra }));
    for (let i = 0; i < 6; i++) h.push(nodo({ malla: MA.cilindro(0.065, 0.075, 0.9, 20), pos: [-0.65 + i * 0.26, 0.69, 0.3], mat: piedra }));
    h.push(nodo({ malla: MA.caja(1.62, 0.1, 0.78, 0.01, 3), pos: [0, 1.19, 0.12], mat: oscuro }));
    h.push(nodo({ malla: MA.extrusion([[-0.81, 0], [0.81, 0], [0, 0.34]], 0.78, 'alq|fronton'), pos: [0, 1.24, 0.12], mat: piedra }));
    h.push(nodo({ malla: MA.caja(0.3, 0.55, 0.02, 0.01, 3), pos: [0, 0.52, 0.1], mat: m('#5d3f2b') }));
    for (const x of [-0.5, 0.5]) h.push(nodo({ malla: MA.caja(0.2, 0.34, 0.02, 0.01, 3), pos: [x, 0.76, 0.1], mat: m('#44546a', { esp: 0.5 }) }));
    h.push(nodo({ malla: MA.cilindro(0.01, 0.01, 0.5, 8), pos: [0, 1.88, 0.12], mat: m('#8c8478') }));
    h.push(nodo({ malla: MA.caja(0.28, 0.17, 0.01, 0.004, 3), pos: [0.15, 1.99, 0.12], mat: m('#cf2e2e') }));
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: h }); };

  /* ---------------------------------------------------------------- grua torre */
  MO.grua = (o = {}) => { const am = m('#f0b400', { esp: 0.25 }), gr = m('#6b6f75'), AL = 2.5, h = [], gx = o.gancho == null ? 1.1 : o.gancho, cab = o.cable == null ? 0.9 : o.cable;
    for (const x of [-1, 1]) for (const z of [-1, 1]) h.push(nodo({ malla: MA.caja(0.035, AL, 0.035, 0.005, 2), pos: [x * 0.07, AL / 2, z * 0.07], mat: am }));
    for (let i = 1; i < 12; i++) h.push(nodo({ malla: MA.caja(0.17, 0.016, 0.016, 0.003, 2), pos: [0, i * AL / 12, 0.07], mat: am })), h.push(nodo({ malla: MA.caja(0.17, 0.016, 0.016, 0.003, 2), pos: [0, i * AL / 12, -0.07], mat: am }));
    h.push(nodo({ malla: MA.caja(0.4, 0.06, 0.4, 0.01, 3), pos: [0, 0.03, 0], mat: gr }));
    const tope = nodo({ pos: [0, AL + 0.05, 0], rot: [0, o.giro || 0, 0], hijos: [
      nodo({ malla: MA.caja(2.3, 0.07, 0.09, 0.008, 3), pos: [0.75, 0, 0], mat: am }), nodo({ malla: MA.caja(0.7, 0.07, 0.09, 0.008, 3), pos: [-0.5, 0, 0], mat: am }),
      nodo({ malla: MA.caja(0.2, 0.2, 0.15, 0.01, 3), pos: [-0.72, -0.1, 0], mat: gr }), nodo({ malla: MA.caja(0.16, 0.14, 0.14, 0.01, 3), pos: [0.06, -0.1, 0.12], mat: m('#cfd6df', { esp: 0.5 }) }),
      nodo({ malla: MA.caja(0.1, 0.2, 0.1, 0.008, 3), pos: [0, 0.13, 0], mat: am }),
      nodo({ malla: MA.capsula(0.007, 0.007, cab, 8), pos: [gx, -0.035, 0], mat: gr }),
      nodo({ pos: [gx, -0.035 - cab, 0], hijos: [nodo({ malla: MA.caja(0.07, 0.05, 0.05, 0.008, 3), mat: gr })].concat(o.carga || []) }) ] });
    h.push(tope); return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: h }); };

  /* ---------------------------------------------------------------- candado y escudo */
  MO.candado = (o = {}) => { const cu = oro({ color: o.color || '#e8b84a' }), gr = { color: '#c9ced6', tipo: 'brillo', esp: 1, dureza: 90, envolver: 0.3 };
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.toro(0.09, 0.022, 28, 10), rot: [PI / 2, 0, 0], pos: [0, 0.2, 0], mat: gr }),
      nodo({ malla: MA.caja(0.28, 0.24, 0.1, 0.03, 4), pos: [0, 0.11, 0], mat: cu }),
      nodo({ malla: MA.cilindro(0.022, 0.022, 0.02, 14), rot: [PI / 2, 0, 0], pos: [0, 0.13, 0.055], mat: m('#2a2013', { tipo: 'plano' }) }), nodo({ malla: MA.caja(0.012, 0.06, 0.02, 0.002, 2), pos: [0, 0.09, 0.055], mat: m('#2a2013', { tipo: 'plano' }) }) ] }); };
  MO.escudo = (o = {}) => { const pol = [[0, 0.3], [0.2, 0.24], [0.2, 0.0], [0.17, -0.1], [0.09, -0.22], [0, -0.3], [-0.09, -0.22], [-0.17, -0.1], [-0.2, 0.0], [-0.2, 0.24]];
    const pol2 = pol.map(p => [p[0] * 0.82, p[1] * 0.84 - 0.01]);
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.extrusion(pol, 0.05, 'alq|escudo'), mat: oro({ color: o.borde || '#e8b84a' }) }),
      nodo({ malla: MA.extrusion(pol2, 0.05, 'alq|escudo2'), pos: [0, 0, 0.012], mat: m(o.color || '#2f6bd6', { esp: 0.4, dureza: 40 }) }),
      nodo({ malla: MA.caja(0.03, 0.2, 0.02, 0.004, 2), pos: [0, 0.02, 0.04], mat: m('#ffffff') }), nodo({ malla: MA.caja(0.15, 0.03, 0.02, 0.004, 2), pos: [0, 0.07, 0.04], mat: m('#ffffff') }) ] }); };
})();
