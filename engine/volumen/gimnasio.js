/* VOLUMEN — GIMNASIO DE ARTES MARCIALES (3D) y COREOGRAFIA (danza marcial estructurada con golpes).
     V.modelos.gimnasio({tatami:[ancho, fondo]})        tatami blanco, suelo azul, gradas vacias (detras y a los lados), paredes blancas
     V.modelos.luchador({pose, color, pelo, cinturon})  maniqui sin camiseta, con pantalon y cinturon (sin rasgos de cara)
     V.danza.figura(T, o)  ->  {x, rotY, pose, giro}   posicion, orientacion y pose del luchador en el tiempo global T (s)
   Convenio: +X adelante, +Y arriba, metros; la camara mira hacia -Z. Todo se hornea una vez (mallas fusionadas, texturas con V.textura). */
(function (VE) {
  const V = VE.vol, MA = V.malla || VE.vol.malla, MO = V.modelos, PI = Math.PI;
  const mallas = () => V.malla || MA;
  const ss = (k) => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };

  // ---------------------------------------------------------------- texturas
  const texTatami = () => V.textura('gim|tatami', 1400, 900, (x, W, H) => {
    const r = VE.rng('tatami'); x.fillStyle = '#f6f6f2'; x.fillRect(0, 0, W, H);
    const nx = 7, ny = 4.5;                                                                          // paneles de ~0,8 m
    for (let j = 0; j < Math.ceil(ny); j++) for (let i = 0; i < nx; i++) {
      x.fillStyle = `rgba(${r() < 0.5 ? '40,40,30' : '255,255,255'},${0.02 + r() * 0.04})`; x.fillRect(i * W / nx, j * H / ny, W / nx, H / ny);
      x.strokeStyle = 'rgba(80,80,70,0.35)'; x.lineWidth = 3; x.strokeRect(i * W / nx + 1.5, j * H / ny + 1.5, W / nx - 3, H / ny - 3); }
    for (let i = 0; i < 7000; i++) { x.fillStyle = `rgba(90,85,70,${0.03 + r() * 0.05})`; x.fillRect(r() * W, r() * H, 1 + r() * 8, 1); }   // trama de la paja
    x.lineWidth = 26; x.strokeStyle = '#d93a2f'; x.strokeRect(70, 70, W - 140, H - 140);                // zona de combate (rojo)
    x.lineWidth = 8; x.strokeStyle = '#1f4fb4'; x.beginPath(); x.arc(W / 2, H / 2, H * 0.28, 0, 7); x.stroke();
  });
  const texSuelo = () => V.textura('gim|suelo', 512, 512, (x, W, H) => {
    const r = VE.rng('suelo'); x.fillStyle = '#2358c4'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; x.fillRect(i * W / 8, 0, W / 8 - 2, H); x.fillStyle = 'rgba(0,10,50,0.28)'; x.fillRect(i * W / 8 - 1, 0, 2, H); }
    for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`; x.fillRect(r() * W, r() * H, 1 + r() * 3, 14 + r() * 40); }
  });

  // ---------------------------------------------------------------- gradas (filas escalonadas con asientos fusionados en una sola malla)
  function gradas(filas, largo, clave) {
    const M = mallas(), partes = [], hijos = [], fondoFila = 0.95, alto = 0.42;
    for (let i = 0; i < filas; i++) {
      const h = alto * (i + 1), z = -i * fondoFila;
      hijos.push(V.nodo({ malla: M.caja(largo, h, fondoFila, 0.012), pos: [0, h / 2, z], mat: { color: '#d7dde8', esp: 0.05, dureza: 12, envolver: 0.3, borde: 0.1 } }));
      const n = Math.floor(largo / 0.46);
      for (let j = 0; j < n; j++) {
        const px = (j - (n - 1) / 2) * 0.46;
        partes.push({ malla: M.caja(0.38, 0.07, 0.36, 0.015), m: V.m4.tras(px, h + 0.12, z + 0.1) });           // asiento
        partes.push({ malla: M.caja(0.38, 0.30, 0.05, 0.015), m: V.m4.tras(px, h + 0.30, z - 0.12) });         // respaldo
      }
    }
    hijos.push(V.nodo({ malla: M.fusionar(partes, 'gim|asientos|' + clave + '|' + filas + '|' + largo), mat: { color: '#1b4fb8', esp: 0.25, dureza: 24, envolver: 0.25, borde: 0.2 } }));
    hijos.push(V.nodo({ malla: M.caja(largo, 0.07, 0.07, 0.01), pos: [0, alto * filas + 0.95, -(filas - 1) * fondoFila - 0.4], mat: { color: '#9fb0c8', esp: 0.4 } }));   // barandilla
    return hijos;
  }

  MO.gimnasio = function (o = {}) {
    const M = mallas(), tw = (o.tatami || [5.8, 3.8])[0], td = (o.tatami || [5.8, 3.8])[1], h = [];
    h.push(V.nodo({ nombre: 'suelo', malla: M.plano(60, 60, 1), mat: { color: '#ffffff', mapa: texSuelo(), repetir: [14, 14], esp: 0.12, dureza: 30, envolver: 0.15, borde: 0 } }));
    h.push(V.nodo({ nombre: 'tatami_base', malla: M.caja(tw + 0.5, 0.09, td + 0.5, 0.025), pos: [0, 0.045, 0], mat: { color: '#f0f0ec', esp: 0.1, dureza: 16, envolver: 0.3, borde: 0.1 } }));
    h.push(V.nodo({ nombre: 'tatami', malla: M.plano(tw, td, 1), pos: [0, 0.093, 0], mat: { color: '#ffffff', mapa: texTatami(), esp: 0.08, dureza: 14, envolver: 0.25, borde: 0 } }));
    // gradas vacias: detras (z negativo) y a los lados
    h.push(V.nodo({ nombre: 'gradas_fondo', pos: [0, 0, -4.6], hijos: gradas(8, 20, 'f') }));
    h.push(V.nodo({ nombre: 'gradas_izq', pos: [-5.4, 0, -1.5], rot: [0, PI / 2, 0], hijos: gradas(8, 14, 'l') }));
    h.push(V.nodo({ nombre: 'gradas_der', pos: [5.4, 0, -1.5], rot: [0, -PI / 2, 0], hijos: gradas(8, 14, 'l') }));
    // paredes blancas con zocalo azul y ventanal
    const pared = (nombre, w, pos, rot) => V.nodo({ nombre, pos, rot, hijos: [
      V.nodo({ malla: M.caja(w, 14, 0.4, 0.01), pos: [0, 7, 0], mat: { color: '#f5f7fb', esp: 0.03, envolver: 0.45, borde: 0 } }),
      V.nodo({ malla: M.caja(w, 0.55, 0.12, 0.01), pos: [0, 5.2, 0.24], mat: { color: '#1f4fb4', esp: 0.2 } }),
      V.nodo({ malla: M.caja(w - 1, 1.5, 0.1, 0.01), pos: [0, 9.2, 0.24], mat: { color: '#b9cbe6', esp: 0.5, dureza: 40, emision: 0.18 } })] });
    h.push(pared('pared_fondo', 34, [0, 0, -14.4], [0, 0, 0]));
    h.push(pared('pared_izq', 34, [-13.2, 0, -2], [0, PI / 2, 0]));
    h.push(pared('pared_der', 34, [13.2, 0, -2], [0, -PI / 2, 0]));
    return V.nodo({ nombre: 'gimnasio', pos: o.pos, hijos: h });
  };

  // ---------------------------------------------------------------- luchador (maniqui sin camiseta, con pantalon)
  MO.luchador = function (o = {}) {
    const M = mallas(), piel = o.piel || '#d9a070', pant = o.pantalon || '#16213f';
    const colores = { pecho: piel, vientre: piel, cuello: piel, cabeza: piel, cintura: pant, brazo: piel, antebrazo: piel, mano: piel, pie: piel, pelvis: pant, muslo: pant, pierna: pant };
    /* PELO (coordenadas locales de la cabeza: esfera unidad escalada; +X = delante, +Y = arriba). Casquete echado hacia atras/arriba para dejar la cara libre,
       nuca, patillas y un flequillo largo que cae hacia un lado de la frente. */
    const pc = o.pelo || '#0c0c0f', mp = { color: pc, esp: 0.55, dureza: 50, envolver: 0.35, borde: 0.1 };
    const P = (nombre, e, pos, rot) => V.nodo({ nombre, malla: M.esfera(20), esc: e, pos, rot: rot || [0, 0, 0], mat: mp });
    const hair = V.nodo({ nombre: 'pelo', hijos: [
      P('pelo_casco', [1.07, 1.02, 1.08], [-0.17, 0.21, 0]),
      P('pelo_nuca', [0.72, 0.78, 0.96], [-0.52, -0.12, 0]),
      P('pelo_vol', [0.9, 0.5, 0.95], [-0.18, 0.62, 0]),
      P('flequillo1', [0.34, 0.16, 0.52], [0.8, 0.6, 0.2], [0.5, 0, -0.55])] });
    const cinto = V.nodo({ nombre: 'cinturon', malla: M.cilindro(0.115, 0.115, 0.06, 28), esc: [1.05, 1, 1.45], pos: [0, 0.05, 0], mat: { color: '#0d0d0f', esp: 0.4, dureza: 30 } });
    const mus = { color: piel, esp: 0.14, dureza: 28, envolver: 0.3 }, E = (e, pos, rot) => V.nodo({ malla: M.esfera(20), esc: e, pos, rot: rot || [0, 0, 0], mat: mus });
    const torso = [cinto];
    for (const z of [-1, 1]) {
      torso.push(E([0.07, 0.062, 0.082], [0.085, 0.4, z * 0.075], [0, 0, -0.12]));                  // pectoral
      torso.push(E([0.05, 0.1, 0.06], [-0.01, 0.28, z * 0.13], [0, 0, 0]));                         // dorsal ancho (flanco)
      for (let j = 0; j < 3; j++) torso.push(E([0.028, 0.026, 0.032], [0.094, 0.08 + j * 0.05, z * 0.032]));   // abdominales
    }
    const hom = [E([0.052, 0.054, 0.054], [0, -0.02, 0]), E([0.03, 0.075, 0.04], [0.016, -0.12, 0])];        // deltoides + biceps
    const codo = [E([0.032, 0.085, 0.036], [0.0, -0.09, 0])];                                          // antebrazo
    return MO.maniqui(Object.assign({}, o, { colores, equipo: { cabeza: [hair], tronco: torso, hombro_d: hom, hombro_i: hom, codo_d: codo, codo_i: codo } }));
  };

  // ---------------------------------------------------------------- coreografia
  const Pbase = V.poses.de_pie, P = (d) => Object.assign({}, Pbase, d);
  const K = V.danza = {};
  K.poses = {
    listo:   P({ tronco: 4, cadera_d: 16, rodilla_d: 26, cadera_i: -8, rodilla_i: 16, hombro_d: 38, codo_d: 100, hombro_i: 60, codo_i: 108, abrir: 14 }),
    guardia: P({ tronco: 8, cadera_d: 32, rodilla_d: 46, cadera_i: -14, rodilla_i: 26, hombro_d: 52, codo_d: 112, hombro_i: 70, codo_i: 118, abrir: 12 }),
    jab:     P({ tronco: 14, cadera_d: 36, rodilla_d: 50, cadera_i: -16, rodilla_i: 28, hombro_d: 56, codo_d: 112, hombro_i: 92, codo_i: 6, abrir: 8 }),
    cross:   P({ tronco: 20, cadera_d: 38, rodilla_d: 54, cadera_i: -24, rodilla_i: 38, hombro_d: 96, codo_d: 6, hombro_i: 52, codo_i: 120, abrir: 8 }),
    bloqueo: P({ tronco: 10, cadera_d: 30, rodilla_d: 44, cadera_i: -12, rodilla_i: 24, hombro_d: 82, codo_d: 70, hombro_i: 24, codo_i: 130, abrir: 14 }),
    patada_p:P({ tronco: -2, cadera_i: 72, rodilla_i: 98, cadera_d: -4, rodilla_d: 16, hombro_d: 56, codo_d: 108, hombro_i: 44, codo_i: 112, abrir: 14 }),
    patada:  P({ tronco: -10, cadera_i: 90, rodilla_i: 8, cadera_d: -6, rodilla_d: 14, hombro_d: 66, codo_d: 104, hombro_i: 36, codo_i: 110, abrir: 16 }),
    patada_l:P({ tronco: -30, cuello: 6, cadera_i: 104, rodilla_i: 6, cadera_d: -8, rodilla_d: 24, hombro_d: 112, codo_d: 20, hombro_i: 70, codo_i: 30, abrir: 28 }),
    caballo: P({ tronco: -2, cadera_d: 74, rodilla_d: 104, cadera_i: 74, rodilla_i: 104, hombro_d: 88, codo_d: 40, hombro_i: 88, codo_i: 40, abrir: 24 }),
    giro:    P({ tronco: 6, cadera_d: 44, rodilla_d: 64, cadera_i: 8, rodilla_i: 22, hombro_d: 72, codo_d: 120, hombro_i: 72, codo_i: 120, abrir: 10 }),
    dragon:  P({ tronco: -8, cuello: -6, cadera_d: 10, rodilla_d: 20, cadera_i: -10, rodilla_i: 18, hombro_d: 122, codo_d: 18, hombro_i: 122, codo_i: 18, abrir: 58 })
  };
  const FUERTES = { jab: 1, cross: 1, patada: 1, patada_l: 1 };                                      // se alcanzan de golpe (salida rapida)
  /* secuencia = [[t, pose], ...] ; interpola de una pose a la siguiente; los golpes entran rapido y salen suaves */
  function seq(keys, t) {
    if (t <= keys[0][0]) return K.poses[keys[0][1]];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t <= b[0]) { const k = (t - a[0]) / (b[0] - a[0]), e = FUERTES[b[1]] ? 1 - Math.pow(1 - k, 3) : ss(k); return V.pose.mezclar(K.poses[a[1]], K.poses[b[1]], e); }
    }
    return K.poses[keys[keys.length - 1][1]];
  }
  const COMBOS = [
    { dur: 2.8, giro: null, k: [[0, 'guardia'], [0.2, 'jab'], [0.4, 'guardia'], [0.6, 'jab'], [0.8, 'cross'], [1.1, 'guardia'], [1.4, 'patada_p'], [1.7, 'patada'], [2.0, 'patada_p'], [2.4, 'guardia'], [2.8, 'guardia']] },
    { dur: 2.8, giro: [0.45, 1.25], k: [[0, 'guardia'], [0.35, 'caballo'], [0.75, 'giro'], [1.3, 'giro'], [1.6, 'guardia'], [1.95, 'patada_l'], [2.4, 'guardia'], [2.8, 'caballo']] },
    { dur: 2.8, giro: null, k: [[0, 'guardia'], [0.5, 'bloqueo'], [0.85, 'cross'], [1.3, 'bloqueo'], [1.75, 'dragon'], [2.5, 'dragon'], [2.8, 'guardia']] }
  ];
  const XL = -1.1, XR = 1.1, T0 = 4.0, LEG = 5.0, VIAJE = 2.2, FIN = 70.0;
  /* Devuelve la posicion X, la orientacion (rotY) y la pose del luchador en el tiempo global T. */
  K.figura = function (T, o = {}) {
    const yaw = o.yaw == null ? 0.5 : o.yaw;
    if (T < T0) return { x: 0, rotY: -yaw * 0.6 * (1 - ss(T / T0)) - 0.25 + 0.5 * Math.sin(T * 0.8) * 0.15, pose: seq([[0, 'listo'], [1.2, 'guardia'], [2.4, 'listo'], [3.2, 'jab'], [3.6, 'guardia'], [4.0, 'guardia']], T) };
    if (T >= FIN) { const u = T - FIN, k = ss(u / 2.2); return { x: XR * (1 - k) * (((Math.floor((FIN - T0) / LEG)) % 2) ? 1 : -1) * 1, rotY: -yaw * 0.4, pose: seq([[0, 'guardia'], [2.4, 'guardia'], [3.4, 'dragon'], [30, 'dragon']], u) }; }
    const L = Math.floor((T - T0) / LEG), u = T - T0 - L * LEG, dir = L % 2 === 0 ? -1 : 1, from = L === 0 ? 0 : -dir * Math.abs(XL), to = dir * Math.abs(XL);
    const base = dir > 0 ? -yaw : PI + yaw;
    if (u < VIAJE) {                                                                                  // desplazamiento con pasos de baile
      const k = ss(u / VIAJE), ph = u / 0.55, w = V.pose.andar(ph, 0.9);
      return { x: from + (to - from) * k, rotY: base, pose: V.pose.mezclar(K.poses.guardia, Object.assign({}, w, { tronco: 8, hombro_d: 52, hombro_i: 70, codo_d: 112, codo_i: 118 }), 0.7) };
    }
    const c = COMBOS[L % COMBOS.length], t = (u - VIAJE) / (LEG - VIAJE) * c.dur, giro = c.giro ? ss((t - c.giro[0]) / (c.giro[1] - c.giro[0])) * 2 * PI * (dir > 0 ? -1 : 1) : 0;
    return { x: to, rotY: base + giro, pose: seq(c.k, t) };
  };
})(window.VE = window.VE || {});
