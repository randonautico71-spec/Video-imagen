/* VOLUMEN — OBJETOS CIVICOS (votar, justicia, instituciones, papeles). Cada modelo mide ~1 unidad; pos/rot/esc como el resto de V.modelos.
     V.modelos.urna({papel})          urna de votacion azul con ranura y papeleta asomando
     V.modelos.papeleta()             hoja de papel (papeleta) de canto fino
     V.modelos.balanza({inclina})     balanza de la justicia; inclina -1..1 (positivo = baja el plato derecho)
     V.modelos.edificio({estado})     edificio institucional con frontón y columnas ('abierto' | 'cerrado': reja)
     V.modelos.candado({abierto})     candado dorado
     V.modelos.pila_papeles({n})      pila de hojas blancas
     V.modelos.mazo()                 mazo de juez sobre su base */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI;
  const m = (c, e) => Object.assign({ color: c, esp: 0.25, dureza: 30, envolver: 0.45, borde: 0.5 }, e || {});
  const N = (malla, mat, pos, rot, esc) => V.nodo({ malla, mat, pos, rot, esc });
  MO.papeleta = function (o = {}) { return V.nodo({ nombre: 'papeleta', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [N(MA.caja(0.5, 0.012, 0.7, 0.004, 1), m('#fbfaf4', { esp: 0.1 })), N(MA.caja(0.3, 0.014, 0.06, 0.002, 1), m(o.color || '#2f6fb5', { esp: 0.1 }), [0, 0.001, -0.12]), N(MA.caja(0.3, 0.014, 0.03, 0.002, 1), m('#9aa4b0', { esp: 0.1 }), [0, 0.001, 0.0]), N(MA.caja(0.3, 0.014, 0.03, 0.002, 1), m('#9aa4b0', { esp: 0.1 }), [0, 0.001, 0.1])] }); };
  MO.urna = function (o = {}) {
    const H = [N(MA.caja(0.95, 0.8, 0.7, 0.05, 3), m('#3d7fcc', { esp: 0.4, dureza: 40 }), [0, 0.4, 0]), N(MA.caja(1.02, 0.07, 0.76, 0.03, 2), m('#2a5c99'), [0, 0.8, 0]), N(MA.caja(0.5, 0.02, 0.07, 0.005, 1), m('#0c1624', { esp: 0.1 }), [0, 0.845, 0]),
      N(MA.caja(0.36, 0.34, 0.012, 0.004, 1), m('#fbfaf4', { esp: 0.1 }), [0, 0.42, 0.355]), N(MA.caja(0.18, 0.02, 0.014, 0.003, 1), m('#2f6fb5'), [0, 0.5, 0.358])];
    if (o.papel) H.push(V.nodo({ pos: [0, 0.86 + 0.1 * (o.papel > 0.5 ? 0 : 0), 0], rot: [0, 0, 0], hijos: [N(MA.caja(0.36, 0.5, 0.012, 0.004, 1), m('#fbfaf4', { esp: 0.1 }), [0, 0.05 + 0.5 * (o.papel - 1) * 0.5, 0])] }));
    return V.nodo({ nombre: 'urna', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H });
  };
  MO.balanza = function (o = {}) {
    const ang = -(o.inclina || 0) * 0.28, oro = m('#d8b24a', { esp: 0.7, dureza: 60, borde: 0.7 }), L = 0.75, H = [];
    H.push(N(MA.cilindro(0.34, 0.4, 0.1, 28), oro, [0, 0.05, 0])); H.push(N(MA.cilindro(0.045, 0.06, 1.3, 14), oro, [0, 0.7, 0]));
    const plato = (x, y) => V.nodo({ pos: [x, y, 0], hijos: [N(MA.cilindro(0.015, 0.015, 0.5, 6), oro, [0, -0.27, 0]), N(MA.cilindro(0.3, 0.26, 0.05, 28), oro, [0, -0.56, 0])] });
    H.push(V.nodo({ pos: [0, 1.35, 0], rot: [0, 0, ang], hijos: [N(MA.cilindro(0.03, 0.03, L * 2, 10), oro, [0, 0, 0], [0, 0, PI / 2]), N(MA.esfera(14), oro, [0, 0, 0], [0, 0, 0], [0.08, 0.08, 0.08]), plato(-L, 0), plato(L, 0)] }));
    return V.nodo({ nombre: 'balanza', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H });
  };
  MO.candado = function (o = {}) {
    const oro = m('#d8b24a', { esp: 0.7, dureza: 60 }), a = o.abierto ? 0.5 : 0;
    return V.nodo({ nombre: 'candado', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [N(MA.caja(0.6, 0.5, 0.24, 0.06, 3), oro, [0, 0.25, 0]), N(MA.caja(0.07, 0.17, 0.04, 0.01, 1), m('#3a2a10'), [0, 0.25, 0.125]), V.nodo({ pos: [0.18 * (o.abierto ? 1 : 0), o.abierto ? 0.08 : 0, 0], rot: [0, 0, -a], hijos: [N(MA.toro(0.17, 0.045, 24, 10), m('#aab3bd', { esp: 0.85, dureza: 70 }), [0, 0.5, 0], [PI / 2, 0, 0])] })] });
  };
  MO.edificio = function (o = {}) {
    const pie = m('#e9e3d3', { esp: 0.2, envolver: 0.45 }), H = [];
    H.push(N(MA.caja(2.4, 0.12, 1.2, 0.02, 2), pie, [0, 0.06, 0])); H.push(N(MA.caja(2.2, 0.08, 1.0, 0.02, 2), pie, [0, 0.16, 0]));
    for (let i = 0; i < 6; i++) H.push(N(MA.cilindro(0.09, 0.1, 1.05, 16), pie, [-0.9 + i * 0.36, 0.72, 0.38]));
    H.push(N(MA.caja(2.1, 0.12, 0.9, 0.02, 2), pie, [0, 1.3, 0.1]));
    H.push(N(MA.extrusion([[-1.1, 0], [1.1, 0], [0, 0.5]], 0.9, 'civ|fronton'), m('#d9d2c0', { esp: 0.2 }), [0, 1.36, 0.1]));
    H.push(N(MA.caja(1.7, 0.95, 0.6, 0.02, 2), m('#cfc7b2', { esp: 0.15 }), [0, 0.7, -0.05]));
    H.push(N(MA.caja(0.34, 0.6, 0.03, 0.005, 1), m(o.estado === 'cerrado' ? '#5a3d28' : '#2b241c'), [0, 0.45, 0.26]));
    if (o.estado === 'cerrado') for (let i = 0; i < 5; i++) H.push(N(MA.cilindro(0.012, 0.012, 0.62, 6), m('#444a52', { esp: 0.5 }), [-0.14 + i * 0.07, 0.45, 0.285]));
    return V.nodo({ nombre: 'edificio', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H });
  };
  MO.pila_papeles = function (o = {}) { const n = Math.max(1, Math.round(o.n || 10)), H = []; for (let i = 0; i < n; i++) H.push(N(MA.caja(0.55, 0.016, 0.75, 0.004, 1), m(i % 2 ? '#fbfaf4' : '#f1efe6', { esp: 0.1 }), [((i * 37) % 5 - 2) * 0.006, 0.01 + i * 0.017, ((i * 53) % 5 - 2) * 0.006], [0, ((i * 29) % 7 - 3) * 0.02, 0])); return V.nodo({ nombre: 'pila_papeles', pos: o.pos, rot: o.rot, esc: o.esc, hijos: H }); };
  MO.mazo = function (o = {}) { const mad = m('#8a5a2e', { esp: 0.3 }); return V.nodo({ nombre: 'mazo', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [N(MA.cilindro(0.4, 0.4, 0.1, 24), mad, [0, 0.05, 0]), V.nodo({ pos: [0, 0.35, 0], rot: [0, 0, 0.6], hijos: [N(MA.cilindro(0.04, 0.04, 0.8, 10), mad, [0, 0, 0]), N(MA.cilindro(0.14, 0.14, 0.42, 18), mad, [0, 0.42, 0], [PI / 2, 0, 0])] })] }); };
})(window.VE = window.VE || {});
