/* ============================================================================================
   OIDO Y CARA (3D, para temas de salud / cuerpo humano). Registrado en engine/video/index.html tras abismo.js.
     V.modelos.rasgos({ piel, pelo, ojo, mujer })       nodos de ojos, cejas, nariz, boca, orejas y pelo en el marco de la cabeza del maniqui
        (cabeza = elipsoide de radios 0.095 x 0.125 x 0.09 mirando a +X). Para el maniqui:  equipo: { cuello: [V.nodo({ pos: [0.015, 0.18, 0], hijos: MO.rasgos() })] }
     V.modelos.cabeza({ piel, pelo, ojo, pos, rot, esc, rayosx, oreja })   cabeza + cuello + hombros con rasgos, para planos cercanos (mira a +X, orejas en +-Z)
     V.modelos.cabeza.oreja({ pos, rot, esc, lado })    punto del conducto auditivo en el mundo (para anclar ondas y etiquetas)
     V.modelos.oido_interno({ t, esc, pos, rot, sonido, alfa, brillo })   caracol (coclea) en espiral, 3 canales semicirculares, vestibulo y nervio auditivo
     V.modelos.oido_interno.punto(nombre, { pos, rot, esc })            'coclea' | 'nervio' | 'base' | 'canales' | 'vestibulo' (mundo, para etiquetas)
     V.modelos.virus({ t, esc, pos })   y   V.modelos.celula({ t, esc, pos })   particulas para ilustrar hipotesis (virus con espigas, globulo blanco)
   Revision: dibujar un fotograma con `vid.py qa <tema> --stills t`. */
