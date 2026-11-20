/* VOLUMEN — OBJETOS PARA EXPLICAR LA INERCIA: taza de café, flecha 3D y ola gigante.
     V.modelos.taza({ cafe 0..1, color, pos, rot, esc, alfa })            taza de cerámica hueca (9 cm de alto, asa a +X) con el café a la altura `cafe` y su superficie brillante
     V.modelos.flecha({ largo, grosor, color, pos, rot, esc, alfa })      flecha recta que apunta a +X (de 0 a `largo`): cuerpo cilíndrico y punta cónica
     V.modelos.ola({ t, zf, altura, inund, nivel, x0, x1, z0, z1, n, color, nombre })
          frente de agua que avanza hacia −Z: cresta de `altura` metros en z = zf (cae más rápido por delante que por detrás), nivel
          de inundación `inund` por detrás y rizado suave; malla densa cerca del frente. Pensada para ir sobre V.modelos.terreno.
   Revisión: `vid.py qa <tema> --stills t`. */
(function () {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI;
  const m = (color, extra) => Object.assign({ color, esp: 0.2, dureza: 30, envolver: 0.35 }, extra || {});
  const ss = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

  MO.taza = (o = {}) => {
    const nivel = o.cafe == null ? 0.8 : o.cafe, col = o.color || '#f4f1ea';
    const perfil = [[0, 0.008], [0.030, 0.008], [0.038, 0.085], [0.043, 0.09], [0.045, 0.085], [0.036, 0.006], [0.031, 0], [0, 0]];
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [
      nodo({ malla: MA.torno(perfil, 28, 'taza|cuerpo'), mat: m(col, { tipo: 'brillo', esp: 0.7, dureza: 60, dobleCara: true }) }),
      nodo({ malla: MA.toro(0.022, 0.0065, 20, 10), pos: [0.047, 0.05, 0], rot: [PI / 2, 0, 0], esc: [1, 1.15, 1], mat: m(col, { tipo: 'brillo', esp: 0.7, dureza: 60 }) }),
      nodo({ malla: MA.cilindro(0.0345 + 0.006 * nivel, 0.0345 + 0.006 * nivel, 0.002, 28, true), pos: [0, 0.008 + nivel * 0.072, 0], mat: m('#4a2c1a', { tipo: 'brillo', esp: 0.9, dureza: 90, envolver: 0.2 }) }) ] });
  };

  MO.flecha = (o = {}) => {
    const L = o.largo || 1, g = o.grosor || 0.08, c = o.color || '#ffcf3a', hp = Math.min(L * 0.4, g * 3.4), mat = m(c, { tipo: 'brillo', esp: 0.5, dureza: 40, emision: o.emision == null ? 0.25 : o.emision });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [
      nodo({ malla: MA.cilindro(g, g, L - hp, 14, true), pos: [(L - hp) / 2, 0, 0], rot: [0, 0, -PI / 2], mat }),
      nodo({ malla: MA.cilindro(g * 2.1, 0, hp, 16, true), pos: [L - hp / 2, 0, 0], rot: [0, 0, -PI / 2], mat }) ] });
  };

  MO.ola = (o = {}) => {
    const x0 = o.x0 == null ? -140 : o.x0, x1 = o.x1 == null ? 140 : o.x1, E = Math.max(Math.abs(x0), Math.abs(x1)), zf = o.zf == null ? 100 : o.zf, H = o.altura == null ? 14 : o.altura, ind = o.inund == null ? 3 : o.inund,
      t = o.t || 0, y0 = o.nivel || 0, n = o.n || 130, cz = zf, ZE = Math.max(Math.abs((o.z1 == null ? 260 : o.z1) - zf), Math.abs((o.z0 == null ? -100 : o.z0) - zf));
    const h = (x, z) => {
      const d = z - zf, cresta = H * Math.exp(-Math.pow(d < 0 ? d / 4.5 : d / 20, 2)), tras = ind * ss(-3, 9, d);
      return y0 + cresta + tras + 0.22 * (Math.sin(x * 0.21 + z * 0.13 + t * 1.3) + 0.6 * Math.sin(x * -0.11 + z * 0.37 + t * 1.9));
    };
    const malla = MA.parametrica(n, n, (u, v) => { const a = u * 2 - 1, b = v * 2 - 1, x = Math.sign(a) * a * a * E, z = cz + Math.sign(b) * b * b * ZE; return [x, h(x, z), z]; }, { dinamica: o.nombre || 'ola' });
    return nodo({ nombre: 'ola', malla, mat: { tipo: 'brillo', color: o.color || '#2c7396', alfa: o.alfa == null ? 0.92 : o.alfa, esp: 0.9, dureza: 90, envolver: 0.05, borde: 0.6 } });
  };
})();
