/* PERSONAJE del estilo RECORTES (requiere recortes.js y recortes_figuras.js).
   Chica de frente con proporciones realistas (~6,7 cabezas, alto 1000 px a escala 1, pies en el origen), brazos
   articulados (cinematica inversa de 2 huesos), manos con cinco dedos que SUJETAN los objetos, sombreado suave
   (luz desde la izquierda) y expresiones.

   R.chica(x, cx, pies_y, escala, e)
     e.turbante (bool) · e.pelo 0..1 (suelto; crece hacia abajo al caer) · e.crema 0..1 · e.colorete 0..1 · e.rimel 0..1 · e.labial 0..1
     e.horquillas 0..2 · e.cara = { ojos:[izq,der] apertura 0..1, feliz (ojos cerrados en arco), mirada:[dx,dy] -1..1,
                                    ceja:{alto, pena} -1..1, boca: 'neutra'|'sonrisa'|'risa'|'o'|'bostezo'|'beso'|'espuma' }
     e.brazos = { izq: spec, der: spec }   (izq = lado izquierdo de la PANTALLA)
       spec = null (reposo) | { herr: nombre de R.HERR, punta:[x,y] local, ang: direccion empuñadura->punta (rad) }
            | { toca:[x,y], ang, pose:'indice' } (la yema del indice en ese punto) | { mano:[x,y], ang, pose:'relajada'|'abierta'|'agarre' }
   Coordenadas locales utiles: ojos (±27,-898), mejillas (±34,-866), boca (0,-843), sien (±62,-905), pelo lateral (±80,-760). */
