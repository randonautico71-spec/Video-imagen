/* ============================================================================================
   MONOVOLUMEN (3D): coche familiar de perfil limpio, pensado para escenas de seguridad (agua, choque, rayos X).
   Todo por piezas (V.malla); metros; MORRO HACIA +X (como el maniqui, que mira a +X: vista lateral = camara en +Z).
     V.modelos.monovolumen({ color, xr 0..1, vent 0..1, cinturon 0..1, ocupantes: [nodos], pos, rot, esc })
        xr         0 = chapa solida; 1 = rayos X cian (contornos, se ve todo el interior); entre medias, fundido
        vent       0..1 baja la ventanilla delantera del lado de la camara (+Z)
        cinturon   0..1 muestra la banda del cinturon del conductor (1 = puesto, 0 = suelto)
        ocupantes  nodos hijos (maniquis) en coordenadas del coche: giran con el
     Asientos: conductor en (0.30, 0.85, +0.42) (cerca de la camara), copiloto en z = -0.42, banco trasero en x = -0.95.
   Registrado en engine/video/index.html tras trafico.js. */
(function () {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI;
  const m = (color, extra) => Object.assign({ color, esp: 0.15, dureza: 26, envolver: 0.35 }, extra || {});
  const XR = '#5fe7ff';

  MO.monovolumen = (o = {}) => {
    const xr = Math.max(0, Math.min(1, o.xr || 0)), col = o.color || '#f1f5fa', vent = o.vent || 0, cin = o.cinturon == null ? 1 : o.cinturon;
    const pint = m(col, { tipo: 'brillo', esp: 0.55, dureza: 60 }), oscuro = m('#2a3140', { esp: 0.1 }), goma = m('#14171d');
    const cristal = { color: '#9fcdea', tipo: 'brillo', esp: 0.9, dureza: 90, envolver: 0.3, alfa: 0.36 };
    const luz = (c, e) => ({ color: c, esp: 0.2, emision: e, envolver: 0.5 });
    const T = (c) => ({ color: XR, tipo: 'rayosx' });          // todas las piezas de chapa pasan a este material en rayos X

    // chapa: se dibuja una vez solida y otra en rayos X; cada copia con su opacidad
    const chapa = (modo) => {
      const P = modo === 'x' ? T() : pint, f = [];
      f.push(nodo({ malla: MA.caja(4.5, 0.62, 1.8, 0.2, 5), pos: [0, 0.66, 0], mat: P }));                                         // carroceria baja
      f.push(nodo({ malla: MA.caja(3.0, 0.12, 1.76, 0.05, 3), pos: [-0.5, 1.76, 0], mat: P }));                                   // techo
      for (const s of [1, -1]) {
        f.push(nodo({ malla: MA.caja(0.09, 0.98, 0.09, 0.02, 3), pos: [1.27, 1.4, 0.82 * s], rot: [0, 0, 0.855], mat: P }));    // montante A
        f.push(nodo({ malla: MA.caja(0.1, 0.84, 0.09, 0.02, 3), pos: [-0.3, 1.34, 0.84 * s], mat: P }));                          // montante B
        f.push(nodo({ malla: MA.caja(0.13, 0.84, 0.1, 0.02, 3), pos: [-1.97, 1.34, 0.82 * s], mat: P }));                         // montante C
        f.push(nodo({ malla: MA.caja(3.2, 0.06, 0.06, 0.02, 3), pos: [-0.38, 1.0, 0.9 * s], mat: P }));                           // linea de cintura
      }
      f.push(nodo({ malla: MA.caja(0.06, 0.06, 1.7, 0.02, 3), pos: [1.01, 1.76, 0], mat: P }));                                   // travesano del parabrisas
      f.push(nodo({ malla: MA.caja(0.12, 0.2, 1.74, 0.06, 4), pos: [2.2, 0.55, 0], mat: modo === 'x' ? T() : m('#2b303a') }));    // paragolpes delantero
      f.push(nodo({ malla: MA.caja(0.12, 0.2, 1.74, 0.06, 4), pos: [-2.2, 0.55, 0], mat: modo === 'x' ? T() : m('#2b303a') }));   // trasero
      return f;
    };
    const ruedas = [];
    for (const x of [1.45, -1.4]) for (const z of [0.8, -0.8]) ruedas.push(nodo({ pos: [x, 0.36, z], hijos: [
      nodo({ malla: MA.cilindro(0.36, 0.36, 0.26, 20, true), rot: [PI / 2, 0, 0], mat: xr > 0.5 ? T() : goma }),
      nodo({ malla: MA.cilindro(0.21, 0.21, 0.27, 16, true), rot: [PI / 2, 0, 0], mat: xr > 0.5 ? T() : m('#b7bcc4', { tipo: 'brillo', esp: 0.8 }) })] }));

    // cristales (se ocultan en rayos X): laterales fijos + parabrisas + luneta; ventanilla delantera bajable en el lado +Z
    const panos = [];
    for (const s of [1, -1]) {
      panos.push(nodo({ malla: MA.caja(1.5, 0.62, 0.03, 0.01, 3), pos: [-1.13, 1.4, 0.88 * s], mat: cristal }));
      const bajada = s > 0 ? vent : 0;
      panos.push(nodo({ malla: MA.caja(1.25, 0.62, 0.03, 0.01, 3), pos: [0.37, 1.4 - 0.5 * bajada, 0.88 * s], mat: cristal }));
    }
    panos.push(nodo({ malla: MA.caja(0.04, 0.93, 1.64, 0.01, 3), pos: [1.27, 1.4, 0], rot: [0, 0, 0.855], mat: cristal, nombre: 'parabrisas' }));
    panos.push(nodo({ malla: MA.caja(0.04, 0.75, 1.64, 0.01, 3), pos: [-2.0, 1.34, 0], mat: cristal }));

    // en rayos X solo queda la ventanilla delantera del lado de la camara, como placa cian (se ve bajar y romperse)
    const panoX = nodo({ alfa: xr, hijos: [nodo({ malla: MA.caja(1.25, 0.62, 0.03, 0.01, 3), pos: [0.37, 1.4 - 0.5 * vent, 0.88], mat: { color: '#9ff3ff', tipo: 'plano', alfa: 0.3 }, sinRayos: false })] });

    // detalles que no cambian: tiradores, junturas de puerta, faros, pilotos
    const det = [];
    for (const s of [1, -1]) {
      det.push(nodo({ malla: MA.caja(0.03, 0.55, 0.02, 0.005, 2), pos: [0.0, 0.72, 0.905 * s], mat: m('#9aa5b6'), sinRayos: true }));
      det.push(nodo({ malla: MA.caja(0.03, 0.55, 0.02, 0.005, 2), pos: [-1.2, 0.72, 0.905 * s], mat: m('#9aa5b6'), sinRayos: true }));
      det.push(nodo({ malla: MA.caja(0.16, 0.04, 0.03, 0.01, 2), pos: [0.28, 0.9, 0.915 * s], mat: m('#697386'), sinRayos: true, nombre: s > 0 ? 'tirador' : 'tirador_l' }));
      det.push(nodo({ malla: MA.caja(0.05, 0.14, 0.3, 0.02, 3), pos: [2.26, 0.72, 0.58 * s], mat: luz('#fff4d0', 1), sinSombra: true }));
      det.push(nodo({ malla: MA.caja(0.05, 0.14, 0.26, 0.02, 3), pos: [-2.26, 0.78, 0.6 * s], mat: luz('#ff2a1a', 0.5), sinSombra: true }));
    }

    // interior: asientos, volante, salpicadero
    const inte = [
      nodo({ malla: MA.caja(0.55, 0.14, 0.5, 0.05, 3), pos: [0.3, 0.55, 0.42], mat: oscuro }), nodo({ malla: MA.caja(0.12, 0.62, 0.5, 0.05, 3), pos: [-0.02, 0.9, 0.42], rot: [0, 0, 0.1], mat: oscuro }),
      nodo({ malla: MA.caja(0.55, 0.14, 0.5, 0.05, 3), pos: [0.3, 0.55, -0.42], mat: oscuro }), nodo({ malla: MA.caja(0.12, 0.62, 0.5, 0.05, 3), pos: [-0.02, 0.9, -0.42], rot: [0, 0, 0.1], mat: oscuro }),
      nodo({ malla: MA.caja(0.55, 0.14, 1.4, 0.05, 3), pos: [-0.95, 0.55, 0], mat: oscuro }), nodo({ malla: MA.caja(0.12, 0.62, 1.4, 0.05, 3), pos: [-1.27, 0.9, 0], rot: [0, 0, 0.1], mat: oscuro }),
      nodo({ malla: MA.caja(0.5, 0.26, 1.6, 0.08, 3), pos: [1.28, 0.98, 0], mat: oscuro }),
      nodo({ malla: MA.toro(0.17, 0.018, 20, 8), pos: [0.92, 1.08, 0.42], rot: [0, 0, 1.1], mat: m('#0e1015') })];

    // cinturon del conductor: banda que va del hombro (detras) a la cadera (delante), por fuera del torso
    const banda = nodo({ malla: MA.caja(0.045, 0.5, 0.012, 0.004, 2), pos: [0.27, 1.09, 0.6], rot: [0, 0, 0.67], alfa: cin, mat: { color: '#f2a950', tipo: 'plano' }, sinSombra: true, sinRayos: true, oculto: cin < 0.02 });

    const hijos = [];
    if (xr < 0.999) hijos.push(nodo({ alfa: 1 - xr, hijos: chapa('s') }), nodo({ alfa: 1 - xr, hijos: panos }));
    if (xr > 0.001) hijos.push(nodo({ alfa: xr, hijos: chapa('x') }), panoX);
    hijos.push(...ruedas, ...det, ...inte, banda, ...(o.ocupantes || []));
    return nodo({ nombre: 'monovolumen', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };
})();
