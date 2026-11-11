/* VOLUMEN — OBJETOS COTIDIANOS Y BARRIOS (dinero, estudio, oficio, ideas, casa). Cada modelo mide ~1 unidad; pos/rot/esc como el resto de V.modelos.
     V.modelos.hucha({monedas})   cerdito hucha rosa con ranura, orejas, patas y rabito
     V.modelos.moneda()           moneda dorada de canto (cilindro corto)
     V.modelos.pila_monedas({n})  torre de monedas de n piezas (altura proporcional)
     V.modelos.libros({n})        pila de libros de colores
     V.modelos.herramientas()     llave inglesa y martillo cruzados
     V.modelos.bombilla({luz})    bombilla (luz 0..1 = brillo)
     V.modelos.casa({estado})     casita: estado 'cuidada' (colores vivos, ventanas con luz) | 'dejada' (grises, ventanas oscuras, techo torcido)
     V.modelos.mesa({ancho})      mesa de madera (tablero a y = 0) */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI;
  const m = (c, e) => Object.assign({ color: c, esp: 0.25, dureza: 30, envolver: 0.45, borde: 0.5 }, e || {});
  const N = (malla, mat, pos, rot, esc) => V.nodo({ malla, mat, pos, rot, esc });
  MO.moneda = function (o = {}) { return V.nodo({ nombre: 'moneda', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [N(MA.cilindro(0.16, 0.16, 0.035, 28), m('#f2c14e', { esp: 0.7, dureza: 60, borde: 0.7 })), N(MA.cilindro(0.115, 0.115, 0.04, 24), m('#d9a232', { esp: 0.5 }))] }); };
  MO.pila_monedas = function (o = {}) { const n = Math.max(1, Math.round(o.n || 8)), H = []; for (let i = 0; i < n; i++) H.push(N(MA.cilindro(0.16, 0.16, 0.036, 28), m(i % 2 ? '#f2c14e' : '#e6b23f', { esp: 0.7, dureza: 60, borde: 0.8 }), [0, 0.02 + i * 0.04, 0])); return V.nodo({ nombre: 'pila_monedas', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H }); };
  MO.hucha = function (o = {}) {
    const rosa = m('#f0a0b0', { esp: 0.45, dureza: 40, envolver: 0.5 }), oscuro = m('#b8566e'), H = [];
    H.push(N(MA.esfera(32), rosa, [0, 0.5, 0], [0, 0, 0], [0.68, 0.52, 0.5]));
    H.push(N(MA.cilindro(0.17, 0.2, 0.2, 24), rosa, [0.68, 0.5, 0], [0, 0, PI / 2]));
    H.push(N(MA.cilindro(0.17, 0.17, 0.04, 24), oscuro, [0.79, 0.5, 0], [0, 0, PI / 2]));
    for (const s of [-1, 1]) { H.push(N(MA.cilindro(0.0, 0.11, 0.2, 14), rosa, [0.35, 0.95, s * 0.2], [s * 0.3, 0, -0.35])); }
    for (const [x, z] of [[0.34, 0.2], [0.34, -0.2], [-0.34, 0.2], [-0.34, -0.2]]) H.push(N(MA.cilindro(0.09, 0.1, 0.24, 14), rosa, [x, 0.12, z]));
    H.push(N(MA.caja(0.3, 0.04, 0.06, 0.012, 2), m('#5a2a3a'), [0, 0.99, 0]));
    H.push(N(MA.toro(0.07, 0.018, 16, 8), rosa, [-0.7, 0.55, 0], [0, 0, 0.4]));
    for (const s of [-1, 1]) H.push(N(MA.esfera(12), m('#2a1a1a', { esp: 0.8 }), [0.6, 0.66, s * 0.17], [0, 0, 0], [0.035, 0.035, 0.03]));
    return V.nodo({ nombre: 'hucha', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H });
  };
  MO.libros = function (o = {}) {
    const n = o.n || 4, cols = ['#a83a3a', '#2f5d9a', '#d0a23c', '#3f7a52', '#7a4a8a'], H = []; let y = 0;
    for (let i = 0; i < n; i++) { const h = 0.16 + (i % 3) * 0.03, w = 0.9 - (i % 2) * 0.12; H.push(V.nodo({ pos: [((i * 37) % 7 - 3) * 0.012, y + h / 2, 0], rot: [0, ((i * 53) % 9 - 4) * 0.03, 0], hijos: [N(MA.caja(w, h, 0.62, 0.015, 2), m(cols[i % cols.length], { esp: 0.2 })), N(MA.caja(w - 0.04, h - 0.04, 0.58, 0.01, 2), m('#f1ead8', { esp: 0.1 }), [0.02, 0, 0.0])] })); y += h; }
    return V.nodo({ nombre: 'libros', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H });
  };
  MO.herramientas = function (o = {}) {
    const metal = m('#aab3bd', { esp: 0.85, dureza: 70, envolver: 0.3, borde: 0.8 }), mango = m('#c0462c', { esp: 0.3 }), madera = m('#9a6a3a'), H = [];
    H.push(V.nodo({ rot: [0, 0, 0.7], hijos: [N(MA.cilindro(0.05, 0.05, 0.95, 14), metal, [0, 0.35, 0]), N(MA.toro(0.13, 0.05, 20, 10), metal, [0, 0.9, 0], [PI / 2, 0, 0]), N(MA.caja(0.12, 0.1, 0.1, 0.01, 2), m('#445', { esp: 0.2 }), [0.1, 0.9, 0])] }));
    H.push(V.nodo({ rot: [0, 0, -0.7], hijos: [N(MA.cilindro(0.06, 0.06, 1.0, 14), madera, [0, 0.35, 0]), N(MA.caja(0.42, 0.18, 0.18, 0.02, 2), metal, [0.04, 0.88, 0]), N(MA.cilindro(0.055, 0.055, 0.3, 14), mango, [0, -0.02, 0])] }));
    return V.nodo({ nombre: 'herramientas', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H });
  };
  MO.bombilla = function (o = {}) {
    const l = o.luz == null ? 1 : o.luz;
    return V.nodo({ nombre: 'bombilla', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [N(MA.esfera(32), m('#fff2b8', { esp: 0.9, dureza: 80, emision: 0.15 + 0.85 * l, envolver: 0.2, alfa: 0.9 }), [0, 0.62, 0], [0, 0, 0], [0.4, 0.44, 0.4]),
      N(MA.cilindro(0.17, 0.17, 0.26, 20), m('#9aa2ab', { esp: 0.8, dureza: 70 }), [0, 0.2, 0]), N(MA.cilindro(0.1, 0.12, 0.08, 16), m('#555b63'), [0, 0.02, 0]),
      N(MA.toro(0.1, 0.012, 14, 6), m('#ffcf5a', { emision: l }), [0, 0.6, 0], [PI / 2, 0, 0])] });
  };
  MO.casa = function (o = {}) {
    const cuid = o.estado !== 'dejada', pared = cuid ? (o.color || '#f0d9a0') : '#8d8a84', techo = cuid ? '#b6523c' : '#5a5650', w = 1.0, h = 0.62, d = 0.8, H = [];
    H.push(N(MA.caja(w, h, d, 0.01, 2), m(pared, { esp: 0.1, envolver: 0.4 }), [0, h / 2, 0]));
    const tor = cuid ? 0 : 0.06;
    H.push(V.nodo({ pos: [0, h, 0], rot: [0, 0, tor], hijos: [N(MA.extrusion([[-w * 0.58, 0], [w * 0.58, 0], [0, 0.42]], d * 1.15, 'casa|techo'), m(techo, { esp: 0.1, envolver: 0.4 }), [0, 0, 0])] }));
    H.push(N(MA.caja(0.2, 0.34, 0.04, 0.005, 2), m(cuid ? '#6a3f2a' : '#3e3a36'), [0.0, 0.17, d / 2 + 0.01]));
    for (const x of [-0.3, 0.3]) H.push(N(MA.caja(0.2, 0.2, 0.04, 0.005, 2), m(cuid ? '#ffe9a0' : '#2b2e33', { emision: cuid ? 0.55 : 0, esp: 0.5 }), [x, 0.38, d / 2 + 0.01]));
    if (cuid) H.push(N(MA.caja(0.12, 0.28, 0.12, 0.01, 2), m('#8a4a38'), [0.28, h + 0.42, -0.1]));
    return V.nodo({ nombre: 'casa', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H });
  };
  MO.mesa = function (o = {}) {
    const w = o.ancho || 8, mad = V.textura('hab|mesa', 512, 256, (x, W, H) => { const r = VE.rng('mesa'); x.fillStyle = '#9a6a3c'; x.fillRect(0, 0, W, H); for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(${60 + r() * 40 | 0},${35 + r() * 25 | 0},20,${0.12 + r() * 0.15})`; x.lineWidth = 1 + r() * 3; x.beginPath(); x.moveTo(0, r() * H); x.bezierCurveTo(W * 0.3, r() * H, W * 0.6, r() * H, W, r() * H); x.stroke(); } });
    return V.nodo({ nombre: 'mesa', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [N(MA.caja(w, 0.3, 4, 0.04, 3), { color: '#ffffff', mapa: mad, esp: 0.25, dureza: 30, envolver: 0.4, borde: 0.2 }, [0, -0.15, 0])] });
  };
})(window.VE = window.VE || {});