(function (VE) {
  const R = VE.recorte, O = R.obj;
  const PIEL = '#f7d2bb', PIEL_S = '#e7ae97', PIEL_L = '#fde6d8', LINEA_SUAVE = '#b98471';
  const PELO = '#7b4a2c', PELO_S = '#5c3520', PELO_L = '#a8714a';
  const BATA = '#fbe4e8', BATA_S = '#efc4cd', BATA_B = '#f3c9d2';
  const L1 = 168, L2 = 150, HOMBRO = [108, -770];

  /* Herramientas: dibujo y puntos de empuñadura y de trabajo en SU sistema local. */
  R.HERR = {
    brocha:         { fn: (x) => O.brocha(x),         grip: [-52, 0], tip: [72, 0] },
    rimel:          { fn: (x) => O.rimel(x),          grip: [-46, 0], tip: [58, 0] },
    pintalabios:    { fn: (x) => O.pintalabios(x),    grip: [0, 32],  tip: [0, -54] },
    cepilloDientes: { fn: (x) => O.cepilloDientes(x), grip: [-46, 0], tip: [44, -16] },
    cepilloPelo:    { fn: (x) => O.cepilloPelo(x),    grip: [0, 72],  tip: [0, -38] },
    crema:          { fn: (x) => O.crema(x),          grip: [0, 26],  tip: [0, -40] },
    colorete:       { fn: (x) => O.colorete(x),       grip: [0, 18],  tip: [0, -40] }
  };

  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (v) => Math.hypot(v[0], v[1]), nor = (v) => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; }, perp = (v) => [-v[1], v[0]];

  /* Dedo: polilinea con grosor (contorno cerrado con punta redondeada, base abierta bajo la palma). */
  function dedo(pts, r) {
    const L = [], Rr = [];
    for (let i = 0; i < pts.length; i++) {
      const d = nor(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)])), n = perp(d), ri = r * (1 - 0.12 * i / (pts.length - 1));
      L.push(add(pts[i], mul(n, ri))); Rr.push(add(pts[i], mul(n, -ri)));
    }
    const t = pts[pts.length - 1], d = nor(sub(t, pts[pts.length - 2])), n = perp(d), rt = r * .88;
    const tapa = [add(add(t, mul(n, rt * .7)), mul(d, rt * .7)), add(t, mul(d, rt)), add(add(t, mul(n, -rt * .7)), mul(d, rt * .7))];
    return L.concat(tapa, Rr.reverse());
  }
  function curvo(base, ang, largo, curva) {      // dedo de 3 puntos que se curva 'curva' rad en la mitad final
    const a = [Math.cos(ang), Math.sin(ang)], m = add(base, mul(a, largo * .55)), b = [Math.cos(ang + curva), Math.sin(ang + curva)];
    return [base, m, add(m, mul(b, largo * .45))];
  }

  /* MANO en su marco: muneca en el origen, +x hacia los nudillos, +y lado del pulgar (m = ±1 espeja). */
  function mano(x, W, ang, m, pose, herr) {
    x.save(); x.translate(W[0], W[1]); x.rotate(ang); x.scale(1, m);
    const palma = [[0, -13], [18, -16], [38, -16], [48, -11], [51, 0], [48, 12], [34, 17], [14, 17], [0, 13]];
    const fs = { j: .45, ancho: 2.2 }, piel = Object.assign({ relleno: PIEL }, fs);
    const ybase = [-11, -3.8, 3.4, 10.2], rad = [4.4, 4.7, 4.4, 3.8];
    const una = (P) => { const t = P[P.length - 1], p = P[P.length - 2], d = nor(sub(t, p)); R.punto(x, t[0] - d[0] * 2.5, t[1] - d[1] * 2.5, 2.4, '#fbe7de'); };
    const pulgar = (pts) => R.forma(x, dedo(pts, 5.2), piel);
    if (pose === 'agarre') {
      R.forma(x, palma, piel);
      if (herr) herr();                                                    // el objeto pasa entre la palma y los dedos
      for (let i = 0; i < 4; i++) {
        const y = ybase[i] * 1.05, fin = 58 - Math.abs(i - 1.3) * 2.6;
        R.forma(x, dedo([[38, y], [48, y], [fin, y + 1.5]], rad[i]), piel);
        R.linea(x, [[fin - 6, y - rad[i] * .6], [fin - 3, y + rad[i] * .6]], { trazo: LINEA_SUAVE, ancho: 1.3, j: .2 });
      }
      pulgar([[12, 13], [30, 16], [44, 9]]);
    } else {
      const indice = pose === 'indice', abierta = pose === 'abierta';
      const angs = abierta ? [-0.34, -0.11, 0.11, 0.32] : [-0.06, 0, 0.05, 0.1];
      const largos = [30, 34, 32, 25], curva = abierta ? 0.05 : 0.45;
      for (let i = 3; i >= 0; i--) {
        const base = [45 - Math.abs(i - 1.4) * 1.5, ybase[i]];
        let P;
        if (indice && i > 0) P = [[40, ybase[i]], [50, ybase[i]], [55, ybase[i] + 3]];          // dedos recogidos
        else P = curvo(base, angs[i], largos[i] + (indice ? 4 : 0), indice ? 0.04 : curva);
        R.forma(x, dedo(P, rad[i]), piel); if (!(indice && i > 0)) una(P);
      }
      R.forma(x, palma, piel);
      R.linea(x, [[30, -6], [40, -2]], { trazo: LINEA_SUAVE, ancho: 1.3, j: .2 });
      if (abierta) pulgar([[10, 13], [26, 26], [34, 38]]);
      else if (indice) pulgar([[12, 13], [32, 15], [45, 8]]);
      else pulgar([[10, 13], [26, 21], [36, 24]]);
      if (herr) herr();
    }
    x.restore();
  }

  /* BRAZO: manga de la bata + antebrazo + mano; devuelve nada. side = -1 (izq. de pantalla) | 1. */
  function brazo(x, side, spec) {
    const S = [HOMBRO[0] * side, HOMBRO[1]];
    let W, ang, m, pose = 'relajada', dibHerr = null;
    if (spec && spec.herr) {
      const H = R.HERR[spec.herr], v = sub(H.tip, H.grip), r = spec.ang - Math.atan2(v[1], v[0]);
      const Oo = sub(spec.punta, rot(H.tip, r)), G = add(Oo, rot(H.grip, r));
      const c1 = spec.ang + Math.PI / 2, c2 = spec.ang - Math.PI / 2;
      const pts = (a) => Math.sin(a) - (Math.abs(Math.sin(c1) - Math.sin(c2)) < 1e-3 ? 0.01 * Math.cos(a) * -side : 0);
      ang = pts(c1) < pts(c2) ? c1 : c2;
      W = sub(G, mul([Math.cos(ang), Math.sin(ang)], 46));
      const thumb = [-Math.sin(ang), Math.cos(ang)];
      m = (thumb[0] * Math.cos(spec.ang) + thumb[1] * Math.sin(spec.ang)) >= 0 ? 1 : -1;
      pose = 'agarre';
      dibHerr = () => { x.save(); x.scale(1, m); x.rotate(-ang); x.translate(-W[0], -W[1]); x.translate(Oo[0], Oo[1]); x.rotate(r); H.fn(x); x.restore(); };
    } else if (spec && spec.toca) {
      ang = spec.ang; m = spec.m || side; pose = 'indice';
      W = sub(spec.toca, rot([88, -11 * m], ang));
    } else if (spec && spec.mano) {
      W = spec.mano; ang = spec.ang; m = spec.m || side; pose = spec.pose || 'relajada';
    } else { W = [side * 128, -468]; ang = Math.PI / 2 - side * 0.12; m = side; }
    // cinematica inversa
    let d = sub(W, S), dl = len(d);
    const dmax = L1 + L2 - 2, dmin = Math.abs(L1 - L2) + 30;
    if (dl > dmax) { W = add(S, mul(nor(d), dmax)); d = sub(W, S); dl = dmax; }
    if (dl < dmin) { W = add(S, mul(nor(d), dmin)); d = sub(W, S); dl = dmin; }
    const a = Math.atan2(d[1], d[0]), b = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + dl * dl - L2 * L2) / (2 * L1 * dl))));
    const E1 = add(S, [L1 * Math.cos(a + b), L1 * Math.sin(a + b)]), E2 = add(S, [L1 * Math.cos(a - b), L1 * Math.sin(a - b)]);
    const sc = (P) => P[1] + side * P[0] * 0.8, E = sc(E1) > sc(E2) ? E1 : E2;   // codo hacia abajo y hacia fuera (natural)
    const dA = nor(sub(E, S)), dB = nor(sub(W, E)), nA = perp(dA), nB = perp(dB), nE = nor(add(nA, nB));
    const C = add(E, mul(sub(W, E), 0.6));
    // antebrazo
    R.forma(x, [add(C, mul(nB, 14)), add(W, mul(nB, 11)), add(W, mul(nB, -11)), add(C, mul(nB, -14))], { relleno: PIEL, j: .5 });
    mano(x, W, ang, m, pose, dibHerr);
    // manga
    const manga = [add(S, mul(nA, 22)), add(E, mul(nE, 19)), add(C, mul(nB, 24)), add(C, mul(nB, -24)), add(E, mul(nE, -19)), add(S, mul(nA, -22))];
    R.forma(x, manga, { relleno: (c) => { c.fillStyle = BATA; c.fillRect(-400, -1100, 800, 1000);
      c.fillStyle = BATA_S; c.beginPath(); const s2 = side; const q = [add(S, mul(nA, 22 * s2)), add(E, mul(nE, 19 * s2)), add(C, mul(nB, 24 * s2)), add(C, mul(nB, 10 * s2)), add(E, mul(nE, 7 * s2)), add(S, mul(nA, 7 * s2))];
      c.moveTo(q[0][0], q[0][1]); q.forEach(p => c.lineTo(p[0], p[1])); c.fill(); } });
    R.linea(x, [add(sub(C, mul(dB, 8)), mul(nB, 23)), add(sub(C, mul(dB, 8)), mul(nB, -23))], { ancho: 2, trazo: '#c98e9c' });
    R.linea(x, [add(E, mul(nE, -10)), add(add(E, mul(dA, -18)), mul(nE, -16))], { ancho: 1.6, trazo: '#d7a3ae', j: .3 });   // pliegue del codo
  }

  /* ---------------- CARA ---------------- */
  function ojo(x, sg, o, feliz, mir, rim) {
    const cx = sg * 27, cy = -898, X = (v) => sg * v;
    const pest = (base, n, L, abajo) => { for (let i = 0; i < n; i++) {
      const u = 0.5 + 0.5 * i / Math.max(1, n - 1), p = base(u), l = L * (0.7 + .3 * u);
      R.linea(x, [p, [p[0] + X(l * .35 * (.4 + u)), p[1] + (abajo ? l * .5 : -l * .55)], [p[0] + X(l * (.5 + .5 * u)), p[1] + (abajo ? l * .7 : -l * .9)]], { ancho: rim > .5 ? 2.4 : 1.7, j: .25 }); } };
    if (o < 0.12) {
      if (feliz) { R.linea(x, [[X(9), cy + 1], [X(18), cy - 5], [X(28), cy - 7], [X(38), cy - 5], [X(46), cy]], { ancho: 3.2, j: .4 });
        pest((u) => [X(9 + 37 * u), cy - 7 * Math.sin(Math.PI * u)], rim > .5 ? 4 : 2, rim > .5 ? 10 : 6, false); }
      else { R.linea(x, [[X(9), cy - 1], [X(20), cy + 3], [X(30), cy + 4], [X(40), cy + 2], [X(46), cy - 1]], { ancho: 3.2, j: .4 });
        pest((u) => [X(9 + 37 * u), cy + 4 * Math.sin(Math.PI * u)], rim > .5 ? 5 : 3, rim > .5 ? 10 : 6, true); }
      R.linea(x, [[X(12), cy - 11], [X(28), cy - 15], [X(44), cy - 10]], { trazo: '#d3a08b', ancho: 1.6, j: .3 });
      return;
    }
    const top = [[X(9), cy + 1], [X(17), cy - 7 * o], [X(28), cy - 9.5 * o], [X(39), cy - 7.5 * o], [X(46), cy - 1]];
    const bot = [[X(36), cy + 5.5 * o], [X(20), cy + 5 * o]];
    const ix = cx + mir[0] * 5, iy = cy - 1 + mir[1] * 2.5;
    R.forma(x, top.concat(bot), { relleno: (c) => {
      c.fillStyle = '#fbf8f6'; c.fillRect(-60, cy - 14, 120, 26);
      R.punto(c, ix, iy, 8.6, '#4a2a1a'); R.punto(c, ix, iy, 7.2, '#7d4c2e'); R.punto(c, ix - 1, iy + 2, 4.5, '#9a6844');
      R.punto(c, ix, iy, 3.9, '#1a0f0a'); R.punto(c, ix + 2.6, iy - 3.2, 2.3, '#fff'); R.punto(c, ix - 3, iy + 2.6, 1.1, '#fff');
      c.fillStyle = 'rgba(120,70,60,0.18)'; c.fillRect(-60, cy - 14, 120, 5); }, ancho: 1.4, trazo: '#9b6b5e', j: .3 });
    R.linea(x, top.concat([[X(51), cy - 4]]), { ancho: 3.4, j: .35 });                                      // linea del parpado
    R.linea(x, [[X(22), cy + 5.2 * o], [X(36), cy + 5.6 * o], [X(45), cy + 1]], { trazo: '#a5776a', ancho: 1.3, j: .25 });
    if (o > .5) R.linea(x, [[X(12), cy - 9 - 6 * o], [X(28), cy - 13 - 6 * o], [X(44), cy - 8 - 5 * o]], { trazo: '#d3a08b', ancho: 1.6, j: .3 });
    pest((u) => [X(9 + 37 * u), cy - 9.5 * o * Math.sin(Math.PI * Math.min(u, .92)) - 1], rim > .5 ? 6 : 3, rim > .5 ? 12 : 7, false);
  }
  function ceja(x, sg, alto, pena) {
    const by = -921 - alto * 7, X = (v) => sg * v, pi = pena * 6;
    R.forma(x, [[X(9), by + 1 - pi], [X(20), by - 2.5 - pi * .6], [X(33), by - 4.5], [X(45), by - 1.5], [X(51), by + 3], [X(44), by + 0.5], [X(32), by - 1.5], [X(20), by + 1 - pi * .6], [X(10), by + 3.5 - pi]],
      { relleno: '#7a4a2e', trazo: '#6a3c24', ancho: .8, j: .3 });
  }
  function boca(x, tipo, lab) {
    const y = -843, borde = { ancho: 1.5, trazo: '#9e5157', j: .3 }, f = (o) => Object.assign({ relleno: lab }, borde, o || {});
    const OSC = '#5a1e26';
    if (tipo === 'o' || tipo === 'bostezo' || tipo === 'espuma') {
      const rx = tipo === 'o' ? 10 : 13, ry = tipo === 'o' ? 11 : tipo === 'bostezo' ? 18 : 8, dy = tipo === 'bostezo' ? 6 : 1;
      R.forma(x, R.elipse(0, y + dy, rx, ry, 14), f());
      R.forma(x, R.elipse(0, y + dy + (tipo === 'bostezo' ? 1 : 0), rx - 4.5, ry - 4.5, 12), { relleno: (c) => { c.fillStyle = OSC; c.fillRect(-20, y - 30, 40, 60);
        if (tipo !== 'o') R.punto(c, 0, y + dy + ry - 3, rx - 4, '#d9727e'); if (tipo === 'bostezo') { c.fillStyle = '#fff'; c.fillRect(-8, y + dy - ry + 3, 16, 3.5); } }, ancho: 1.2, trazo: OSC, j: .25 });
      if (tipo === 'espuma') for (let i = 0; i < 7; i++) R.forma(x, R.elipse(-15 + i * 5, y + 7 + (i % 3) * 2.5, 3.6, 3, 7), { relleno: '#ffffff', ancho: 1.2, j: .3 });
      return;
    }
    if (tipo === 'beso') {
      R.forma(x, R.elipse(2, y, 9.5, 8, 12), f());
      R.linea(x, [[-3, y], [2, y + 0.5], [8, y]], { trazo: '#8a3e46', ancho: 1.6, j: .2 });
      R.linea(x, [[-4, y - 4], [-1, y - 2]], { trazo: '#9e5157', ancho: 1.1, j: .2 }); R.linea(x, [[-4, y + 4], [-1, y + 2]], { trazo: '#9e5157', ancho: 1.1, j: .2 });
      return;
    }
    if (tipo === 'risa') {
      const P = [[-20, y - 4], [-8, y - 5.5], [0, y - 4.5], [8, y - 5.5], [20, y - 4], [13, y + 8], [0, y + 11.5], [-13, y + 8]];
      R.forma(x, P, { relleno: (c) => { c.fillStyle = OSC; c.fillRect(-25, y - 10, 50, 26); c.fillStyle = '#fffaf6'; c.fillRect(-25, y - 10, 50, 9); R.punto(c, 0, y + 12, 8, '#d9727e'); }, trazo: lab, ancho: 4, j: .3 });
      R.linea(x, P.concat([P[0]]), Object.assign({}, borde, { ancho: 1.2 }));
      R.linea(x, [[-23, y - 6], [-20, y - 2]], { trazo: LINEA_SUAVE, ancho: 1.4, j: .2 }); R.linea(x, [[23, y - 6], [20, y - 2]], { trazo: LINEA_SUAVE, ancho: 1.4, j: .2 });
      return;
    }
    const sonr = tipo === 'sonrisa', k = sonr ? -3 : 0, w = sonr ? 17 : 15;
    R.forma(x, [[-w, y + k], [-6, y - 5], [0, y - 3], [6, y - 5], [w, y + k], [0, y + 1 + (sonr ? 1.5 : 0)]], f());
    R.forma(x, [[-w, y + k], [0, y + 1 + (sonr ? 1.5 : 0)], [w, y + k], [8, y + 7.5], [-8, y + 7.5]], f());
    R.linea(x, [[-w, y + k], [-7, y + 1], [0, y + 1.5 + (sonr ? 1.5 : 0)], [7, y + 1], [w, y + k]], { trazo: '#7e3a40', ancho: 1.8, j: .25 });
    R.punto(x, -4, y + 4, 2, 'rgba(255,255,255,0.45)');
    if (sonr) { R.linea(x, [[-w - 3, y + k - 2], [-w - 1, y + k + 2]], { trazo: LINEA_SUAVE, ancho: 1.3, j: .2 }); R.linea(x, [[w + 3, y + k - 2], [w + 1, y + k + 2]], { trazo: LINEA_SUAVE, ancho: 1.3, j: .2 }); }
  }

  function cabeza(x, e, C) {
    const cab = []; for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283, sy = Math.sin(a); cab.push([Math.cos(a) * 58 * (sy > 0 ? 1 - .3 * sy * sy : 1), -900 + sy * 80]); }
    for (const sg of [-1, 1]) R.forma(x, [[sg * 54, -905], [sg * 63, -912], [sg * 66, -896], [sg * 60, -878], [sg * 53, -876]], { relleno: PIEL, ancho: 2.2 });   // orejas
    R.forma(x, cab, { relleno: (c) => {
      c.fillStyle = PIEL; c.fillRect(-70, -990, 140, 180);
      c.fillStyle = 'rgba(214,140,115,0.30)'; c.beginPath(); c.moveTo(36, -990); c.quadraticCurveTo(46, -880, 18, -812); c.lineTo(70, -812); c.lineTo(70, -990); c.fill();   // lado en sombra
      const g = c.createRadialGradient(-22, -930, 2, -22, -930, 40); g.addColorStop(0, 'rgba(255,240,230,0.55)'); g.addColorStop(1, 'rgba(255,240,230,0)'); c.fillStyle = g; c.fillRect(-70, -990, 140, 120);
      const rub = 0.14 + 0.5 * (e.colorete || 0);
      for (const sg of [-1, 1]) { const b = c.createRadialGradient(sg * 34, -864, 1, sg * 34, -864, 21); b.addColorStop(0, `rgba(240,112,130,${rub})`); b.addColorStop(1, 'rgba(240,112,130,0)'); c.fillStyle = b; c.fillRect(sg * 34 - 24, -888, 48, 48); }
      c.fillStyle = 'rgba(205,130,110,0.35)'; c.beginPath(); c.ellipse(0, -826, 12, 3.5, 0, 0, 6.283); c.fill();                   // sombra bajo el labio
    } });
    const cara = C || {}, oj = cara.ojos || [1, 1], mir = cara.mirada || [0, 0], cj = cara.ceja || {};
    for (const [i, sg] of [[0, -1], [1, 1]]) { ojo(x, sg, oj[i], !!cara.feliz, mir, e.rimel || 0); ceja(x, sg, cj.alto || 0, cj.pena || 0); }
    R.linea(x, [[-2, -893], [-4, -876], [-8, -865]], { trazo: '#cf9a84', ancho: 1.8, j: .3 });                                   // nariz
    R.linea(x, [[-9, -861], [-5, -857], [-1, -858]], { trazo: '#a8705e', ancho: 1.8, j: .25 });
    R.linea(x, [[9, -861], [5, -857], [1, -858]], { trazo: '#a8705e', ancho: 1.8, j: .25 });
    R.punto(x, 2, -866, 2.2, 'rgba(255,255,255,0.5)');
    boca(x, cara.boca || 'neutra', R.mix('#d39282', '#d23a58', e.labial || 0));
    if (e.crema > 0) {
      const pts = [[-12, -944], [14, -946], [-36, -870], [36, -870], [0, -828], [-24, -930], [26, -928]];
      for (let i = 0; i < Math.ceil(e.crema * pts.length); i++) R.forma(x, R.elipse(pts[i][0], pts[i][1], 6, 4.6, 7), { relleno: '#ffffff', ancho: 1.5, j: .35 });
    }
  }

  const degr = (c, a, b) => { const g = c.createLinearGradient(a, 0, b, 0); g.addColorStop(0, PELO_L); g.addColorStop(.35, PELO); g.addColorStop(.75, PELO); g.addColorStop(1, PELO_S); return g; };   // luz desde la izquierda

  /* ---------------- CUERPO COMPLETO ---------------- */
  R.chica = function (x, cx, pies, s, e = {}) {
    R.con(x, cx, pies, s, e.rot || 0, () => {
      const suelto = e.pelo == null ? (e.turbante ? 0 : 1) : e.pelo;
      const caida = (y) => -990 + (y + 990) * (0.5 + 0.5 * suelto);
      // pelo largo por detras
      if (suelto > 0) {
        const B = [[0, -998], [50, -988], [80, -952], [90, -890], [94, -830], [100, -770], [94, -720], [110, -668], [104, -616], [114, -572], [90, -548], [62, -562], [30, -574], [0, -580],
          [-30, -574], [-62, -562], [-90, -548], [-114, -572], [-104, -616], [-110, -668], [-94, -720], [-100, -770], [-94, -830], [-90, -890], [-80, -952], [-50, -988]].map(p => [p[0], caida(p[1])]);
        R.forma(x, B, { relleno: (c) => { c.fillStyle = degr(c, -120, 120); c.fillRect(-130, -1010, 260, 480); } });
      }
      // piernas
      const pierna = [[-64, -350], [-60, -272], [-63, -192], [-50, -112], [-42, -56], [-24, -56], [-20, -120], [-15, -200], [-12, -272], [-9, -350]];
      R.forma(x, pierna, { relleno: PIEL }); R.forma(x, R.espejo(pierna), { relleno: (c) => { c.fillStyle = PIEL; c.fillRect(0, -360, 80, 320); c.fillStyle = 'rgba(214,140,115,0.3)'; c.fillRect(44, -360, 30, 320); } });
      R.linea(x, [[-46, -268], [-38, -262]], { trazo: LINEA_SUAVE, ancho: 1.4, j: .3 }); R.linea(x, [[46, -268], [38, -262]], { trazo: LINEA_SUAVE, ancho: 1.4, j: .3 });
      const zap = [[-78, -54], [-90, -26], [-80, 2], [-16, 2], [-4, -22], [-14, -54]];
      for (const P of [zap, R.espejo(zap)]) {
        R.forma(x, P, { relleno: '#f4a7b9' });
        R.forma(x, [P[0], [(P[0][0] + P[5][0]) / 2 - 6, -72], [(P[0][0] + P[5][0]) / 2 + 6, -72], P[5], [(P[0][0] + P[5][0]) / 2, -46]], { relleno: '#fff8f8', ancho: 2.2 });
      }
      // cuello y escote
      R.forma(x, [[-17, -842], [17, -842], [20, -790], [26, -770], [0, -700], [-26, -770], [-20, -790]], { relleno: PIEL });
      R.forma(x, [[-17, -836], [17, -836], [15, -818], [0, -812], [-15, -818]], { relleno: PIEL_S, trazo: false, j: .3 });
      R.linea(x, [[-10, -760], [-4, -756]], { trazo: LINEA_SUAVE, ancho: 1.3, j: .3 }); R.linea(x, [[10, -760], [4, -756]], { trazo: LINEA_SUAVE, ancho: 1.3, j: .3 });
      // bata (luz desde la izquierda)
      const bata = [[-26, -802], [-70, -792], [-108, -778], [-118, -740], [-112, -680], [-100, -640], [-86, -610], [-82, -590], [-98, -540], [-110, -480], [-118, -410], [-126, -345], [-60, -334], [0, -337], [60, -334],
        [126, -345], [118, -410], [110, -480], [98, -540], [82, -590], [86, -610], [100, -640], [112, -680], [118, -740], [108, -778], [70, -792], [26, -802], [4, -706], [-4, -706]];
      R.forma(x, bata, { relleno: (c) => {
        c.fillStyle = BATA; c.fillRect(-140, -810, 280, 480);
        c.fillStyle = BATA_S; c.beginPath(); c.moveTo(60, -810); c.quadraticCurveTo(84, -600, 70, -330); c.lineTo(140, -330); c.lineTo(140, -810); c.fill();
        c.beginPath(); c.moveTo(-90, -650); c.quadraticCurveTo(-20, -620, 60, -650); c.lineTo(60, -630); c.quadraticCurveTo(-20, -600, -90, -630); c.fill();
      } });
      for (const [a, b] of [[[-50, -575], [-62, -350]], [[-14, -572], [-18, -345]], [[34, -575], [44, -350]], [[70, -560], [88, -360]]]) R.linea(x, [a, [(a[0] + b[0]) / 2 + 3, (a[1] + b[1]) / 2], b], { trazo: '#e2aab6', ancho: 1.8, j: .4 });
      R.forma(x, [[-126, -366], [0, -358], [126, -366], [126, -345], [60, -334], [0, -337], [-60, -334], [-126, -345]], { relleno: BATA_B, ancho: 2 });   // dobladillo
      R.forma(x, [[-26, -802], [-44, -788], [-28, -700], [-8, -608], [4, -614], [-12, -700]], { relleno: BATA_B, ancho: 2.2 });    // solapas
      R.forma(x, [[26, -802], [44, -788], [32, -700], [0, -600], [-12, -606], [16, -700]], { relleno: BATA_B, ancho: 2.2 });
      R.forma(x, [[-84, -606], [0, -609], [84, -606], [86, -584], [0, -581], [-86, -584]], { relleno: '#eba3b4' });                // cinturon
      R.forma(x, R.elipse(-26, -595, 13, 11, 8), { relleno: '#eba3b4' });
      R.forma(x, [[-32, -586], [-46, -520], [-34, -500], [-28, -540], [-24, -586]], { relleno: '#eba3b4' });
      R.forma(x, [[-22, -586], [-12, -530], [0, -516], [-4, -548], [-16, -586]], { relleno: '#eba3b4' });
      // mechones delanteros
      if (suelto > 0.6) {
        const m = [[-56, -905], [-66, -850], [-72, -800], [-80, -760], [-76, -720], [-88, -680], [-82, -630], [-94, -592], [-72, -580], [-60, -620], [-56, -670], [-48, -720], [-46, -780], [-50, -845]].map(p => [p[0], caida(p[1])]);
        R.forma(x, m, { relleno: PELO }); R.forma(x, R.espejo(m), { relleno: '#6b3f25' });
        for (const sg of [-1, 1]) R.linea(x, [[sg * 58, caida(-860)], [sg * 70, caida(-760)], [sg * 76, caida(-660)]], { trazo: sg < 0 ? PELO_L : '#7b4a2c', ancho: 1.8, j: .4 });
      }
      cabeza(x, e, e.cara);
      if (suelto > 0) {
        R.forma(x, [[-52, -930], [-40, -950], [-20, -960], [10, -962], [30, -956], [50, -940], [54, -925]], { relleno: 'rgba(200,120,100,0.35)', trazo: false, j: .3 });  // sombra del flequillo
        const cap = [[-58, -872], [-62, -920], [-52, -962], [-24, -988], [12, -994], [46, -982], [62, -952], [64, -906], [60, -872], [54, -902], [44, -934], [22, -952], [14, -954],
          [0, -950], [-26, -946], [-46, -930], [-54, -900]];
        R.forma(x, cap, { relleno: (c) => { c.fillStyle = degr(c, -66, 66); c.fillRect(-70, -1000, 140, 140); } });
        R.linea(x, [[12, -990], [-16, -972], [-40, -948], [-54, -912]], { trazo: PELO_L, ancho: 2, j: .4 });
        R.linea(x, [[2, -986], [-24, -962], [-46, -932]], { trazo: PELO_L, ancho: 1.6, j: .4 });
        R.linea(x, [[18, -990], [40, -970], [56, -936]], { trazo: PELO_S, ancho: 1.8, j: .4 });
        const hq = ['#a9d3f0', '#f7c6d6'];
        for (let i = 0; i < (e.horquillas || 0); i++) R.con(x, i ? 50 : -48, -944, .8, i ? 0.6 : -0.6, () => O.horquilla(x, { color: hq[i] }));
      }
      if (e.turbante) R.con(x, 0, -944, .85, 0, () => R.con(x, 0, 896, 1, 0, () => O.turbante(x)));
      const B = e.brazos || {};
      brazo(x, -1, B.izq); brazo(x, 1, B.der);
    });
  };
})(window.VE = window.VE || {});
