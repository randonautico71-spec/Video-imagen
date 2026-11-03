/* VOLUMEN — FUTBOL: campo, porterias con red, balon, futbolistas, estadio con publico, jugadas y planos de camara.
   Guia de uso y medidas: docs/FUTBOL_3D.md. Unidades: metros. Y arriba; el campo es largo en X (-52,5..52,5) y ancho en Z (-34..34).
     V.futbol.MED                                       medidas de las Reglas de Juego (IFAB, Reglas 1 y 2)
     V.modelos.campo({ colores })                       cesped con franjas y lineas pintadas en la textura (sin z-fighting)
     V.modelos.porterias({ t, gol: {t, p, lado} })      porterias de 7,32 x 2,44 con red (la red se abomba con el gol)
     V.modelos.balon({ pos, m })                        balon de radio 0,11 (paneles pintados sobre la esfera)
     V.modelos.futbolista({ kit, dorsal, portero, pose, pos, rot, apoyo, suelo })   maniqui con equipacion, dorsal y pelo
     V.modelos.estadio({ t, celebra(bloque, t), aficiones })   gradas de dos anfiteatros, cubierta con focos, vallas y publico
     V.futbol.jugada(def)                               guion de toques -> { balon(t), jugador(id, t), revisar() }
     V.futbol.planos                                    camaras: general, cenital, raso, porteria, seguimiento, spidercam, grada
     V.pose.chutar(f) · cabezazo(f) · estirada(k) · celebrar(f) · V.poses.portero
   Todo depende de t (sin estado): cualquier fotograma se puede pintar suelto y el render por tramos da lo mismo. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, v3 = V.v3;
  const F = V.futbol = {};
  const MED = F.MED = { L: 105, A: 68, porteriaAncho: 7.32, porteriaAlto: 2.44, poste: 0.12, area: 16.5, areaPeq: 5.5, penalti: 11, circulo: 9.15, corner: 1, linea: 0.12, balonR: 0.11 };
  const MX = MED.L / 2, MZ = MED.A / 2, PA = MED.porteriaAncho / 2;
  const c01 = (v) => Math.max(0, Math.min(1, v)), suave = (v) => { v = c01(v); return v * v * (3 - 2 * v); };

  // ---------------------------------------------------------------- campo
  const CAMPO = { margenX: 4, margenZ: 4 };
  MO.campo = function (o = {}) {
    const C = Object.assign({ verde1: '#3e7a33', verde2: '#4a8a3c', fuera: '#37692d', linea: 'rgba(246,246,238,0.94)' }, o.colores || {});
    const LW = MED.L + CAMPO.margenX * 2, AW = MED.A + CAMPO.margenZ * 2, ppm = o.ppm || 36, TW = Math.round(LW * ppm), TH = Math.round(AW * ppm);
    const tex = V.textura('campo|' + JSON.stringify(C) + '|' + ppm, TW, TH, (x) => {
      x.fillStyle = C.fuera; x.fillRect(0, 0, TW, TH);
      x.setTransform(ppm, 0, 0, ppm, LW / 2 * ppm, AW / 2 * ppm);       // metros -> pixeles (u = x, v = z)
      const n = 20, an = MED.L / n; for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? C.verde1 : C.verde2; x.fillRect(-MX + i * an, -MZ - 0.5, an, MED.A + 1); }
      // manchas suaves (no parecer plastico): ruido a baja resolucion escalado
      x.setTransform(1, 0, 0, 1, 0, 0);
      const nw = 220, nh = Math.round(nw * AW / LW), nc = document.createElement('canvas'); nc.width = nw; nc.height = nh; const nx = nc.getContext('2d'), img = nx.createImageData(nw, nh), rn = VE.real.ruido2('cesped');
      for (let j = 0; j < nh; j++) for (let i = 0; i < nw; i++) { const v = rn.fbm(i * 0.05, j * 0.05, 4), k = (j * nw + i) * 4, g = v > 0.5 ? 255 : 0; img.data[k] = g; img.data[k + 1] = g; img.data[k + 2] = g; img.data[k + 3] = Math.abs(v - 0.5) * 70; }
      nx.putImageData(img, 0, 0); x.imageSmoothingEnabled = true; x.drawImage(nc, 0, 0, TW, TH);
      // grano fino
      const r = VE.rng('grano'); x.globalAlpha = 0.05; for (let i = 0; i < TW * TH / 60; i++) { x.fillStyle = r() < 0.5 ? '#0d2a08' : '#b8d890'; x.fillRect(r() * TW, r() * TH, 2, 2); } x.globalAlpha = 1;
      // lineas
      x.setTransform(ppm, 0, 0, ppm, LW / 2 * ppm, AW / 2 * ppm); x.strokeStyle = C.linea; x.fillStyle = C.linea; x.lineWidth = MED.linea;
      const rect = (x0, z0, x1, z1) => x.strokeRect(x0, z0, x1 - x0, z1 - z0);
      rect(-MX, -MZ, MX, MZ); x.beginPath(); x.moveTo(0, -MZ); x.lineTo(0, MZ); x.stroke();
      x.beginPath(); x.arc(0, 0, MED.circulo, 0, 2 * PI); x.stroke(); x.beginPath(); x.arc(0, 0, 0.15, 0, 2 * PI); x.fill();
      for (const s of [1, -1]) {
        const ga = PA + MED.area, gp = PA + MED.areaPeq, xp = s * (MX - MED.penalti);
        rect(Math.min(s * MX, s * (MX - MED.area)), -ga, Math.max(s * MX, s * (MX - MED.area)), ga);
        rect(Math.min(s * MX, s * (MX - MED.areaPeq)), -gp, Math.max(s * MX, s * (MX - MED.areaPeq)), gp);
        x.beginPath(); x.arc(xp, 0, 0.15, 0, 2 * PI); x.fill();
        const th = Math.acos((MED.area - MED.penalti) / MED.circulo), c = s > 0 ? PI : 0; x.beginPath(); x.arc(xp, 0, MED.circulo, c - th, c + th); x.stroke();
        for (const z of [1, -1]) { const a0 = s > 0 ? (z > 0 ? PI : PI / 2) : (z > 0 ? 1.5 * PI : 0); x.beginPath(); x.arc(s * MX, z * MZ, MED.corner, a0, a0 + PI / 2); x.stroke(); }
      }
      x.setTransform(1, 0, 0, 1, 0, 0);
    });
    return V.nodo({ nombre: 'campo', hijos: [
      V.nodo({ malla: MA.plano(LW, AW, 1), mat: { color: '#ffffff', mapa: tex, esp: 0.06, dureza: 10, envolver: 0.2, borde: 0.05 } }),
      V.nodo({ malla: MA.plano(260, 220, 1), pos: [0, -0.03, 0], mat: { color: o.pista || '#2c3a2a', esp: 0, borde: 0 } })] });
  };

  // ---------------------------------------------------------------- porterias y red
  const RED = { fondo: 2.0, arriba: 0.9 };                            // la red baja del larguero hasta 2 m por detras
  const perfilRed = (v) => { // v 0..1 desde el larguero hasta el suelo por detras -> [profundidad, altura]
    const k = 0.32; if (v < k) { const q = v / k; return [RED.arriba * q, MED.porteriaAlto - 0.12 * q]; }
    const q = (v - k) / (1 - k); return [RED.arriba + (RED.fondo - RED.arriba) * q, (MED.porteriaAlto - 0.12) * (1 - q)]; };
  /* Profundidad de la red a una altura y (inversa del perfil). */
  F.fondoRed = (y) => { const yq = MED.porteriaAlto - 0.12; if (y >= yq) return RED.arriba * Math.min(1, (MED.porteriaAlto - y) / 0.12); return RED.arriba + (RED.fondo - RED.arriba) * (1 - Math.max(0, y) / yq); };
  function texRed() {
    return V.textura('red', 256, 256, (x, W, H, c) => { c.repetirV = true; x.clearRect(0, 0, W, H); x.strokeStyle = 'rgba(245,245,245,0.9)'; x.lineWidth = 2;
      const n = 8; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * W / n, 0); x.lineTo(i * W / n, H); x.stroke(); x.beginPath(); x.moveTo(0, i * H / n); x.lineTo(W, i * H / n); x.stroke(); } });
  }
  MO.porterias = function (o = {}) {
    const t = o.t || 0, gol = o.gol, hijos = [], blanco = { tipo: 'brillo', color: '#f4f4f0', esp: 0.4, dureza: 40 };
    const malla = { color: '#ffffff', mapa: texRed(), alfa: 0.98, dobleCara: true, esp: 0, borde: 0.2 }, ancho = MED.porteriaAncho, rep = [ancho / 0.12 / 8, 2.4 / 0.12 / 8];
    for (const s of [1, -1]) {
      const g = [], X = s * MX, R = 0.06;
      for (const z of [PA + R, -PA - R]) g.push(V.nodo({ malla: MA.cilindro(R, R, MED.porteriaAlto, 20), pos: [X + s * R, MED.porteriaAlto / 2, z], mat: blanco }));
      g.push(V.nodo({ malla: MA.cilindro(R, R, ancho + 4 * R, 20), pos: [X + s * R, MED.porteriaAlto + R, 0], rot: [PI / 2, 0, 0], mat: blanco }));
      // soportes de la red (tubos finos)
      const prof = []; for (let i = 0; i <= 12; i++) { const p = perfilRed(i / 12); prof.push(p); }
      for (const z of [PA + R, -PA - R]) g.push(V.nodo({ malla: MA.tubo(prof.map(p => [X + s * (p[0] + R), p[1], z]), 0.025, 6, { clave: 'soporte|' + s + '|' + z }), mat: { color: '#d8d8d8' } }));
      // red trasera y techo (dinamica si hay gol en esta porteria)
      const bulto = gol && gol.lado === s && t > gol.t ? (() => { const k = t - gol.t, A = 0.55 * (k / 0.16) * Math.exp(1 - k / 0.16); return { A, z: gol.p[2], y: gol.p[1] }; })() : null;
      const f = (u, v) => { const z = (u - 0.5) * (ancho + 0.24), p = perfilRed(v); let d = p[0], y = p[1];
        if (bulto) { const w = Math.exp(-((z - bulto.z) ** 2 + (y - bulto.y) ** 2) / 0.9); d += bulto.A * w * (v > 0.25 ? 1 : v / 0.25); }
        return [X + s * (d + R), y, z]; };
      g.push(V.nodo({ malla: bulto && bulto.A > 0.002 ? MA.parametrica(40, 24, f, { abierta: true, dinamica: 'red' + s }) : MA.parametrica(40, 24, f, { abierta: true, clave: 'red|' + s }), mat: Object.assign({}, malla, { repetir: rep }), sinSombra: true }));
      // laterales
      for (const zs of [1, -1]) g.push(V.nodo({ malla: MA.parametrica(16, 8, (u, v) => { const p = perfilRed(u); return [X + s * (p[0] * v + R), p[1], zs * (PA + R)]; }, { abierta: true, clave: 'redlat|' + s + '|' + zs }),
        mat: Object.assign({}, malla, { repetir: [2.4, 1.6] }), sinSombra: true }));
      hijos.push(V.nodo({ nombre: 'porteria' + (s > 0 ? '_e' : '_o'), hijos: g }));
    }
    return V.nodo({ nombre: 'porterias', hijos });
  };

  // ---------------------------------------------------------------- balon
  function texBalon() {
    return V.textura('balon', 512, 256, (x, W, H) => {
      const ph = (1 + Math.sqrt(5)) / 2, ico = []; for (const a of [-1, 1]) for (const b of [-1, 1]) ico.push([0, a, b * ph], [a, b * ph, 0], [b * ph, 0, a]);
      const ic = ico.map(v3.norm), car = []; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) {
        const d = (a, b) => v3.lon(v3.res(ico[a], ico[b])); if (Math.abs(d(i, j) - 2) < 0.01 && Math.abs(d(j, k) - 2) < 0.01 && Math.abs(d(i, k) - 2) < 0.01) car.push(v3.norm(v3.sum(v3.sum(ico[i], ico[j]), ico[k]))); }
      const C = ic.map(c => ({ c, p: true })).concat(car.map(c => ({ c, p: false }))), img = x.createImageData(W, H), d = img.data;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const th = (j + 0.5) / H * PI, f = (i + 0.5) / W * 2 * PI, q = [Math.sin(th) * Math.sin(f), Math.cos(th), Math.sin(th) * Math.cos(f)];
        let b1 = -9, b2 = -9, p1 = false; for (const e of C) { const s = v3.punto(q, e.c) + (e.p ? -0.012 : 0); if (s > b1) { b2 = b1; b1 = s; p1 = e.p; } else if (s > b2) b2 = s; }
        const borde = c01((b1 - b2) / 0.012), base = p1 ? [28, 30, 36] : [242, 242, 238], cos = [150, 150, 150], k = (j * W + i) * 4;
        for (let c = 0; c < 3; c++) d[k + c] = cos[c] + (base[c] - cos[c]) * borde; d[k + 3] = 255;
      }
      x.putImageData(img, 0, 0);
    });
  }
  /* Matriz de giro alrededor de un eje (unitario). */
  F.rotEje = function (k, a) {
    const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = k, m = V.m4.id();
    const R = [[c + x * x * t, x * y * t - z * s, x * z * t + y * s], [y * x * t + z * s, c + y * y * t, y * z * t - x * s], [z * x * t - y * s, z * y * t + x * s, c + z * z * t]];
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) m[q * 4 + r] = R[r][q]; return m;
  };
  MO.balon = function (o = {}) {
    const p = o.pos || [0, MED.balonR, 0], m = V.m4.mul(V.m4.mul(V.m4.tras(p[0], p[1], p[2]), o.giro || V.m4.id()), V.m4.esc(MED.balonR));
    return V.nodo({ nombre: 'balon', malla: MA.esfera(32), m, mat: { color: '#ffffff', mapa: texBalon(), esp: 0.45, dureza: 50, envolver: 0.15, borde: 0.4 } });
  };

  // ---------------------------------------------------------------- poses de futbol
  const BASE = { tronco: 0, cuello: 0, cadera_d: 0, cadera_i: 0, rodilla_d: 0, rodilla_i: 0, tobillo_d: 0, tobillo_i: 0, hombro_d: 4, hombro_i: -4, codo_d: 10, codo_i: 10, abrir: 6 };
  const claves = (lista, f) => { // [[fase, pose], ...] con suavizado entre claves
    f = c01(f); let i = 0; while (i < lista.length - 2 && f > lista[i + 1][0]) i++;
    const [fa, a] = lista[i], [fb, b] = lista[i + 1]; return V.pose.mezclar(Object.assign({}, BASE, a), Object.assign({}, BASE, b), suave((f - fa) / (fb - fa || 1))); };
  V.poses.portero = { tronco: 22, cuello: -14, cadera_d: 38, cadera_i: 38, rodilla_d: 48, rodilla_i: 48, tobillo_d: 0, tobillo_i: 0, hombro_d: 38, hombro_i: 38, codo_d: 55, codo_i: 55, abrir: 26 };
  const CHUTE = [
    [0.0, { tronco: 12, cuello: -8, cadera_d: 12, cadera_i: -14, rodilla_d: 40, rodilla_i: 22, hombro_d: -25, hombro_i: 25, codo_d: 80, codo_i: 80, abrir: 10 }],
    [0.3, { tronco: 8, cuello: -10, cadera_d: -42, cadera_i: 16, rodilla_d: 105, rodilla_i: 26, hombro_d: -30, hombro_i: 50, codo_d: 60, codo_i: 40, abrir: 38 }],
    [0.5, { tronco: -2, cuello: -12, cadera_d: 28, cadera_i: 12, rodilla_d: 18, rodilla_i: 24, hombro_d: -40, hombro_i: 62, codo_d: 50, codo_i: 30, abrir: 42 }],
    [0.72, { tronco: -10, cuello: -6, cadera_d: 72, cadera_i: 8, rodilla_d: 8, rodilla_i: 20, hombro_d: -30, hombro_i: 55, codo_d: 50, codo_i: 40, abrir: 38 }],
    [1.0, { tronco: 10, cuello: -6, cadera_d: 10, cadera_i: -10, rodilla_d: 35, rodilla_i: 25, hombro_d: -20, hombro_i: 20, codo_d: 80, codo_i: 80, abrir: 10 }]];
  const CABEZA = [
    [0.0, { tronco: 14, cuello: -10, cadera_d: 40, cadera_i: 34, rodilla_d: 70, rodilla_i: 64, hombro_d: 20, hombro_i: 20, codo_d: 70, codo_i: 70, abrir: 18 }],
    [0.32, { tronco: -20, cuello: -22, cadera_d: 6, cadera_i: 28, rodilla_d: 80, rodilla_i: 40, hombro_d: 80, hombro_i: 80, codo_d: 40, codo_i: 40, abrir: 48 }],
    [0.5, { tronco: 24, cuello: 22, cadera_d: 36, cadera_i: 22, rodilla_d: 46, rodilla_i: 64, hombro_d: 48, hombro_i: 48, codo_d: 60, codo_i: 60, abrir: 40 }],
    [1.0, { tronco: 12, cuello: 0, cadera_d: 30, cadera_i: 26, rodilla_d: 44, rodilla_i: 40, hombro_d: 18, hombro_i: 18, codo_d: 50, codo_i: 50, abrir: 16 }]];
  Object.assign(V.pose, {
    /* Chute o pase con la derecha: el contacto con el balon es en fase 0,5. */
    chutar: (f) => claves(CHUTE, f),
    /* Remate de cabeza: arqueo y golpe (contacto en 0,5). El salto (altura) se aplica aparte con la posicion. */
    cabezazo: (f) => claves(CABEZA, f),
    /* Estirada del portero (k 0..1): brazos por encima de la cabeza. El giro del cuerpo va en rot[0] (alrededor de la direccion a la que mira). */
    estirada: (k) => V.pose.mezclar(V.poses.portero, { tronco: 4, cuello: 0, cadera_d: 22, cadera_i: -6, rodilla_d: 26, rodilla_i: 8, tobillo_d: 0, tobillo_i: 0, hombro_d: 168, hombro_i: 172, codo_d: 8, codo_i: 8, abrir: 22 }, suave(k)),
    /* Celebracion: brazos arriba con un leve vaiven (fase en vueltas). */
    celebrar: (f) => { const s = Math.sin(f * 2 * PI); return { hombro_d: 150 + 12 * s, hombro_i: 150 - 12 * s, codo_d: 30 + 10 * s, codo_i: 30 - 10 * s, abrir: 42 }; },
    /* Entrada del defensor (k 0..1): se lanza con la pierna derecha estirada hacia el balon. */
    entrada: (k) => V.pose.mezclar(V.poses.portero, { tronco: 34, cuello: -16, cadera_d: 78, cadera_i: -18, rodilla_d: 6, rodilla_i: 70, tobillo_d: 0, tobillo_i: 0, hombro_d: 45, hombro_i: -30, codo_d: 40, codo_i: 40, abrir: 34 }, suave(k)),
    /* La misma pose con los lados cambiados (zurdos: chutar con la izquierda = espejo(chutar(f))). */
    espejo: (p) => { const o = {}; for (const k in p) { const m = /_([di])$/.exec(k); o[m ? k.slice(0, -1) + (m[1] === 'd' ? 'i' : 'd') : k] = p[k]; } return o; }
  });
  F.brazos = (pose, brazos, k) => { const o = Object.assign({}, pose); for (const c in brazos) o[c] = (pose[c] == null ? 0 : pose[c]) + (brazos[c] - (pose[c] == null ? 0 : pose[c])) * k; return o; };

  // ---------------------------------------------------------------- futbolista
  function texDorsal(n, fondo, tinta) {
    return V.textura('dorsal|' + n + '|' + fondo + '|' + tinta, 128, 160, (x, W, H) => {
      x.fillStyle = fondo; x.fillRect(0, 0, W, H); x.translate(0, H); x.scale(1, -1);       // v = 0 abajo
      x.fillStyle = tinta; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 ' + (String(n).length > 1 ? 104 : 124) + 'px Fredoka, sans-serif';
      x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,0.25)'; x.strokeText(String(n), W / 2, H * 0.53); x.fillText(String(n), W / 2, H * 0.53);
    });
  }
  const parcheDorsal = () => MA.parametrica(10, 10, (u, v) => { const z = (u - 0.5) * 0.19, y = (v - 0.5) * 0.2, q = 1 - (z / 0.17) ** 2 - (y / 0.17) ** 2;
    return [-(0.12 * Math.sqrt(Math.max(0.02, q)) + 0.006), 0.33 + y, z]; }, { clave: 'dorsal_parche', abierta: true });
  MO.futbolista = function (o = {}) {
    const k = Object.assign({ camiseta: '#c8102e', pantalon: '#f2f2f2', medias: '#c8102e', botas: '#1a1a1a', piel: '#c99a74', pelo: '#2a1c12', numero: '#ffffff', mangas: null, guantes: '#e8e8e8' }, o.kit || {});
    const colores = { pecho: k.camiseta, vientre: k.camiseta, cintura: k.camiseta, brazo: k.camiseta, antebrazo: o.portero ? k.camiseta : k.piel, mano: k.piel, cuello: k.piel, cabeza: k.piel,
      pelvis: k.pantalon, muslo: k.pantalon, pierna: k.medias, pie: k.botas };
    const mapas = k.rayas ? (() => { const tx = texRayas(k.rayas, k.nRayas || 10); return { pecho: tx, vientre: tx, cintura: tx, brazo: tx }; })() : null;
    const equipo = { cuello: [V.nodo({ malla: MA.esfera(20), pos: [-0.008, 0.207, 0], esc: [0.1, 0.104, 0.096], mat: { color: k.pelo, esp: 0.15, dureza: 20 } })] };
    if (o.dorsal != null) equipo.tronco = [V.nodo({ malla: parcheDorsal(), mat: { color: '#ffffff', mapa: texDorsal(o.dorsal, k.fondoDorsal || k.camiseta, k.numero), dobleCara: true, esp: 0.12, dureza: 26, envolver: 0.25 } })];
    if (o.portero) { const guante = (l) => V.nodo({ malla: MA.esfera(16), pos: [0, -0.33, 0], esc: [0.048, 0.07, 0.06], mat: { color: k.guantes } }); equipo.codo_d = [guante('d')]; equipo.codo_i = [guante('i')]; }
    return MO.maniqui({ pose: o.pose, pos: o.pos, rot: o.rot, esc: o.esc, apoyo: o.apoyo, suelo: o.suelo, piesX: o.piesX, colores, equipo, mapas });
  };
  /* Camiseta a rayas verticales: [color1, color2], n pares alrededor del cuerpo (u de la esfera = vuelta alrededor de Y). */
  function texRayas(c, n) { return V.textura('rayas|' + c.join(',') + '|' + n, 512, 16, (x, W, H) => { for (let i = 0; i < n * 2; i++) { x.fillStyle = c[i % 2]; x.fillRect(i * W / (n * 2), 0, W / (n * 2) + 1, H); } }); }

  // ---------------------------------------------------------------- estadio
  /* Perfil de la grada (a = distancia hacia fuera desde el frente, y = altura). Dos anfiteatros. */
  const GR = { muro: 1.6, filas1: 22, huella: 0.8, tabica1: 0.42, palco: 3.2, filas2: 18, tabica2: 0.55 };
  GR.y1 = GR.muro + GR.filas1 * GR.tabica1; GR.a1 = GR.filas1 * GR.huella; GR.y2 = GR.y1 + GR.palco; GR.a2 = GR.a1 + 2.0; GR.fondo = GR.a2 + GR.filas2 * GR.huella; GR.techo = GR.y2 + GR.filas2 * GR.tabica2 + 4.5;
  F.GRADA = GR;
  function filas() { const o = []; for (let r = 0; r < GR.filas1; r++) o.push({ a: r * GR.huella, y: GR.muro + (r + 1) * GR.tabica1, piso: 1 });
    for (let r = 0; r < GR.filas2; r++) o.push({ a: GR.a2 + r * GR.huella, y: GR.y2 + (r + 1) * GR.tabica2, piso: 2 }); return o; }
  function perfilGrada() {
    const p = [[0, 0], [0, GR.muro]]; for (let r = 0; r < GR.filas1; r++) { const y = GR.muro + (r + 1) * GR.tabica1; p.push([r * GR.huella, y], [(r + 1) * GR.huella, y]); }
    p.push([GR.a1, GR.y1 + 0.6], [GR.a1 + 0.4, GR.y1 + 0.6], [GR.a1 + 0.4, GR.y2], [GR.a2, GR.y2]);
    for (let r = 0; r < GR.filas2; r++) { const y = GR.y2 + (r + 1) * GR.tabica2; p.push([GR.a2 + r * GR.huella, y], [GR.a2 + (r + 1) * GR.huella, y]); }
    p.push([GR.fondo, GR.y2 + GR.filas2 * GR.tabica2 + 1.2], [GR.fondo + 1, GR.y2 + GR.filas2 * GR.tabica2 + 1.2], [GR.fondo + 1, 0]);
    return p;   // poligono [a, y]
  }
  /* Malla de publico (cuerpos + cabezas, o solo brazos levantados) para un bloque de filas y un tramo de la grada.
     El color de cada persona sale de una paleta en textura (uv fijo por persona): una sola llamada por bloque. */
  const PALETA_N = 32;
  function paleta(colores) {
    return V.textura('paleta|' + colores.join(','), PALETA_N, 1, (x) => { colores.forEach((c, i) => { x.fillStyle = c; x.fillRect(i, 0, 1, 1); }); });
  }
  function caja(pos, nor, uv, idx, c, h, u) { // caja sin bisel: 6 caras x 4 vertices
    const [cx, cy, cz] = c, [hx, hy, hz] = h;
    for (const [k, s] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
      const i = (k + 1) % 3, j = (k + 2) % 3, b = pos.length / 3;
      for (const [a, bb] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = [0, 0, 0]; p[k] = s; p[i] = a; p[j] = bb; pos.push(cx + p[0] * hx, cy + p[1] * hy, cz + p[2] * hz); const n = [0, 0, 0]; n[k] = s; nor.push(...n); uv.push(u, 0.5); }
      if (s > 0) idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); else idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
  }
  function cabeza(pos, nor, uv, idx, c, r, u) { const nu = 8, nv = 5, b = pos.length / 3;
    for (let j = 0; j <= nv; j++) { const th = j / nv * PI; for (let i = 0; i <= nu; i++) { const ph = i / nu * 2 * PI, x = Math.sin(th) * Math.sin(ph), y = Math.cos(th), z = Math.sin(th) * Math.cos(ph);
      pos.push(c[0] + x * r, c[1] + y * r * 1.15, c[2] + z * r); nor.push(x, y, z); uv.push(u, 0.5); } }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = b + j * (nu + 1) + i, bb = a + 1, cc = a + nu + 1, d = cc + 1; idx.push(a, cc, bb, bb, cc, d); } }
  F.publico = function (clave, o) {
    return MA.cache(clave, () => {
      const pos = [], nor = [], uv = [], idx = [], r = VE.rng(o.semilla || clave), U = (i) => (i + 0.5) / PALETA_N;
      const lugares = o.lugares || (() => { const l = [], L = o.largo; for (const f of o.filas) for (let z = -L / 2 + 0.3; z < L / 2 - 0.3; z += 0.55) l.push([f.a + 0.42, f.y, z]); return l; })();
      for (const [a0, y, z] of lugares) {
        if (r() > o.densidad) continue; const zz = z + (r() - 0.5) * 0.12, a = a0 + (r() - 0.5) * 0.08, alto = 0.94 + r() * 0.16, de = o.dePie ? 0.45 : 0;
        const col = o.color(r), piel = U(o.pieles[(r() * o.pieles.length) | 0]);
        if (o.brazos) { const ab = 0.18 + r() * 0.08; for (const s of [1, -1]) caja(pos, nor, uv, idx, [a, y + 0.98 * alto + de + 0.18, zz + s * ab], [0.045, 0.2, 0.045], piel); continue; }
        caja(pos, nor, uv, idx, [a, y + 0.32 * alto + de + 0.18, zz], [0.13, 0.32 * alto, 0.2], U(col));
        cabeza(pos, nor, uv, idx, [a - 0.01, y + 0.78 * alto + de + 0.2, zz], 0.1, piel);
      }
      const n = pos.length / 3; return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: n > 65535 ? new Uint32Array(idx) : new Uint16Array(idx) };
    });
  };
  function esquinaGrada(sx, sz) {
    return MA.cache('grada_esq|' + sx + '|' + sz, () => {
      const P = perfilGrada(), C = [sx * 60, 0, sz * 41], nu = 24, pos = [], nor = [], uv = [], idx = [], dir = sx * sz > 0;
      for (let j = 0; j < P.length - 1; j++) { const [a0, y0] = P[j], [a1, y1] = P[j + 1], l = Math.hypot(a1 - a0, y1 - y0) || 1, na = -(y1 - y0) / l, ny = (a1 - a0) / l, b = pos.length / 3;
        for (let i = 0; i <= nu; i++) { const th = i / nu * PI / 2, q = [sx * Math.cos(th), 0, sz * Math.sin(th)];
          for (const [a, y] of [[a0, y0], [a1, y1]]) { pos.push(C[0] + q[0] * a, y, C[2] + q[2] * a); nor.push(q[0] * na, ny, q[2] * na); uv.push(i / nu, j / P.length); } }
        for (let i = 0; i < nu; i++) { const A = b + i * 2, B = A + 2, Cc = A + 1, D = A + 3; if (dir) idx.push(A, B, Cc, B, D, Cc); else idx.push(A, Cc, B, B, Cc, D); } }
      return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint32Array(idx) };
    });
  }
  /* Textura de vallas (LED): texto inventado, v = 0 abajo. */
  function texValla(txt, fondo, tinta) {
    return V.textura('valla|' + txt + '|' + fondo, 1024, 96, (x, W, H) => { x.fillStyle = fondo; x.fillRect(0, 0, W, H); x.translate(0, H); x.scale(1, -1);
      x.fillStyle = tinta; x.font = '700 58px Fredoka, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, W / 2, H * 0.54); });
  }
  /* Lados del estadio: frente (distancia del eje del campo al muro), largo, giro (local +X = hacia fuera). */
  F.lados = () => [
    { nombre: 'norte', d: 41, largo: 120, ry: PI / 2, centro: (a) => [0, 0, -(41 + a)] },
    { nombre: 'sur', d: 41, largo: 120, ry: -PI / 2, centro: (a) => [0, 0, 41 + a] },
    { nombre: 'este', d: 60, largo: 82, ry: 0, centro: (a) => [60 + a, 0, 0] },
    { nombre: 'oeste', d: 60, largo: 82, ry: PI, centro: (a) => [-(60 + a), 0, 0] }];
  /* o: { t, aficiones: {norte: 'local'|'visitante', ...}, colores: {local: [...], visitante: [...]}, celebra(lado, bloque, t) -> {salto, brazos 0..1},
          densidad, sinPublico, lejos (sin cabezas/brazos: menos vertices) } */
  MO.estadio = function (o = {}) {
    const t = o.t || 0, hijos = [], hormigon = { color: o.hormigon || '#8c8a86', esp: 0.05, dureza: 8, envolver: 0.3, borde: 0.1 };
    const COL = Object.assign({ local: ['#c8102e', '#c8102e', '#a50d26', '#f2f2f2'], visitante: ['#f2f2f2', '#1d3f8f', '#f2f2f2', '#2a54b0'], neutro: ['#2b2b33', '#3d3f4a', '#5a4b3c', '#1e2a3a', '#6b6f78', '#24252b'] }, o.colores || {});
    const pal = [], idxDe = (c) => { let i = pal.indexOf(c); if (i < 0) { pal.push(c); i = pal.length - 1; } return i; };
    const pieles = ['#e3b896', '#c99a74', '#a8764f', '#7a5034', '#eac3a4'].map(idxDe), neutros = COL.neutro.map(idxDe), loc = COL.local.map(idxDe), vis = COL.visitante.map(idxDe), asiento = idxDe(o.asiento || '#3a3f4a');
    const tex = paleta(pal.concat(Array(PALETA_N - pal.length).fill('#000000')));
    const AF = Object.assign({ norte: 'local', sur: 'local', este: 'local', oeste: 'visitante' }, o.aficiones || {});
    const geo = MA.extrusion(perfilGrada(), 1, 'perfil_grada');
    const FL = filas(), bloques = [[0, 8], [8, 15], [15, 22], [22, 31], [31, 40]];
    for (const L of F.lados()) {
      const g = [];
      g.push(V.nodo({ malla: geo, esc: [1, 1, L.largo], mat: hormigon, sinSombra: true }));
      // asientos: una banda de color en cada huella (cajas largas)
      g.push(V.nodo({ malla: MA.cache('asientos|' + L.largo, () => { const pos = [], nor = [], uv = [], idx = []; for (const f of FL) caja(pos, nor, uv, idx, [f.a + 0.42, f.y + 0.2, 0], [0.22, 0.2, L.largo / 2 - 0.2], (asiento + 0.5) / PALETA_N);
        return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint32Array(idx) }; }), mat: { color: '#ffffff', mapa: tex, esp: 0.1, dureza: 20 }, sinSombra: true }));
      // publico por bloques de filas y tramos (para animarlo por zonas)
      if (!o.sinPublico) {
        const tramos = 4, lt = L.largo / tramos, af = AF[L.nombre], prop = af === 'local' ? loc : vis;
        for (let b = 0; b < bloques.length; b++) for (let s = 0; s < tramos; s++) {
          const fl = FL.slice(bloques[b][0], bloques[b][1]), zc = -L.largo / 2 + (s + 0.5) * lt, cel = o.celebra ? o.celebra(L.nombre, b * tramos + s, t, af) : { salto: 0, brazos: 0 };
          const base = { largo: lt, filas: fl, densidad: o.densidad || 0.9, pieles, color: (r) => (r() < 0.72 ? prop[(r() * prop.length) | 0] : neutros[(r() * neutros.length) | 0]) };
          const sem = 'publico|' + L.nombre + '|' + b + '|' + s + '|' + lt, cl = sem + (cel.dePie ? '|pie' : ''); base.semilla = sem;
          g.push(V.nodo({ pos: [0, cel.salto || 0, zc], sinSombra: true, hijos: [
            V.nodo({ malla: F.publico(cl, Object.assign({ dePie: cel.dePie }, base)), mat: { color: '#ffffff', mapa: tex, esp: 0.08, dureza: 14, envolver: 0.35, borde: 0.15 }, sinSombra: true }),
            cel.brazos > 0.5 ? V.nodo({ malla: F.publico(cl + '|brazos', Object.assign({ brazos: true, dePie: cel.dePie }, base)), mat: { color: '#ffffff', mapa: tex, esp: 0.08, envolver: 0.35 }, sinSombra: true }) : null].filter(Boolean) }));
        }
      }
      // cubierta con focos en el borde
      const ancho = GR.fondo + 1 - 5;
      g.push(V.nodo({ malla: MA.caja(ancho, 0.9, L.largo, 0.05, 1), pos: [5 + ancho / 2, GR.techo, 0], rot: [0, 0, -0.06], mat: { color: '#5d6068', esp: 0.1, dureza: 10, borde: 0.1 }, sinSombra: true }));
      g.push(V.nodo({ malla: MA.caja(0.5, 0.25, L.largo - 2, 0.03, 1), pos: [5.4, GR.techo - 0.62, 0], mat: { color: '#fff6e0', emision: 1, esp: 0, borde: 0 }, sinSombra: true }));
      for (let i = 0; i < 6; i++) { const z = -L.largo / 2 + (i + 0.5) * L.largo / 6; g.push(V.nodo({ malla: MA.cilindro(0.35, 0.45, GR.techo, 12), pos: [GR.fondo + 0.5, GR.techo / 2, z], mat: hormigon, sinSombra: true })); }
      const [cx, , cz] = L.centro(0); hijos.push(V.nodo({ nombre: 'grada_' + L.nombre, pos: [cx, 0, cz], rot: [0, L.ry, 0], hijos: g }));
    }
    // esquinas: un cuarto de vuelta del mismo perfil (gradas curvas con publico y cubierta)
    for (const sx of [1, -1]) for (const sz of [1, -1]) {
      const nombre = 'esq' + (sx > 0 ? 'E' : 'O') + (sz > 0 ? 'S' : 'N'), C = [sx * 60, 0, sz * 41], d = (th) => [sx * Math.cos(th), 0, sz * Math.sin(th)], g = [];
      g.push(V.nodo({ malla: esquinaGrada(sx, sz), mat: hormigon, sinSombra: true }));
      const af = AF[nombre] || 'local', prop = af === 'local' ? loc : vis;
      for (let b = 0; b < bloques.length; b++) {
        const lug = []; for (const f of FL.slice(bloques[b][0], bloques[b][1])) { const rr = f.a + 0.42, n = Math.floor(rr * PI / 2 / 0.55); for (let i = 0; i < n; i++) { const q = d((i + 0.5) / n * PI / 2); lug.push([C[0] + q[0] * rr, f.y, C[2] + q[2] * rr]); } }
        const cel = o.celebra ? o.celebra(nombre, b, t, af) : { salto: 0, brazos: 0 }, sem = 'publico|' + nombre + '|' + b, cl = sem + (cel.dePie ? '|pie' : '');
        const base = { lugares: lug, densidad: o.densidad || 0.9, pieles, semilla: sem, color: (r) => (r() < 0.72 ? prop[(r() * prop.length) | 0] : neutros[(r() * neutros.length) | 0]) };
        if (!o.sinPublico) g.push(V.nodo({ pos: [0, cel.salto || 0, 0], sinSombra: true, hijos: [
          V.nodo({ malla: F.publico(cl, Object.assign({ dePie: cel.dePie }, base)), mat: { color: '#ffffff', mapa: tex, esp: 0.08, dureza: 14, envolver: 0.35, borde: 0.15 }, sinSombra: true }),
          cel.brazos > 0.5 ? V.nodo({ malla: F.publico(cl + '|brazos', Object.assign({ brazos: true, dePie: cel.dePie }, base)), mat: { color: '#ffffff', mapa: tex, esp: 0.08, envolver: 0.35 }, sinSombra: true }) : null].filter(Boolean) }));
      }
      g.push(V.nodo({ malla: MA.cache('asientos_esq|' + sx + sz, () => { const pos = [], nor = [], uv = [], idx = []; for (const f of FL) { const rr = f.a + 0.42, n = Math.floor(rr * PI / 2 / 0.5);
        for (let i = 0; i < n; i++) { const q = d((i + 0.5) / n * PI / 2); caja(pos, nor, uv, idx, [C[0] + q[0] * rr, f.y + 0.2, C[2] + q[2] * rr], [0.22, 0.2, 0.22], (asiento + 0.5) / PALETA_N); } }
        return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint32Array(idx) }; }), mat: { color: '#ffffff', mapa: tex, esp: 0.1, dureza: 20 }, sinSombra: true }));
      g.push(V.nodo({ malla: MA.parametrica(16, 2, (u, v) => { const q = d(u * PI / 2), rr = 5 + v * (GR.fondo + 1 - 5); return [C[0] + q[0] * rr, GR.techo + 0.45, C[2] + q[2] * rr]; }, { clave: 'techo_esq|' + sx + sz }),
        mat: { color: '#5d6068', esp: 0.1, dureza: 10, borde: 0.1, dobleCara: true }, sinSombra: true }));
      const arco = []; for (let i = 0; i <= 16; i++) { const q = d(i / 16 * PI / 2); arco.push([C[0] + q[0] * 5.4, GR.techo - 0.62, C[2] + q[2] * 5.4]); }
      g.push(V.nodo({ malla: MA.tubo(arco, 0.15, 6, { clave: 'luz_esq|' + sx + sz }), mat: { color: '#fff6e0', emision: 1, esp: 0, borde: 0 }, sinSombra: true }));
      for (const th of [PI / 8, PI / 4, 3 * PI / 8]) { const q = d(th); g.push(V.nodo({ malla: MA.cilindro(0.35, 0.45, GR.techo, 12), pos: [C[0] + q[0] * (GR.fondo + 0.5), GR.techo / 2, C[2] + q[2] * (GR.fondo + 0.5)], mat: hormigon, sinSombra: true })); }
      hijos.push(V.nodo({ nombre: 'grada_' + nombre, hijos: g }));
    }
    // vallas publicitarias (textos inventados)
    const textos = o.vallas || ['SIGUE A @RANDONAUTICO', 'FÚTBOL EN 3D', 'TODO POR CÓDIGO', 'RECREACIÓN 3D'], fondos = ['#0e2a66', '#7a0f1f', '#103f2a', '#2c2c34'];
    let n = 0; const valla = (x, z, ry, w) => { const i = n++ % textos.length;
      hijos.push(V.nodo({ malla: MA.caja(w, 0.9, 0.12, 0.02, 1), pos: [x, 0.45, z], rot: [0, ry, 0], mat: { color: '#ffffff', mapa: texValla(textos[i], fondos[i], '#ffffff'), emision: 0.45, esp: 0.3, dureza: 40, borde: 0.1 }, sinSombra: true })); };
    for (let i = 0; i < 10; i++) { const x = -50 + i * 10 + 5; valla(x, -38.5, 0, 9.8); valla(x, 38.5, PI, 9.8); }
    for (let i = 0; i < 6; i++) { const z = -30 + i * 10 + 5; if (Math.abs(z) < 6) continue; valla(57, z, -PI / 2, 9.8); valla(-57, z, PI / 2, 9.8); }
    return V.nodo({ nombre: 'estadio', hijos });
  };
  /* Puntos de los focos de la cubierta (para pintar halos 2D despues de V.render). */
  F.focos = function () { const o = []; for (const L of F.lados()) { const ry = L.ry, c = Math.cos(ry), s = Math.sin(ry), [cx, , cz] = L.centro(0);
    for (let i = 0; i < 9; i++) { const zl = -L.largo / 2 + (i + 0.5) * L.largo / 9, xl = 5.4; o.push([cx + c * xl + s * zl, GR.techo - 0.7, cz - s * xl + c * zl]); } }
    for (const sx of [1, -1]) for (const sz of [1, -1]) for (const th of [PI / 6, PI / 3]) o.push([sx * (60 + Math.cos(th) * 5.4), GR.techo - 0.7, sz * (41 + Math.sin(th) * 5.4)]); return o; };
  F.halos = function (esc, cam, o = {}) {
    for (const p of F.focos()) { const q = V.proyectar(esc, cam, p); if (!q.delante || q.x < -200 || q.x > esc.W + 200 || q.y < -200 || q.y > esc.H + 200) continue;
      const r = Math.max(10, Math.min(160, V.escalaPantalla(esc, cam, p, 3.2))), x = esc.ctx; x.save(); x.globalAlpha *= o.a == null ? 0.7 : o.a;
      esc.pegar(esc.cache.halo(Math.round(r), o.color || '#fff4dc', 0.25), q.x, q.y, 1); x.restore(); }
  };
  F.ambienteNoche = { base: 'noche', luz: { dir: [0.28, 0.9, 0.34], color: '#fbf7ee', intensidad: 1.35 }, cielo: '#55648c', suelo: '#24321e', ambiente: 0.62, borde: { color: '#dfe8ff', intensidad: 0.28 } };

  // ---------------------------------------------------------------- jugada
  /* def: { balon: [x, z] (posicion inicial), toques: [{t, de, tipo: 'raso'|'alto'|'tiro'|'cabezazo', a: [x,z] | [x,y,z], vuelo}],
            gol: true (el ultimo toque entra en la porteria +X: el balon empuja la red y cae), jugadores: { id: { equipo, dorsal, portero, ruta: [[t,x,z],...], extra(t, e) } } }
     El jugador que toca se coloca solo junto al balon en el instante del toque (se inserta en su ruta). */
  F.jugada = function (def) {
    const R = MED.balonR, g = 9.8, T = def.toques.slice().sort((a, b) => a.t - b.t), seg = [];
    let p0 = [def.balon[0], R, def.balon[1]];
    for (let i = 0; i < T.length; i++) {
      const k = T[i], a = k.a.length === 2 ? [k.a[0], R, k.a[1]] : k.a.slice(), aire = k.tipo !== 'raso';
      seg.push({ t0: k.t, t1: k.t + k.vuelo, p0: p0.slice(), p1: a, aire, k });
      p0 = a;
    }
    const ult = seg[seg.length - 1];
    // giro acumulado del balon: en cada tramo gira alrededor de cruz(arriba, direccion) lo recorrido / radio
    const giro0 = [V.m4.id()]; for (const s of seg) { const d = v3.res(s.p1, s.p0), h = Math.hypot(d[0], d[2]), eje = h > 1e-6 ? v3.norm([d[2], 0, -d[0]]) : [1, 0, 0];
      s.eje = eje; s.dist = v3.lon(d); giro0.push(V.m4.mul(F.rotEje(eje, s.dist / R * (s.aire ? 0.6 : 1)), giro0[giro0.length - 1])); }
    function enTramo(s, t) { const u = c01((t - s.t0) / (s.t1 - s.t0)), dur = s.t1 - s.t0;
      if (!s.aire) { const e = 1 - Math.pow(1 - u, 1.7); return { p: v3.mezcla(s.p0, s.p1, e), e }; }
      const k = u * dur, vy = (s.p1[1] - s.p0[1]) / dur + 0.5 * g * dur; return { p: [s.p0[0] + (s.p1[0] - s.p0[0]) * u, s.p0[1] + vy * k - 0.5 * g * k * k, s.p0[2] + (s.p1[2] - s.p0[2]) * u], e: u }; }
    function balon(t) {
      if (t <= seg[0].t0) return { p: seg[0].p0.slice(), giro: giro0[0] };
      for (let i = 0; i < seg.length; i++) { const s = seg[i], sig = seg[i + 1];
        if (t <= s.t1 || (sig && t < sig.t0)) { const q = enTramo(s, Math.min(t, s.t1)); return { p: q.p, giro: V.m4.mul(F.rotEje(s.eje, s.dist * q.e / R * (s.aire ? 0.6 : 1)), giro0[i]) }; } }
      // despues del ultimo toque
      const k = t - ult.t1, gi = giro0[giro0.length - 1];
      if (!def.gol) return { p: ult.p1.slice(), giro: gi };
      const dur = ult.t1 - ult.t0, vy = (ult.p1[1] - ult.p0[1]) / dur + 0.5 * g * dur - g * dur, vel = [(ult.p1[0] - ult.p0[0]) / dur, vy, (ult.p1[2] - ult.p0[2]) / dur];
      const fr = 0.12, avance = 1 - Math.exp(-k / fr), hz = v3.por([vel[0], 0, vel[2]], fr * avance);     // la red frena el balon
      const tc = 0.25, y = k < tc ? ult.p1[1] + vel[1] * fr * avance : (() => { const q = k - tc, y0 = ult.p1[1] + vel[1] * fr * (1 - Math.exp(-tc / fr)), tf = Math.sqrt(2 * Math.max(0, y0 - R) / g);
        if (q < tf) return y0 - 0.5 * g * q * q; const v1 = g * tf * 0.45, q2 = q - tf, t2 = 2 * v1 / g; return q2 < t2 ? R + v1 * q2 - 0.5 * g * q2 * q2 : R; })();
      // dentro de la porteria: no atraviesa la red (fondo segun la altura, mas lo que cede la red) ni los laterales
      const yy = Math.max(R, y), sx = Math.sign(ult.p1[0]) || 1, xs = sx * (ult.p1[0] + hz[0]), lim = MX + F.fondoRed(yy) + 0.3 - R;
      return { p: [sx * Math.min(xs, lim), yy, Math.max(-PA + R + 0.08, Math.min(PA - R - 0.08, ult.p1[2] + hz[2]))], giro: V.m4.mul(F.rotEje(ult.eje, k * 6), gi) };
    }
    // rutas: insertar la posicion de cada toque
    const J = {}; for (const id in def.jugadores) { const j = def.jugadores[id]; J[id] = Object.assign({}, j, { ruta: j.ruta.map(r => r.slice()) }); }
    for (const s of seg) { const k = s.k, j = J[k.de]; if (!j) throw new Error('jugada: no hay jugador ' + k.de);
      const d = v3.norm([s.p1[0] - s.p0[0], 0, s.p1[2] - s.p0[2]]), lado = [-d[2], 0, d[0]], cab = k.tipo === 'cabezazo';
      const sl = k.pie === 'i' ? -1 : 1, pos = cab ? [s.p0[0] - d[0] * 0.12, s.p0[2] - d[2] * 0.12] : [s.p0[0] - d[0] * 0.32 - lado[0] * 0.1 * sl, s.p0[2] - d[2] * 0.32 - lado[2] * 0.1 * sl];
      j.ruta = j.ruta.filter(r => Math.abs(r[0] - k.t) > 0.08); j.ruta.push([k.t, pos[0], pos[1]]); j.ruta.sort((a, b) => a[0] - b[0]);
      (j.toques = j.toques || []).push({ t: k.t, tipo: k.tipo, dir: d, alto: cab ? s.p0[1] : 0, pie: k.pie }); }
    function ruta(j, t) { const r = j.ruta; if (t <= r[0][0]) return { x: r[0][1], z: r[0][2], v: [0, 0], s: 0 };
      let s = 0; for (let i = 0; i < r.length - 1; i++) { const a = r[i], b = r[i + 1], l = Math.hypot(b[1] - a[1], b[2] - a[2]), dt = b[0] - a[0];
        if (t <= b[0]) { const u = (t - a[0]) / dt; return { x: a[1] + (b[1] - a[1]) * u, z: a[2] + (b[2] - a[2]) * u, v: [(b[1] - a[1]) / dt, (b[2] - a[2]) / dt], s: s + l * u }; } s += l; }
      const z = r[r.length - 1]; return { x: z[1], z: z[2], v: [0, 0], s }; }
    function jugador(id, t) {
      const j = J[id], q = ruta(j, t), a = ruta(j, t - 0.18), b = ruta(j, t + 0.18), vx = (b.x - a.x) / 0.36, vz = (b.z - a.z) / 0.36, v = Math.hypot(vx, vz);
      const bp = balon(t).p, haciaBalon = Math.atan2(-(bp[2] - q.z), bp[0] - q.x);
      let dir = v > 0.6 ? Math.atan2(-vz, vx) : haciaBalon; if (v > 0.6 && v < 1.4) { const k = (v - 0.6) / 0.8, d0 = haciaBalon; let dd = dir - d0; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); dir = d0 + dd * k; }
      const amp = Math.max(0.3, Math.min(1, v / 8)), fase = q.s / (1.6 + 3.2 * amp), quieto = j.portero ? V.poses.portero : V.pose.mezclar('de_pie', { tronco: 6, rodilla_d: 10, rodilla_i: 10, cadera_d: 6, cadera_i: 6 }, 0.6);
      let pose = V.pose.mezclar(quieto, V.pose.correr(fase, amp), c01((v - 0.4) / 1.4)), y = 0, rx = 0;
      for (const k of j.toques || []) {
        const chute = (f) => (k.pie === 'i' ? V.pose.espejo(V.pose.chutar(f)) : V.pose.chutar(f));
        if (k.tipo === 'conduccion') { const w = c01(1 - Math.abs(t - k.t) / 0.24); if (w > 0) pose = V.pose.mezclar(pose, chute(0.5 + (t - k.t) / 0.6), 0.42 * suave(w)); continue; }
        const w = c01(1 - Math.abs(t - k.t) / 0.5); if (w <= 0) continue; const f = 0.5 + (t - k.t) / 0.9;
        if (k.tipo === 'cabezazo') { pose = V.pose.mezclar(pose, V.pose.cabezazo(f), suave(w * 1.6)); const fs = (t - (k.t - 0.42)) / 0.84; if (fs > 0 && fs < 1) y = Math.max(y, Math.sin(PI * fs) * Math.max(0, k.alto - 1.88)); }
        else pose = V.pose.mezclar(pose, chute(f), suave(w * 1.6));
        if (Math.abs(t - k.t) < 0.3) dir = Math.atan2(-k.dir[2], k.dir[0]); }
      const e = { id, x: q.x, z: q.z, y, dir, rx, pose, v, j, apoyo: true };
      if (j.extra) j.extra(t, e);
      return e;
    }
    F.ultimaJugada = { seg, J };
    return { seg, J, balon, jugador, ids: Object.keys(J),
      nodo(id, t, kit) { const e = jugador(id, t), j = J[id];
        return MO.futbolista({ kit, dorsal: j.dorsal, portero: j.portero, pose: e.pose, pos: e.apoyo ? [e.x, 0, e.z] : [e.x, e.y, e.z], rot: [e.rx, e.dir, 0], apoyo: e.apoyo ? 'pies' : null, suelo: e.y }); },
      /* Comprobaciones: choques entre jugadores, balon bajo el cesped, pie lejos del balon en un toque, velocidades imposibles. */
      revisar(t0 = 0, t1 = 10, paso = 0.1) { const avisos = [];
        for (let t = t0; t <= t1 + 1e-9; t += paso) { const E = Object.keys(J).map(id => jugador(id, t)), b = balon(t).p;
          if (b[1] < R - 1e-6) avisos.push(`t=${t.toFixed(1)} balon bajo el cesped`);
          for (let i = 0; i < E.length; i++) { if (E[i].v > 10.5) avisos.push(`t=${t.toFixed(1)} ${E[i].id} va a ${E[i].v.toFixed(1)} m/s`);
            for (let k = i + 1; k < E.length; k++) { const d = Math.hypot(E[i].x - E[k].x, E[i].z - E[k].z); if (d < 0.6) avisos.push(`t=${t.toFixed(1)} ${E[i].id} y ${E[k].id} se tocan (${d.toFixed(2)} m)`); } } }
        for (const s of seg) { const e = jugador(s.k.de, s.k.t), d = Math.hypot(e.x - s.p0[0], e.z - s.p0[2]); if (d > 0.45) avisos.push(`toque t=${s.k.t}: ${s.k.de} a ${d.toFixed(2)} m del balon`); }
        return [...new Set(avisos)]; } };
  };

  // ---------------------------------------------------------------- planos de camara (solo dependen de t)
  /* Media del balon en una ventana (seguir con suavidad sin guardar estado). */
  F.balonSuave = (J, t, ventana = 0.5, n = 9) => { let s = [0, 0, 0]; for (let i = 0; i < n; i++) s = v3.sum(s, J.balon(t - ventana * i / (n - 1)).p); return v3.por(s, 1 / n); };
  F.planos = {
    general: (J, t, o = {}) => { const b = F.balonSuave(J, t, 0.8); return V.camara({ pos: [b[0] * 0.75, o.alto || 19, o.z || 62], mira: [b[0], 0.5, b[2] * 0.6], fov: o.fov || 30, cerca: 0.5, lejos: 900 }); },
    cenital: (J, t, o = {}) => { const b = F.balonSuave(J, t, 0.8), c = o.centro || [b[0], 0, b[2]]; return V.camara({ pos: [c[0], o.alto || 75, c[2] + 0.01], mira: c, arriba: [1, 0, 0], fov: o.fov || 38, cerca: 1, lejos: 900 }); },
    raso: (J, t, o = {}) => { const b = F.balonSuave(J, t, 0.3); return V.camara({ pos: o.pos || [b[0] - 6, 0.45, b[2] + 4], mira: [b[0], 0.6, b[2]], fov: o.fov || 50, cerca: 0.05, lejos: 900 }); },
    porteria: (J, t, o = {}) => { const b = F.balonSuave(J, t, 0.25); return V.camara({ pos: o.pos || [59, 3.0, -1.2], mira: v3.mezcla([44, 1.2, 0], b, 0.45), fov: o.fov || 42, cerca: 0.1, lejos: 900 }); },
    seguimiento: (J, t, o = {}) => { const e = J.jugador(o.id, t), d = [Math.cos(e.dir), 0, -Math.sin(e.dir)], p = [e.x, 0, e.z], dist = o.dist || 7;
      return V.camara({ pos: v3.sum(v3.sum(p, v3.por(d, -dist)), [o.lado || 0, o.alto || 2.6, 0]), mira: v3.sum(v3.sum(p, v3.por(d, o.delante || 9)), [0, 1, 0]), fov: o.fov || 46, cerca: 0.1, lejos: 900 }); },
    spidercam: (J, t, o = {}) => { const b = F.balonSuave(J, t, 0.6); return V.orbita([b[0], 1, b[2]], o.dist || 20, (o.rumbo0 || 0) + t * (o.giro || 0.12), o.elev || 0.75, { fov: o.fov || 40, cerca: 0.2, lejos: 900 }); },
    grada: (J, t, o = {}) => { const e = J.jugador(o.id, t); return V.camara({ pos: o.pos || [e.x - 9, 1.5, e.z + 9], mira: v3.mezcla([e.x, 1.3, e.z], o.fondo || [e.x, 6, -60], o.k == null ? 0.25 : o.k), fov: o.fov || 42, cerca: 0.1, lejos: 900 }); }
  };
})(window.VE = window.VE || {});