(function () {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI, TAU = PI * 2;

  /* ---------------------------------------------------------------- rasgos de la cara */
  MO.rasgos = (o = {}) => {
    const piel = o.piel || '#d9a982', sombra = o.sombra || '#c98f6a', pelo = o.pelo || '#2d1f16', iris = o.ojo || '#5a3a22', labio = o.mujer ? '#b8505a' : '#b5645a';
    const m = (color, extra) => Object.assign({ color, esp: 0.18, dureza: 22, envolver: 0.3 }, extra || {});
    const r = [];
    for (const k of [1, -1]) {
      r.push(nodo({ pos: [0.078, 0.028, 0.038 * k], rot: [0, -0.2 * k, 0], hijos: [                                 // ojo: esclerotica, iris, pupila y brillo
        nodo({ malla: MA.esfera(16), esc: [0.0145, 0.0125, 0.0185], mat: m('#f3efe8', { esp: 0.5, dureza: 60 }) }),
        nodo({ malla: MA.esfera(14), esc: [0.0085, 0.0105, 0.0105], pos: [0.0108, 0, 0], mat: m(iris, { esp: 0.7, dureza: 80 }) }),
        nodo({ malla: MA.esfera(10), esc: [0.004, 0.0055, 0.0055], pos: [0.0165, 0, 0], mat: { color: '#0a0706', tipo: 'plano' } }),
        nodo({ malla: MA.esfera(8), esc: 0.0022, pos: [0.0185, 0.004, 0.003], mat: { color: '#ffffff', tipo: 'plano' } }) ] }));
      r.push(nodo({ malla: MA.esfera(12), esc: [0.0165, 0.0032, 0.0205], pos: [0.0775, 0.0385, 0.0385 * k], rot: [0.1 * k, 0, 0], mat: m(sombra) }));            // parpado superior
      r.push(nodo({ malla: MA.capsula(0.0042, 0.0042, 0.034, 8), pos: [0.083, 0.055, 0.0425 * k], rot: [PI / 2 + 0.2 * k, 0, 0.06], mat: m(pelo, { esp: 0.05 }) })); // ceja
      /* oreja: pabellon aplanado, borde (helix), concha oscura y lobulo */
      r.push(nodo({ pos: [-0.006, -0.006, 0.0885 * k], rot: [0, 0, 0.18], hijos: [
        nodo({ malla: MA.esfera(20), esc: [0.0175, 0.032, 0.0075], mat: m(sombra) }),
        nodo({ malla: MA.toro(0.0165, 0.0042, 24, 8), esc: [0.95, 1, 1.9], rot: [PI / 2, 0, 0], pos: [0, 0.002, 0.003 * k], mat: m(piel) }),
        nodo({ malla: MA.esfera(14), esc: [0.008, 0.015, 0.0035], pos: [0.002, -0.001, 0.0065 * k], mat: m('#9c6a4c', { esp: 0.05 }) }),
        nodo({ malla: MA.esfera(10), esc: [0.0045, 0.0045, 0.0025], pos: [0.0035, -0.004, 0.0085 * k], mat: { color: '#1a0f0b', tipo: 'plano' } }),
        nodo({ malla: MA.esfera(12), esc: [0.0075, 0.0095, 0.005], pos: [0.001, -0.033, 0.0015 * k], mat: m(piel) }) ] }));
    }
    r.push(nodo({ malla: MA.esfera(16), esc: [0.0095, 0.024, 0.0085], pos: [0.0895, 0.004, 0], rot: [0, 0, -0.1], mat: m(piel) }));                         // puente de la nariz
    r.push(nodo({ malla: MA.esfera(16), esc: [0.019, 0.0165, 0.0175], pos: [0.0905, -0.0185, 0], mat: m(piel) }));                                         // punta
    for (const k of [1, -1]) r.push(nodo({ malla: MA.esfera(10), esc: [0.008, 0.0095, 0.0075], pos: [0.083, -0.0215, 0.0155 * k], mat: m(piel) }));         // alas
    r.push(nodo({ malla: MA.esfera(16), esc: [0.011, 0.0042, 0.0285], pos: [0.0845, -0.0555, 0], mat: m(labio, { esp: 0.35, dureza: 40 }) }));              // labio superior
    r.push(nodo({ malla: MA.esfera(16), esc: [0.0105, 0.0052, 0.0245], pos: [0.0825, -0.0645, 0], mat: m(labio, { esp: 0.35, dureza: 40 }) }));             // labio inferior
    r.push(nodo({ malla: MA.esfera(16), esc: [0.011, 0.0075, 0.0255], pos: [0.0795, -0.0585, 0], mat: { color: '#3a1512', tipo: 'plano' } }));              // linea de la boca
    r.push(nodo({ malla: MA.esfera(16), esc: [0.009, 0.008, 0.0145], pos: [0.0795, -0.0795, 0], mat: m(piel) }));                                           // menton
    /* pelo: casquete (superficie abierta) con la linea del pelo alta en la frente y baja en la nuca; deja libres cara y orejas */
    const casquete = MA.parametrica(40, 14, (u, v) => { const th = u * TAU, fi = v * (1.1 + 0.8 * Math.pow((1 - Math.cos(th)) / 2, 2)), s = 1.045;
      return [0.095 * s * Math.sin(fi) * Math.cos(th) - 0.003, 0.125 * s * Math.cos(fi), 0.09 * s * Math.sin(fi) * Math.sin(th)]; }, { clave: 'oido|pelo', abierta: true });
    r.push(nodo({ malla: casquete, mat: m(pelo, { esp: 0.25, dureza: 30, envolver: 0.5, dobleCara: true }) }));
    return r;
  };

  /* cabeza independiente (planos cercanos): escala 1 ~ tamano real; usar esc 4-8 para primeros planos */
  MO.cabeza = (o = {}) => {
    const piel = o.piel || '#d9a982', rx = !!o.rayosx;
    const matPiel = rx ? { tipo: 'rayosx', color: '#9fd8ff', alfa: 0.55 } : { color: piel, esp: 0.18, dureza: 22, envolver: 0.35 };
    const base = [
      nodo({ malla: MA.esfera(40), esc: [0.095, 0.125, 0.09], mat: matPiel }),
      nodo({ malla: MA.capsula(0.04, 0.046, 0.13, 24), pos: [0.0, -0.11, 0], mat: matPiel }),
      nodo({ malla: MA.esfera(32), esc: [0.1, 0.075, 0.19], pos: [-0.02, -0.285, 0], mat: rx ? matPiel : { color: o.ropa || '#33506b', esp: 0.08, envolver: 0.4 } }) ];
    const cara = rx ? [] : MO.rasgos(o);
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: base.concat(cara) });
  };
  MO.cabeza.oreja = (o = {}) => {
    const s = o.esc == null ? 1 : (Array.isArray(o.esc) ? o.esc[0] : o.esc), lado = o.lado == null ? 1 : o.lado, p = o.pos || [0, 0, 0], a = (o.rot && o.rot[1]) || 0;
    const lx = -0.006 * s, lz = 0.0925 * s * lado, c = Math.cos(a), sn = Math.sin(a);
    return [p[0] + lx * c + lz * sn, p[1] - 0.006 * s, p[2] - lx * sn + lz * c];
  };

  /* ---------------------------------------------------------------- oido interno */
  const espiral = (() => { const pts = [], n = 90; for (let i = 0; i <= n; i++) { const q = i / n, a = q * 2.75 * TAU, R = 0.17 * (1 - 0.66 * q); pts.push([Math.cos(a) * R, q * 0.24, Math.sin(a) * R]); } return pts; })();
  MO.oido_interno = (o = {}) => {
    const t = o.t || 0, br = o.brillo == null ? 1 : o.brillo, son = o.sonido || 0, rx = !!o.rayosx;
    const hueso = rx ? { tipo: 'rayosx', color: '#bfe6ff' } : { color: '#f1d1c0', esp: 0.5, dureza: 50, envolver: 0.4, borde: 0.6 };
    const canal = rx ? { tipo: 'rayosx', color: '#bfe6ff' } : { color: '#e9dcae', esp: 0.5, dureza: 50, envolver: 0.4, borde: 0.6 };
    const hijos = [
      nodo({ malla: MA.tubo(espiral, (q) => 0.052 * (1 - 0.6 * q) + 0.012, 16, { clave: 'oido|coclea' }), mat: hueso }),
      nodo({ malla: MA.esfera(16), esc: 0.064, pos: espiral[0], mat: hueso }), nodo({ malla: MA.esfera(12), esc: 0.0125, pos: espiral[90], mat: hueso }),
      nodo({ malla: MA.esfera(22), esc: [0.075, 0.06, 0.075], pos: [-0.17, 0.2, 0], mat: hueso }),                                   // vestibulo
      nodo({ malla: MA.toro(0.13, 0.017, 40, 12), esc: 1, pos: [-0.2, 0.37, 0.0], rot: [0, 0, 0], mat: canal }),                       // canales semicirculares (3 planos)
      nodo({ malla: MA.toro(0.13, 0.017, 40, 12), pos: [-0.2, 0.37, 0.0], rot: [PI / 2, 0, 0], mat: canal }),
      nodo({ malla: MA.toro(0.13, 0.017, 40, 12), pos: [-0.2, 0.37, 0.0], rot: [0, 0, PI / 2], mat: canal }),
      nodo({ malla: MA.tubo([[0.0, 0.1, 0.0], [-0.1, 0.0, 0.1], [-0.32, -0.05, 0.22], [-0.6, 0.0, 0.3]], (q) => 0.03 * (1 - 0.3 * q), 10, { clave: 'oido|nervio' }),
        mat: rx ? { tipo: 'rayosx', color: '#ffe7a0' } : { color: '#f3e29a', esp: 0.3, envolver: 0.4 } }) ];
    /* celulas ciliadas: puntos que brillan a lo largo del caracol (se apagan con sonido = 0) */
    for (let i = 4; i < 88; i += 6) { const p = espiral[i], q = i / 90, v = 0.5 + 0.5 * Math.sin(t * 5 - i * 0.35), e = 0.25 + 0.75 * v;
      hijos.push(nodo({ malla: MA.esfera(8), esc: 0.011 + 0.006 * e * son, pos: [p[0], p[1] + 0.045, p[2]], mat: { color: son > 0.05 ? '#9ff3ff' : '#6b7f86', tipo: 'plano', alfa: 0.35 + 0.65 * son * e }, sinSombra: true })); }
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos });
  };
  MO.oido_interno.punto = (n, o = {}) => {
    const s = o.esc == null ? 1 : (Array.isArray(o.esc) ? o.esc[0] : o.esc), p = o.pos || [0, 0, 0], a = (o.rot && o.rot[1]) || 0, c = Math.cos(a), sn = Math.sin(a);
    const L = { coclea: [0.0, 0.1, 0.0], nervio: [-0.35, -0.02, 0.24], base: [0.15, 0.0, 0.0], canales: [-0.2, 0.5, 0.0], vestibulo: [-0.17, 0.2, 0.0] }[n] || [0, 0, 0];
    return [p[0] + (L[0] * c + L[2] * sn) * s, p[1] + L[1] * s, p[2] + (-L[0] * sn + L[2] * c) * s];
  };

  /* ---------------------------------------------------------------- particulas de hipotesis */
  MO.virus = (o = {}) => {
    const t = o.t || 0, h = [nodo({ malla: MA.esfera(16), esc: 0.05, mat: { color: '#b5e04a', esp: 0.5, dureza: 40, envolver: 0.3 } })];
    for (let i = 0; i < 14; i++) { const u = Math.acos(1 - 2 * (i + 0.5) / 14), v = i * 2.4 + t * 0.4, d = [Math.sin(u) * Math.cos(v), Math.cos(u), Math.sin(u) * Math.sin(v)];
      h.push(nodo({ malla: MA.esfera(8), esc: 0.014, pos: [d[0] * 0.066, d[1] * 0.066, d[2] * 0.066], mat: { color: '#e8ff7a', esp: 0.4 } })); }
    return nodo({ pos: o.pos, rot: [t * 0.3, t * 0.5, 0], esc: o.esc, alfa: o.alfa, hijos: h });
  };
  MO.celula = (o = {}) => {
    const t = o.t || 0;
    return nodo({ pos: o.pos, rot: [t * 0.4, t * 0.2, 0], esc: o.esc, alfa: o.alfa, hijos: [
      nodo({ malla: MA.esfera(18), esc: 0.055, mat: { color: '#f4f1ea', esp: 0.4, dureza: 30, envolver: 0.4 } }),
      nodo({ malla: MA.esfera(12), esc: 0.03, pos: [0.02, 0.01, 0.025], mat: { color: '#a98ad6', esp: 0.2 } }) ] });
  };
})();
