/* DORMITORIO: móvil con pantalla luminosa y mesilla con lámpara (VE.vol).
     V.modelos.movil({pos, rot, esc, brillo, color, pantalla})   móvil (0,075 x 0,155 x 0,008 m) · nodo 'pantalla_movil' · brillo 0..1 · color de la pantalla
     V.modelos.mesilla({pos, rot, esc, lampara})                 mesilla con lámpara y, si lampara>0, pantalla encendida */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos;
  MO.movil = function (o = {}) {
    const b = o.brillo == null ? 1 : o.brillo, col = o.color || '#bcd4ff';
    const h = [];
    h.push(V.nodo({ malla: MA.caja(0.075, 0.155, 0.009, 0.012), mat: { color: '#15171d', esp: 0.5, dureza: 60, envolver: 0.1 } }));
    h.push(V.nodo({ nombre: 'pantalla_movil', malla: MA.caja(0.068, 0.146, 0.002, 0.008), pos: [0, 0, 0.0052], mat: { color: col, emision: 0.9 * b + 0.1, esp: 0.0, envolver: 0 } }));
    h.push(V.nodo({ malla: MA.esfera(10), esc: [0.0045, 0.0045, 0.002], pos: [0, 0.067, 0.0065], mat: { color: '#0a0b10', esp: 0.2 } }));
    return V.nodo({ nombre: 'movil', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };
  MO.mesilla = function (o = {}) {
    const mad = { color: '#5a3d25', esp: 0.3, dureza: 30 }, h = [];
    h.push(V.nodo({ malla: MA.caja(0.5, 0.5, 0.45, 0.02), mat: mad, pos: [0, 0.25, 0] }));
    h.push(V.nodo({ malla: MA.caja(0.44, 0.02, 0.01, 0.005), mat: { color: '#2b1c10' }, pos: [0, 0.3, 0.226] }));
    const L = o.lampara == null ? 0 : o.lampara;
    h.push(V.nodo({ malla: MA.cilindro(0.04, 0.05, 0.02, 20), mat: { color: '#222' }, pos: [0.1, 0.51, 0] }));
    h.push(V.nodo({ malla: MA.cilindro(0.012, 0.012, 0.18, 10), mat: { color: '#333' }, pos: [0.1, 0.6, 0] }));
    h.push(V.nodo({ malla: MA.cilindro(0.06, 0.12, 0.13, 22), mat: { color: '#f2e2c4', emision: 0.15 + 0.85 * L, alfa: 1 }, pos: [0.1, 0.74, 0] }));
    return V.nodo({ nombre: 'mesilla', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };
})(window.VE);
