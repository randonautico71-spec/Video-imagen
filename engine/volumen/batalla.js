/* VOLUMEN — BATALLA: caballos, caballeros, lanceros e infantes medievales, armas, puente de madera, tiendas, banderas,
   salpicaduras y EJERCITOS de cientos de soldados (cada soldado se hornea en una sola malla con colores de una paleta).
     V.modelos.caballo({ fase, marcha: 'galope'|'trote'|'paso'|'parado', capa: [c1, c2] | null, color, encabritado 0..1, detalle })
         caballo de ~2,4 m mirando a +X (como el maniqui), cascos en y = 0. Patas por marcha (galope rotatorio, trote diagonal, paso a cuatro tiempos).
     V.modelos.caballero({ fase, marcha, librea: [c1, c2], lanza: 'ristre'|'alzada'|null, bandera, encabritado, detalle })   caballo + jinete con
         cota de malla, gran yelmo, sobreveste, escudo de lagrima (heater) y lanza.
     V.modelos.lancero({ pose, tunica, casco, escudo, lanza: 'ristre'|'alzada'|'estocada', golpe 0..1, pelo, barba, detalle })   lancero escoces
         (tunica larga, piernas desnudas o calzas, lanza larga de ~3,7 m, broquel redondo a la espalda).
     V.modelos.infante({ pose, gambeson, arma: 'lanza'|'espada', detalle })   infante ingles (gambeson acolchado, capacete de ala, escudo)
     V.modelos.puente({ largo, ancho, alto, pilas })   puente de madera sobre caballetes, a lo largo de Z, tablero a y = alto
     V.modelos.tienda({ color, franja })   tienda conica de campamento ·  V.modelos.bandera({ cruz: 'aspa'|'jorge', fase, alto })
     V.batalla.hornear(nodo, clave) -> malla unica (colores en la paleta) · V.batalla.material() · V.batalla.tropa(...) (ver abajo)
     V.efectos.salpicadura(semilla, origen, t0, t)   agua que salta y anillo en la superficie
   Poses: V.poses.jinete, V.pose.lanzaRistre(fase), V.pose.estocada(f), V.pose.caido. Todo depende de t (sin estado). Escala: metros. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, v3 = V.v3, M4 = V.m4;
  const B = V.batalla = {}, EF = V.efectos = V.efectos || {};
  const c01 = (v) => Math.max(0, Math.min(1, v)), suave = (v) => { v = c01(v); return v * v * (3 - 2 * v); }, n = V.nodo;

  // ---------------------------------------------------------------- materiales y texturas
  const metal = (c) => ({ tipo: 'brillo', color: c || '#8d939a', esp: 0.75, dureza: 70, envolver: 0.15, borde: 0.6 });
  const tela = (c) => ({ color: c, esp: 0.06, dureza: 12, envolver: 0.35, borde: 0.5 });
  const cuero = (c) => ({ color: c || '#5a3b22', esp: 0.2, dureza: 20, envolver: 0.25, borde: 0.4 });
  const madera = (c) => ({ color: c || '#6b4a2b', esp: 0.08, dureza: 14, envolver: 0.25, borde: 0.3 });
  B.metal = metal; B.tela = tela; B.cuero = cuero; B.madera = madera;
  /* Cota de malla: anillas pintadas (textura que se repite). */
  function texMalla() { return V.textura('cota_malla', 64, 64, (x, W, H, c) => { c.repetirV = true; x.fillStyle = '#5c6268'; x.fillRect(0, 0, W, H);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.strokeStyle = (i + j) % 2 ? '#9aa1a8' : '#868d94'; x.lineWidth = 2; x.beginPath(); x.arc(i * 8 + 4 + (j % 2) * 4, j * 8 + 4, 3.2, 0, 2 * PI); x.stroke(); } }); }
  const cota = () => ({ tipo: 'brillo', color: '#ffffff', mapa: texMalla(), repetir: [6, 4], esp: 0.55, dureza: 40, envolver: 0.2, borde: 0.5, colorHorneado: '#868c92' });
  /* Escudos y sobrevestes con blasones INVENTADOS (no son armas reales de nadie): dos colores partidos o con una banda. */
  function texBlason(c1, c2, tipo) { return V.textura('blason|' + c1 + '|' + c2 + '|' + tipo, 128, 160, (x, W, H) => {
    x.fillStyle = c1; x.fillRect(0, 0, W, H); x.fillStyle = c2;
    if (tipo === 'banda') { x.beginPath(); x.moveTo(0, H * 0.75); x.lineTo(W, H * 0.15); x.lineTo(W, H * 0.4); x.lineTo(0, H); x.fill(); }
    else if (tipo === 'cheurón') { x.beginPath(); x.moveTo(0, H * 0.35); x.lineTo(W / 2, H * 0.75); x.lineTo(W, H * 0.35); x.lineTo(W, H * 0.55); x.lineTo(W / 2, H * 0.95); x.lineTo(0, H * 0.55); x.fill(); }
    else x.fillRect(W / 2, 0, W / 2, H); }); }
  function texCruz(tipo) { return V.textura('bandera|' + tipo, 192, 128, (x, W, H) => {
    if (tipo === 'aspa') { x.fillStyle = '#1d4f9a'; x.fillRect(0, 0, W, H); x.strokeStyle = '#f4f4f0'; x.lineWidth = H * 0.2; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, H); x.moveTo(W, 0); x.lineTo(0, H); x.stroke(); }
    else { x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, W, H); x.fillStyle = '#c0141e'; x.fillRect(W * 0.42, 0, W * 0.16, H); x.fillRect(0, H * 0.38, W, H * 0.24); } }); }
  function texTablas() { return V.textura('tablas', 256, 256, (x, W, H, c) => { c.repetirV = true; const r = VE.rng('tablas');
    for (let i = 0; i < 8; i++) { const t = 0.75 + r() * 0.35; x.fillStyle = `rgb(${110 * t | 0},${78 * t | 0},${48 * t | 0})`; x.fillRect(0, i * H / 8, W, H / 8 - 2); x.fillStyle = 'rgba(30,18,8,0.8)'; x.fillRect(0, i * H / 8 + H / 8 - 2, W, 2);
      x.globalAlpha = 0.15; for (let k = 0; k < 14; k++) { x.fillStyle = r() < 0.5 ? '#2a1a0c' : '#c8a070'; x.fillRect(r() * W, i * H / 8 + r() * H / 8, 20 + r() * 60, 1); } x.globalAlpha = 1; } }); }

  // ---------------------------------------------------------------- caballo
  /* Marchas: desfase de cada pata (pi/pd = posteriores, mi/md = manos), amplitud del paso (rad) y cuanto se dobla la pata al avanzar. */
  const MARCHAS = {
    galope: { off: { pi: 0, pd: 0.1, mi: 0.5, md: 0.6 }, A: 0.62, plegar: 1.25, bote: 0.08, cabeceo: 0.06 },
    trote: { off: { pi: 0, md: 0, pd: 0.5, mi: 0.5 }, A: 0.38, plegar: 0.95, bote: 0.045, cabeceo: 0.02 },
    paso: { off: { pi: 0, mi: 0.25, pd: 0.5, md: 0.75 }, A: 0.26, plegar: 0.6, bote: 0.015, cabeceo: 0.015 },
    parado: { off: { pi: 0, mi: 0, pd: 0, md: 0 }, A: 0, plegar: 0, bote: 0, cabeceo: 0 }
  };
  B.MARCHAS = MARCHAS;
  /* Longitud de una zancada completa por marcha (m): fase = distancia / zancada (o integrada si cambia la velocidad). */
  B.zancadaCaballo = { galope: 5.2, trote: 2.9, paso: 1.7, parado: 1 };
  function texCapa(c1, c2) { return V.textura('capa|' + c1 + '|' + c2, 256, 64, (x, W, H) => { const k = 8; for (let i = 0; i < k; i++) { x.fillStyle = i % 2 ? c2 : c1; x.fillRect(i * W / k, 0, W / k + 1, H); }
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, H - 6, W, 6); }); }
  MO.caballo = function (o = {}) {
    const f = o.fase || 0, Mh = MARCHAS[o.marcha || 'parado'], D = o.detalle || 1, S = (k) => Math.max(5, Math.round(k * D)), pelo = tela(o.color || '#5a3a22'), oscuro = tela(o.crin || '#1e140c');
    const ang = (k) => 2 * PI * (f + Mh.off[k]), hijos = [];
    const bote = Mh.bote * Math.sin(4 * PI * f), cab = Mh.cabeceo * Math.sin(2 * PI * f + 0.6);
    // cuerpo
    hijos.push(n({ malla: MA.esfera(S(28)), pos: [0, 1.32, 0], esc: [0.95, 0.4, 0.34], mat: pelo }), n({ malla: MA.esfera(S(24)), pos: [0.6, 1.33, 0], esc: [0.4, 0.43, 0.32], mat: pelo }),
      n({ malla: MA.esfera(S(24)), pos: [-0.66, 1.38, 0], esc: [0.44, 0.43, 0.35], mat: pelo }));
    // cuello, cabeza, orejas, ojos, crin
    const cuelloRot = 140 * PI / 180 - (o.marcha === 'galope' ? 0.15 * Math.sin(2 * PI * f) : 0) - (o.cabezaAlta || 0);
    const cuello = n({ pos: [0.78, 1.5, 0], rot: [0, 0, cuelloRot], hijos: [
      n({ malla: MA.capsula(0.2, 0.13, 0.9, S(20)), mat: pelo }),
      n({ malla: MA.esfera(S(14)), pos: [-0.12, -0.45, 0], esc: [0.07, 0.5, 0.035], mat: oscuro }),
      n({ pos: [0, -0.88, 0], rot: [0, 0, -cuelloRot + 0.64], hijos: [
        n({ malla: MA.capsula(0.13, 0.085, 0.6, S(18)), mat: pelo }),
        n({ malla: MA.esfera(S(10)), pos: [0.05, -0.22, 0.085], esc: 0.028, mat: { color: '#0a0806', esp: 0.8, dureza: 80 } }),
        n({ malla: MA.esfera(S(10)), pos: [0.05, -0.22, -0.085], esc: 0.028, mat: { color: '#0a0806', esp: 0.8, dureza: 80 } }),
        n({ malla: MA.cilindro(0.035, 0, 0.15, S(8)), pos: [-0.1, 0.06, 0.06], rot: [0, 0, 0.5], mat: pelo }),
        n({ malla: MA.cilindro(0.035, 0, 0.15, S(8)), pos: [-0.1, 0.06, -0.06], rot: [0, 0, 0.5], mat: pelo }),
        n({ malla: MA.toro(0.1, 0.012, S(16), 6), pos: [0, -0.42, 0], rot: [0, 0, PI / 2 - 0.3], mat: cuero('#2a1a0e') })] })] });
    hijos.push(cuello);
    // cola (8 posiciones horneadas por fase)
    const kc = Math.round(((f % 1) + 1) % 1 * 8) % 8, sw = Math.sin(kc / 8 * 2 * PI) * (o.marcha === 'parado' ? 0.03 : 0.12);
    hijos.push(n({ malla: MA.tubo([[-1.05, 1.5, 0], [-1.22, 1.38, sw * 0.4], [-1.3, 1.12, sw], [-1.28, 0.82, sw * 1.4]], (t) => 0.075 - 0.035 * t, S(8), { clave: 'cola|' + kc + '|' + S(8) + '|' + (o.marcha || 'parado') }), mat: oscuro }));
    // patas
    const pata = (k, x, z, delantera) => {
      const a = ang(k), giro = Mh.A * Math.sin(a), pl = Mh.plegar * Math.max(0, Math.sin(a + 1.3)) ** 1.5, enc = o.encabritado || 0;
      const g1 = giro + (delantera ? enc * 1.1 : -enc * 0.25), g2 = -(delantera ? pl + enc * 1.4 : pl * 0.7 - 0.15);
      return n({ pos: [x, delantera ? 1.12 : 1.2, z], rot: [0, 0, g1], hijos: [
        n({ malla: MA.capsula(delantera ? 0.085 : 0.11, 0.058, 0.48, S(16)), mat: pelo }),
        n({ pos: [0, -0.48, 0], rot: [0, 0, g2], hijos: [
          n({ malla: MA.capsula(0.052, 0.046, 0.44, S(14)), mat: pelo }),
          n({ malla: MA.cilindro(0.062, 0.078, 0.1, S(12)), pos: [0.01, -0.47, 0], mat: { color: '#1a1410', esp: 0.4, dureza: 30 } })] })] });
    };
    hijos.push(pata('md', 0.6, 0.17, true), pata('mi', 0.6, -0.17, true), pata('pd', -0.68, 0.18, false), pata('pi', -0.68, -0.18, false));
    // silla, gualdrapa y riendas
    hijos.push(n({ malla: MA.caja(0.55, 0.12, 0.62, 0.04, 2), pos: [0.05, 1.72, 0], mat: cuero() }));
    if (o.capa) { const [c1, c2] = o.capa; hijos.push(n({ malla: capaMalla(S(12)), mat: { color: '#ffffff', mapa: texCapa(c1, c2), dobleCara: true, esp: 0.05, dureza: 10, envolver: 0.35, borde: 0.4, colorHorneado: c1 } })); }
    // encabritado: gira sobre las patas traseras
    const piv = [-0.7, 0, 0], e = o.encabritado || 0, inclin = cab + e * 0.75;
    const cuerpo = n({ pos: [piv[0], bote + piv[1], 0], rot: [0, 0, inclin], hijos: [n({ pos: [-piv[0], 0, 0], hijos })] });
    return n({ nombre: 'caballo', pos: o.pos, rot: o.rot, esc: o.esc, m: o.m, hijos: [cuerpo] });
  };
  /* Gualdrapa: concha sobre el lomo que cae por los costados hasta media pata. */
  function capaMalla(seg) { return MA.parametrica(seg * 2, seg, (u, v) => { const x = -1.0 + 2.05 * u, s = (v - 0.5) * 2, fi = Math.max(-1, Math.min(1, s * 1.3)) * PI / 2, extra = Math.max(0, Math.abs(s) * 1.3 - 1) / 0.3;
    const r = 0.4 + 0.05 * Math.sin(PI * u), y = 1.36 + r * Math.cos(fi) - extra * 0.42, z = r * Math.sin(fi) + Math.sign(s) * extra * 0.03; return [x * 0.92, y + 0.035 * Math.sin(u * 22) * extra, z]; },
    { clave: 'capa|' + seg, abierta: true }); }

  // ---------------------------------------------------------------- poses
  Object.assign(V.poses, {
    jinete: { tronco: 4, cuello: -4, cadera_d: 42, cadera_i: 42, rodilla_d: 78, rodilla_i: 78, tobillo_d: 12, tobillo_i: 12, hombro_d: 30, hombro_i: 38, codo_d: 85, codo_i: 75, abrir: 16, abrir_piernas: 32 },
    caido: { tronco: 0, cuello: 10, cadera_d: 10, cadera_i: 30, rodilla_d: 20, rodilla_i: 50, tobillo_d: 0, tobillo_i: 0, hombro_d: 120, hombro_i: 40, codo_d: 30, codo_i: 60, abrir: 30 },
    lanzaAlzada: { tronco: 2, cuello: 0, cadera_d: 4, cadera_i: -4, rodilla_d: 6, rodilla_i: 4, tobillo_d: 0, tobillo_i: 0, hombro_d: 28, hombro_i: 6, codo_d: 80, codo_i: 14, abrir: 8 }
  });
  Object.assign(V.pose, {
    /* Carrera con la lanza en ristre (los brazos sujetan la lanza delante; las piernas corren). */
    lanzaRistre: (fase, amp = 1) => Object.assign(V.pose.correr(fase, amp), { hombro_d: 52, hombro_i: 68, codo_d: 72, codo_i: 38, abrir: 10, tronco: 18 * amp }),
    /* Estocada con la lanza (f en vueltas): recoge y empuja. */
    /* Estocada con anticipacion (f en vueltas): recoge despacio (0..0,45), empuja de golpe (0,45..0,55), aguanta y recupera. */
    estocada: (f) => { const k = ((f % 1) + 1) % 1, atras = k < 0.45 ? suave(k / 0.45) : (k < 0.55 ? 1 - suave((k - 0.45) / 0.1) : 0), golpe = k < 0.45 ? 0 : (k < 0.55 ? suave((k - 0.45) / 0.1) : 1 - suave((k - 0.62) / 0.38));
      return { tronco: 12 - 8 * atras + 22 * golpe, cuello: -10, cadera_d: 30 + 10 * golpe, cadera_i: -10 - 8 * golpe, rodilla_d: 30 + 8 * atras, rodilla_i: 12, tobillo_d: 0, tobillo_i: 0,
        hombro_d: 40 - 12 * atras + 38 * golpe, hombro_i: 58 - 10 * atras + 30 * golpe, codo_d: 95 + 15 * atras - 60 * golpe, codo_i: 50 + 10 * atras - 36 * golpe, abrir: 8 }; },
    /* Retroceso al recibir un golpe (k 0..1): el cuerpo se echa atras y los brazos suben. */
    retroceso: (k) => V.pose.mezclar('de_pie', { tronco: -22, cuello: 14, cadera_d: -12, cadera_i: 8, rodilla_d: 26, rodilla_i: 10, tobillo_d: 0, tobillo_i: 0, hombro_d: 75, hombro_i: 95, codo_d: 50, codo_i: 30, abrir: 34 }, suave(k)),
  });

  // ---------------------------------------------------------------- armas
  /* Lanza a lo largo de +X desde el origen (largo L): asta, regaton, moharra; opcionalmente arandela (caballero) y banderola. */
  function lanza(L, o = {}) { const S = (k) => Math.max(5, Math.round(k * (o.detalle || 1))), r = o.grosor || 0.02, h = [];
    h.push(n({ malla: MA.cilindro(r, r * 1.15, L, S(8)), pos: [L / 2, 0, 0], rot: [0, 0, -PI / 2], mat: madera(o.madera || '#7a5634') }));
    h.push(n({ malla: MA.cilindro(r * 1.5, 0, 0.28, S(8)), pos: [L + 0.14, 0, 0], rot: [0, 0, -PI / 2], mat: metal('#a8adb3') }));
    h.push(n({ malla: MA.cilindro(r * 1.3, r * 1.3, 0.12, S(8)), pos: [L - 0.03, 0, 0], rot: [0, 0, -PI / 2], mat: metal('#6d7278') }));
    if (o.arandela) h.push(n({ malla: MA.cilindro(0.11, 0.025, 0.2, S(12)), pos: [1.05, 0, 0], rot: [0, 0, -PI / 2], mat: metal('#7d838a') }));
    if (o.banderola) h.push(n({ malla: MA.parametrica(8, 3, (u, v) => [L - 0.5 - u * 0.75, -v * 0.26 * (1 - u * 0.6), 0.04 * Math.sin(u * 7)], { clave: 'banderola', abierta: true }),
      mat: { color: '#ffffff', mapa: texCruz(o.banderola), dobleCara: true, esp: 0.05, envolver: 0.4, colorHorneado: o.banderola === 'aspa' ? '#1d4f9a' : '#e8e4dc' } }));
    return n({ hijos: h, pos: o.pos, rot: o.rot }); }
  B.lanza = lanza;
  function escudoLagrima(c1, c2, tipo, o = {}) { // escudo de lagrima (heater): plano XY, cara hacia +Z
    const poli = [[-0.25, 0.3], [0.25, 0.3], [0.25, 0.05], [0.18, -0.15], [0, -0.32], [-0.18, -0.15], [-0.25, 0.05]];
    return n({ malla: MA.extrusion(poli, 0.035, 'escudo_lagrima'), pos: o.pos, rot: o.rot, mat: { color: '#ffffff', mapa: texBlason(c1, c2, tipo), esp: 0.2, dureza: 24, envolver: 0.3, colorHorneado: c1 } }); }
  function broquel(o = {}) { const S = (k) => Math.max(5, Math.round(k * (o.detalle || 1)));
    return n({ pos: o.pos, rot: o.rot, hijos: [n({ malla: MA.cilindro(0.26, 0.26, 0.03, S(20)), mat: cuero('#6a4524') }), n({ malla: MA.esfera(S(10)), pos: [0, 0.02, 0], esc: [0.07, 0.04, 0.07], mat: metal('#9aa0a6') }),
      n({ malla: MA.toro(0.24, 0.012, S(20), 4), pos: [0, 0.015, 0], mat: metal('#7d838a') })] }); }

  // ---------------------------------------------------------------- ropa (torsos largos por revolucion)
  const TUNICA = [[0, 0.5], [0.12, 0.475], [0.18, 0.4], [0.17, 0.24], [0.15, 0.1], [0.17, -0.02], [0.22, -0.25], [0.26, -0.44], [0, -0.45]];
  const SOBREVESTE = [[0, 0.52], [0.13, 0.49], [0.19, 0.41], [0.175, 0.24], [0.155, 0.08], [0.2, -0.1], [0.27, -0.36], [0, -0.37]];
  const GAMBESON = [[0, 0.52], [0.14, 0.49], [0.2, 0.41], [0.195, 0.24], [0.18, 0.08], [0.2, -0.04], [0.22, -0.18], [0, -0.19]];
  const torso = (perfil, clave, mat, S) => n({ malla: MA.torno(perfil, S(26), clave + '|' + S(26)), esc: [0.74, 1, 1], mat });
  const pelo = (c, S) => n({ malla: MA.esfera(S(16)), pos: [-0.01, 0.205, 0], esc: [0.102, 0.106, 0.098], mat: tela(c) });
  const barba = (c, S) => n({ malla: MA.esfera(S(12)), pos: [0.07, 0.12, 0], esc: [0.06, 0.07, 0.075], mat: tela(c) });

  // ---------------------------------------------------------------- caballero (caballo + jinete)
  MO.caballero = function (o = {}) {
    const D = o.detalle || 1, S = (k) => Math.max(5, Math.round(k * D)), lib = o.librea || ['#c0141e', '#f0e8d8'], blason = o.blason || 'partido';
    const piel = '#c99a74', malla = cota(), sobreveste = { color: '#ffffff', mapa: texBlason(lib[0], lib[1], blason), esp: 0.06, dureza: 12, envolver: 0.35, borde: 0.5, colorHorneado: lib[0] };
    const equipo = {
      tronco: [torso(SOBREVESTE, 'sobreveste', sobreveste, S), escudoLagrima(lib[0], lib[1], blason, { pos: [0.08, 0.26, -0.27], rot: [0, 0, 0.1] }),
        n({ malla: MA.toro(0.16, 0.022, S(18), 6), pos: [0, 0.02, 0], esc: [0.75, 1, 1], mat: cuero('#3a2412') })],
      cuello: [n({ pos: [0.015, 0.19, 0], hijos: [ // gran yelmo
        n({ malla: MA.cilindro(0.118, 0.124, 0.28, S(20)), mat: metal('#9aa0a6') }), n({ malla: MA.cilindro(0.118, 0.06, 0.05, S(20)), pos: [0, 0.165, 0], mat: metal('#9aa0a6') }),
        n({ malla: MA.caja(0.02, 0.022, 0.19, 0.005, 1), pos: [0.115, 0.03, 0], mat: { color: '#050505' } }), n({ malla: MA.caja(0.012, 0.2, 0.012, 0.004, 1), pos: [0.123, -0.03, 0], mat: metal('#c4a35a') })] })]
    };
    const lz = o.lanza === 'ristre' ? lanza(3.7, { arandela: true, grosor: 0.028, banderola: o.bandera, detalle: D, pos: [-0.75, 0.24, 0.17], rot: [0, 0.13, -0.05] })
      : (o.lanza === 'alzada' ? lanza(3.7, { arandela: true, grosor: 0.028, banderola: o.bandera, detalle: D, pos: [0.28, -0.35, 0.22], rot: [0, 0, PI / 2 - 0.08] }) : null);
    if (lz) equipo.tronco.push(lz);
    const colores = { cabeza: piel, cuello: malla.colorHorneado, mano: '#3a2a1a', pie: '#2a2a2e', pelvis: lib[0] };
    // a pie (descabalgado o derribado): solo el jinete, con la pose que se pida y apoyado en el suelo
    if (o.aPie) { const j = MO.maniqui({ pose: o.pose || 'de_pie', pos: o.pos, rot: o.rot, apoyo: o.apoyo, suelo: o.suelo, colores, mapas: { brazo: malla.mapa, antebrazo: malla.mapa, muslo: malla.mapa, pierna: malla.mapa }, equipo, detalle: D * 0.7 });
      marcarHorneado(j, '#868c92'); return j; }
    const jinete = MO.maniqui({ pose: Object.assign({}, V.poses.jinete, o.pose || {}), colores, mapas: { brazo: malla.mapa, antebrazo: malla.mapa, muslo: malla.mapa, pierna: malla.mapa }, equipo, detalle: D * 0.7 });
    // la malla de brazos y piernas: el maniqui pone color blanco con mapa; para hornear se usa el gris
    marcarHorneado(jinete, '#868c92');
    const caballo = MO.caballo({ fase: o.fase, marcha: o.marcha, capa: o.capa === false ? null : lib, color: o.colorCaballo, encabritado: o.encabritado, detalle: D });
    // el jinete va en la silla y se mueve con el cuerpo del caballo (mismo bote y encabritado)
    const cuerpo = caballo.hijos[0]; if (!o.sinJinete) cuerpo.hijos[0].hijos.push(n({ pos: [0.04, 1.83, 0], hijos: [jinete] }));
    return n({ nombre: 'caballero', pos: o.pos, rot: o.rot, m: o.m, hijos: [caballo] });
  };
  function marcarHorneado(nodo, c) { for (const e of V.aplanar(nodo)) { const m = e.n.mat; if (m && m.mapa && !m.colorHorneado) m.colorHorneado = c; } }

  // ---------------------------------------------------------------- lancero escoces
  MO.lancero = function (o = {}) {
    const D = o.detalle || 1, S = (k) => Math.max(5, Math.round(k * D)), r = VE.rng(o.semilla || 'lancero');
    const tunica = o.tunica || ['#7a5a34', '#5d6b3a', '#8a7a5a', '#6e4a3a', '#9a8350', '#4f5a4a'][(r() * 6) | 0], piel = o.piel || ['#e0b494', '#c99a74', '#d8a884', '#b8865e'][(r() * 4) | 0];
    const cPelo = o.pelo || ['#3a2414', '#6b4a2a', '#8a5a2a', '#2a1c12', '#a8783a'][(r() * 5) | 0], casco = o.casco == null ? r() < 0.4 : o.casco;
    const piernas = r() < 0.5 ? piel : ['#5a4a3a', '#6a5a40', '#4a4a3e'][(r() * 3) | 0];
    const equipo = { tronco: [torso(TUNICA, 'tunica', tela(tunica), S), n({ malla: MA.toro(0.155, 0.02, S(18), 6), pos: [0, 0.03, 0], esc: [0.75, 1, 1], mat: cuero('#3a2412') })],
      cuello: [casco ? n({ malla: MA.esfera(S(16)), pos: [0.005, 0.215, 0], esc: [0.11, 0.105, 0.105], mat: metal('#8a9097') }) : pelo(cPelo, S)] };
    if (r() < 0.6) equipo.cuello.push(barba(cPelo, S));
    if (o.escudo !== false) equipo.tronco.push(broquel({ detalle: D, pos: [-0.16, 0.3, 0], rot: [0, 0, PI / 2] }));
    const modo = o.lanza || 'alzada', g = o.golpe || 0;
    if (modo === 'ristre' || modo === 'estocada') equipo.tronco.push(lanza(3.7, { detalle: D, pos: [-1.0 + g * 0.45, 0.2, 0.13], rot: [0, 0.04, -0.07] }));
    else if (modo === 'alzada') equipo.tronco.push(lanza(3.7, { detalle: D, pos: [0.24, -0.62, 0.21], rot: [0, 0, PI / 2 - 0.03] }));
    const colores = { cabeza: piel, cuello: piel, mano: piel, antebrazo: piel, brazo: tunica, pelvis: tunica, muslo: piernas, pierna: piernas, pie: '#3a2614' };
    return MO.maniqui({ pose: o.pose, pos: o.pos, rot: o.rot, apoyo: o.apoyo, suelo: o.suelo, colores, equipo, detalle: D * 0.7 });
  };

  // ---------------------------------------------------------------- infante ingles
  MO.infante = function (o = {}) {
    const D = o.detalle || 1, S = (k) => Math.max(5, Math.round(k * D)), r = VE.rng(o.semilla || 'infante');
    const gamb = o.gambeson || ['#d8ceb4', '#c8b896', '#b8a888', '#9a8a6a'][(r() * 4) | 0], piel = ['#e0b494', '#c99a74', '#d8a884'][(r() * 3) | 0];
    const equipo = { tronco: [torso(GAMBESON, 'gambeson', tela(gamb), S), escudoLagrima('#c0141e', '#f0e8d8', 'cheurón', { pos: [0.1, 0.24, -0.26], rot: [0, 0, 0.15] })],
      cuello: [n({ pos: [0.012, 0.22, 0], hijos: [n({ malla: MA.esfera(S(16)), esc: [0.112, 0.1, 0.108], mat: metal('#8a9097') }),
        n({ malla: MA.cilindro(0.2, 0.2, 0.012, S(20)), pos: [0, -0.015, 0], rot: [0, 0, 0.08], mat: metal('#7d838a') })] })] };
    if ((o.arma || 'lanza') === 'lanza') equipo.tronco.push(lanza(2.6, { detalle: D, pos: o.lanzaRistre ? [-0.7, 0.2, 0.14] : [0.24, -0.5, 0.21], rot: o.lanzaRistre ? [0, 0.04, -0.05] : [0, 0, PI / 2 - 0.03] }));
    const colores = { cabeza: piel, cuello: '#868c92', mano: '#4a3420', antebrazo: gamb, brazo: gamb, pelvis: gamb, muslo: '#6a5a48', pierna: '#5a4a3a', pie: '#2a1c10' };
    return MO.maniqui({ pose: o.pose, pos: o.pos, rot: o.rot, apoyo: o.apoyo, suelo: o.suelo, colores, equipo, detalle: D * 0.7 });
  };

  // ---------------------------------------------------------------- escenario
  MO.puente = function (o = {}) {
    const L = o.largo || 60, A = o.ancho || 3.6, H = o.alto || 2.4, h = [], tab = { color: '#ffffff', mapa: texTablas(), repetir: [1, L / 3], esp: 0.05, dureza: 10, envolver: 0.3, colorHorneado: '#6e4e30' };
    h.push(n({ malla: MA.caja(A, 0.22, L, 0.03, 1), pos: [0, H, 0], mat: tab }));
    const paso = o.pilas || 6, np = Math.floor(L / paso);
    for (let i = 0; i <= np; i++) { const z = -L / 2 + i * L / np;
      for (const x of [-A / 2 + 0.2, -A / 6, A / 6, A / 2 - 0.2]) h.push(n({ malla: MA.cilindro(0.16, 0.18, H + 3.2, 10), pos: [x, (H - 3.2) / 2, z], mat: madera('#4a3420') }));
      h.push(n({ malla: MA.caja(A + 0.6, 0.28, 0.3, 0.04, 1), pos: [0, H - 0.25, z], mat: madera('#553a22') }));
      for (const s of [-1, 1]) h.push(n({ malla: MA.caja(0.12, 1.05, 0.12, 0.02, 1), pos: [s * (A / 2 - 0.06), H + 0.6, z], mat: madera('#5a3e24') })); }
    for (const s of [-1, 1]) h.push(n({ malla: MA.caja(0.1, 0.1, L, 0.02, 1), pos: [s * (A / 2 - 0.06), H + 1.08, 0], mat: madera('#5a3e24') }));
    return n({ nombre: 'puente', pos: o.pos, rot: o.rot, hijos: h });
  };
  MO.tienda = function (o = {}) { const c = o.color || '#e8e0cc';
    return n({ pos: o.pos, rot: o.rot, hijos: [n({ malla: MA.cilindro(0.06, 2.6, 3.0, 18), pos: [0, 1.5, 0], mat: tela(c) }), n({ malla: MA.toro(2.4, 0.08, 24, 6), pos: [0, 0.35, 0], mat: tela(o.franja || '#b02a2a') }),
      n({ malla: MA.cilindro(0.04, 0.04, 1.2, 6), pos: [0, 3.4, 0], mat: madera() })] }); };
  /* Bandera en un mastil: la tela ondea (8 formas horneadas segun la fase). */
  MO.bandera = function (o = {}) { const k = Math.round(((((o.fase || 0) % 1) + 1) % 1) * 8) % 8, alto = o.alto || 4.2;
    return n({ pos: o.pos, rot: o.rot, hijos: [n({ malla: MA.cilindro(0.035, 0.035, alto, 8), pos: [0, alto / 2, 0], mat: madera('#5a3e24') }),
      n({ malla: MA.parametrica(10, 4, (u, v) => [0.02 + u * 1.15, alto - 0.08 - v * 0.75, 0.12 * Math.sin(u * 4 - k / 8 * 2 * PI) * u], { clave: 'tela|' + k, abierta: true }),
        mat: { color: '#ffffff', mapa: texCruz(o.cruz || 'aspa'), dobleCara: true, esp: 0.05, envolver: 0.4, colorHorneado: o.cruz === 'jorge' ? '#e8e4dc' : '#1d4f9a' } })] }); };

  // ---------------------------------------------------------------- efectos
  /* Salpicadura al caer al agua: gotas que suben y caen y un anillo que se abre en la superficie (y = origen[1]). */
  EF.salpicadura = function (semilla, origen, t0, t, o = {}) {
    const k = t - t0, vida = o.vida || 1.4; if (k < 0 || k > vida) return []; const r = VE.rng('salp' + semilla), out = [], N = o.n || 26, g = 9.8;
    for (let i = 0; i < N; i++) { const a = r() * 2 * PI, v = 1.5 + r() * 3, vy = 3 + r() * 4, y = origen[1] + vy * k - 0.5 * g * k * k; if (y < origen[1] - 0.05) continue;
      const tam = 0.03 + r() * 0.06, vel = [Math.cos(a) * v * 0.6, vy - g * k, Math.sin(a) * v * 0.6], estira = Math.min(3.5, 1 + Math.hypot(...vel) * 0.25);   // gotas alargadas en la direccion del movimiento
      out.push(n({ malla: MA.esfera(6), m: M4.mul(M4.base(vel, Math.abs(v3.norm(vel)[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0], [origen[0] + vel[0] * k, y, origen[2] + vel[2] * k]), M4.esc(tam, tam, tam * estira)),
        sinSombra: true, mat: { color: '#eef4f4', alfa: 0.6 * (1 - k / vida), esp: 0.8, dureza: 80 } })); }
    for (let i = 0; i < 3; i++) { const h = Math.max(0, Math.sin(PI * Math.min(1, k / 0.9))) * (1.2 + r() * 0.8), dx = (r() - 0.5) * 0.5, dz = (r() - 0.5) * 0.5;   // columnas de agua
      if (h > 0.05) out.push(n({ malla: MA.esfera(8), pos: [origen[0] + dx, origen[1] + h / 2, origen[2] + dz], esc: [0.12, h / 2, 0.12], sinSombra: true, mat: { color: '#f2f6f6', alfa: 0.4 * (1 - k / vida), esp: 0.6 } })); }
    out.push(n({ malla: MA.toro(1, 0.025, 32, 5), pos: [origen[0], origen[1] + 0.03, origen[2]], esc: [0.3 + k * 1.3, 1, 0.3 + k * 1.3], sinSombra: true, mat: { color: '#f2f6f6', alfa: 0.7 * (1 - k / vida), esp: 0.4 } }));
    return out;
  };

  // ---------------------------------------------------------------- fuego y humo (sprites que miran a la camara, todo funcion de t)
  /* Llama: lagrima con nucleo blanco-amarillo y bordes rojos (4 formas). Humo: bocanada gris suave. Brasa: punto incandescente. */
  function texLlama(k) { return V.textura('llama|' + k, 64, 128, (x, W, H) => { const r = VE.rng('llama' + k);
    for (let i = 0; i < 3; i++) { const cx = W / 2 + (r() - 0.5) * 8, cy = H * (0.62 + r() * 0.1), g = x.createRadialGradient(cx, cy, 2, cx, cy * 0.85, H * 0.5);
      g.addColorStop(0, 'rgba(255,250,220,0.95)'); g.addColorStop(0.25, 'rgba(255,200,80,0.85)'); g.addColorStop(0.55, 'rgba(240,110,30,0.55)'); g.addColorStop(1, 'rgba(160,30,10,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(cx, H * 0.04 + r() * 12); x.bezierCurveTo(cx + W * 0.55, H * 0.45, cx + W * 0.48, H * 0.98, cx, H * 0.98); x.bezierCurveTo(cx - W * 0.48, H * 0.98, cx - W * 0.55, H * 0.45, cx, H * 0.04 + r() * 12); x.fill(); } }); }
  function texHumo(k) { return V.textura('humo|' + k, 128, 128, (x, W, H) => { const r = VE.rng('humo' + k);
    for (let i = 0; i < 14; i++) { const cx = W * (0.3 + r() * 0.4), cy = H * (0.3 + r() * 0.4), rr = W * (0.15 + r() * 0.2), g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); } }); }
  function texBrasa() { return V.textura('brasa', 32, 32, (x, W, H) => { const g = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(0.4, 'rgba(255,140,40,0.8)'); g.addColorStop(1, 'rgba(255,80,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }); }
  /* Plano vertical que mira a la camara (en horizontal) en p, de ancho w y alto h, con su pie en p. */
  function cartel(cam, p, w, h, mat, giro = 0) { const d = [cam.pos[0] - p[0], 0, cam.pos[2] - p[2]], l = Math.hypot(d[0], d[2]) || 1;
    const m = M4.mul(M4.mul(M4.mul(M4.base([d[0] / l, 0, d[2] / l], [0, 1, 0], [p[0], p[1] + h / 2, p[2]]), M4.rotZ(giro)), M4.rotX(PI / 2)), M4.esc(w, 1, h));
    return n({ malla: MA.plano(1, 1, 1), m, sinSombra: true, mat }); }
  /* Fuego en 'pos' de tamano 'tam' (m): lenguas que suben, se estrechan y parpadean; brasas que saltan. o: { cam (obligatoria), tam, intensidad } */
  EF.fuego = function (semilla, pos, t, o = {}) { const cam = o.cam, tam = o.tam || 1, r = VE.rng('fuego' + semilla), N = Math.round(9 + 9 * tam), out = [];
    for (let i = 0; i < N; i++) { const vel = 0.9 + r() * 0.8, fase = ((t * vel + r()) % 1 + 1) % 1, dx = (r() - 0.5) * tam * 0.9, dz = (r() - 0.5) * tam * 0.9, alto = tam * (0.9 + r() * 0.9);
      const y = pos[1] + fase * alto * 0.55, w = tam * (0.55 + r() * 0.35) * (1 - fase * 0.7), h = alto * (0.7 + 0.5 * Math.sin(PI * fase)), a = Math.sin(PI * Math.min(1, fase * 1.4)) * (o.intensidad || 0.9);
      const vaiven = Math.sin(t * 7 + i) * 0.12 * tam * fase;
      out.push(cartel(cam, [pos[0] + dx + vaiven, y, pos[2] + dz], w, h, { tipo: 'plano', color: '#ffffff', mapa: texLlama(i % 4), alfa: a, dobleCara: true, sinNiebla: true }, (r() - 0.5) * 0.3)); }
    for (let i = 0; i < Math.round(6 * tam); i++) { const vel = 0.5 + r() * 0.5, fase = ((t * vel + r()) % 1 + 1) % 1, s = 0.05 + r() * 0.05;
      out.push(cartel(cam, [pos[0] + (r() - 0.5) * tam + Math.sin(t * 3 + i) * 0.3 * fase, pos[1] + tam * 0.6 + fase * tam * 3.2, pos[2] + (r() - 0.5) * tam], s, s,
        { tipo: 'plano', color: '#ffffff', mapa: texBrasa(), alfa: 1 - fase, dobleCara: true, sinNiebla: true })); }
    return out; };
  /* Columna de humo: bocanadas que suben, crecen, se aclaran y se las lleva el viento. o: { cam, tam, viento: [vx, vz], oscuro 0..1, alto } */
  EF.humo = function (semilla, pos, t, o = {}) { const cam = o.cam, tam = o.tam || 1, r = VE.rng('humo' + semilla), N = Math.round(10 + 8 * tam), out = [], vi = o.viento || [0.6, 0.2], H = o.alto || 14 * tam;
    for (let i = 0; i < N; i++) { const vida = 6 + r() * 4, fase = (((t + r() * vida) / vida) % 1 + 1) % 1, y = pos[1] + tam * 1.2 + fase * H, s = tam * (1.2 + fase * 5) * (0.7 + r() * 0.6);
      const gris = Math.round(70 + (1 - (o.oscuro == null ? 0.6 : o.oscuro)) * 90 + fase * 50), c = `rgb(${gris},${gris - 4},${gris - 8})`;
      out.push(cartel(cam, [pos[0] + vi[0] * fase * H * 0.8 + (r() - 0.5) * tam, y - s / 2, pos[2] + vi[1] * fase * H * 0.8 + (r() - 0.5) * tam], s, s,
        { tipo: 'plano', color: c, mapa: texHumo(i % 3), alfa: 0.55 * Math.sin(PI * Math.min(1, fase * 1.3)) * (1 - fase * 0.4), dobleCara: true }, r() * 6)); }
    return out; };
  /* Resplandor del fuego (despues de V.render): halo calido en cada foco, con un parpadeo determinista. */
  B.brillos = function (esc, cam, focos, t) { const x = esc.ctx; x.save(); x.globalCompositeOperation = 'lighter';
    for (const [p, tam, k] of focos) { const q = V.proyectar(esc, cam, [p[0], p[1] + tam * 0.6, p[2]]); if (!q.delante) continue; const r = Math.max(8, Math.min(400, V.escalaPantalla(esc, cam, p, tam * 2.6)));
      x.globalAlpha = 0.35 + 0.12 * Math.sin(t * 13 + (k || 0)) + 0.08 * Math.sin(t * 29 + 2 * (k || 0)); esc.pegar(esc.cache.halo(Math.round(r), '#ff9a40', 0.25), q.x, q.y, 1); }
    x.restore(); };

  // ---------------------------------------------------------------- horneado de soldados (una malla por soldado y estado)
  const PAL = { n: 256, colores: [], lienzo: null };
  B.paleta = function () { if (!PAL.lienzo) { PAL.lienzo = document.createElement('canvas'); PAL.lienzo.width = PAL.n; PAL.lienzo.height = 1; } return PAL.lienzo; };
  function idxColor(c) { let i = PAL.colores.indexOf(c); if (i >= 0) return i; i = PAL.colores.length; if (i >= PAL.n) return PAL.n - 1; PAL.colores.push(c);
    const x = B.paleta().getContext('2d'); x.fillStyle = c; x.fillRect(i, 0, 1, 1); if (PAL.lienzo.__tex) PAL.lienzo.__tex = null; return i; }
  B.material = (o = {}) => Object.assign({ color: '#ffffff', mapa: B.paleta(), esp: 0.14, dureza: 22, envolver: 0.3, borde: 0.5 }, o);
  /* Une todas las mallas del arbol (con su matriz) en una sola; el color de cada pieza va a la paleta. Se guarda por clave. */
  B.hornear = function (nodo, clave) {
    return MA.cache('horno|' + clave, () => {
      const pos = [], nor = [], uv = [], idx = [];
      for (const e of V.aplanar(nodo)) { const m = e.n.malla; if (!m || e.n.oculto) continue; const mt = e.n.mat || {}; if (mt.tipo === 'plano' || mt.tipo === 'sombra' || mt.tipo === 'rayosx') continue;
        const u = (idxColor(mt.colorHorneado || mt.color || '#cccccc') + 0.5) / PAL.n, b = pos.length / 3, NM = M4.normal(e.M);
        for (let i = 0; i < m.pos.length; i += 3) { const p = M4.ap(e.M, [m.pos[i], m.pos[i + 1], m.pos[i + 2]]); pos.push(p[0], p[1], p[2]);
          const q = [m.nor[i], m.nor[i + 1], m.nor[i + 2]], w = v3.norm([NM[0] * q[0] + NM[3] * q[1] + NM[6] * q[2], NM[1] * q[0] + NM[4] * q[1] + NM[7] * q[2], NM[2] * q[0] + NM[5] * q[1] + NM[8] * q[2]]);
          nor.push(w[0], w[1], w[2]); uv.push(u, 0.5); }
        for (let i = 0; i < m.idx.length; i++) idx.push(m.idx[i] + b); }
      return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint32Array(idx), abierta: true };
    });
  };
  /* Instancia horneada: malla compartida + matriz propia (posicion, rumbo, giro). Muy barata: una llamada de dibujo. */
  B.instancia = (malla, o) => n({ malla, pos: o.pos, rot: o.rot, esc: o.esc, m: o.m, sinSombra: o.sinSombra, mat: o.mat || B.material() });
})(window.VE = window.VE || {});
