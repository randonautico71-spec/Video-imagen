/* VOLUMEN — RATA E INODORO (unidades: metros). Todo por codigo; el pelaje se pinta UNA vez.
     V.modelos.rata({ id, t, escala, pos, rot, rumbo, alfa, modo, amp, ondas, vel, cabeza, boca, mojada })
        id: nombre unico de la malla dinamica (una por rata en pantalla). t: tiempo en s (anima). escala: 1 = rata parda adulta (cuerpo 22 cm + cola 19 cm).
        modo: 'nado' (ondula de la cabeza a la cola y bracea con las patas traseras; defecto) | 'flota' (casi quieta, bracea con las delanteras, respira) | 'quieta'.
        amp: amplitud de la onda 0..1; ondas: ondas del cuerpo (1.2); vel: ciclos por segundo (1.6);
        ondaY / ondaZ: amplitud de la onda en vertical (0,006) y en horizontal (0,016) en m: para verla de perfil subir ondaY.
        cabeza: [guinada, cabeceo] en radianes (mira a un lado / arriba); boca 0..1 (abre y deja ver los incisivos); mojada 0..1 (pelo pegado y brillante).
     CUERPO, CABEZA, HOCICO Y COLA SON UNA SOLA PIEL CONTINUA (una unica malla parametrica dinamica, como las morenas): sin juntas entre piezas.
     Aparte, y pequenos: ojos, orejas, nariz, incisivos, bigotes y las cuatro patas (que braceen).
     Nodos con nombre para anclar grafismos con V.posicion: 'cabeza', 'hocico', 'cola'. Cabeza hacia +X.
     V.modelos.rata.largo(escala)  largo total con cola.

     V.modelos.inodoro({ tapa, asiento, boton, pos, rot, esc, agua, alfaAgua })
        Inodoro de cisterna (frente hacia +Z; borde de la taza a 0,40 m): taza hueca de porcelana, asiento, tapa que gira sobre la bisagra trasera
        (tapa: 0 = cerrada .. 1 = abierta a unos 100 grados; alfaTapa: opacidad solo de la tapa; alfa: de todo el inodoro), cisterna con pulsador (boton 0..1 lo hunde), agua en la taza (agua: altura en m, defecto 0,17).
     V.modelos.inodoro.agujero  = [0, 0.17, 0.02]  centro del agua, para colocar lo que flota. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, nodo = V.nodo;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------------- pelaje (una sola textura para cuerpo, cabeza y cola) */
  const pielRata = () => V.textura('rata|piel', 1024, 256, (x, W, H) => {          // x = nariz -> punta de la cola, y = vuelta (lomo 25 %, vientre 75 %)
    const rn = VE.rng('rata|piel');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7b6a58'); g.addColorStop(0.25, '#5f4e3e'); g.addColorStop(0.5, '#85725e'); g.addColorStop(0.65, '#b9ac9a'); g.addColorStop(0.9, '#c4b8a6'); g.addColorStop(1, '#7b6a58');
    x.fillStyle = g; x.fillRect(0, 0, W * 0.58, H);
    for (let i = 0; i < 9000; i++) { const px = rn() * W * 0.58, py = rn() * H, l = 5 + rn() * 12; x.strokeStyle = rn() < 0.5 ? 'rgba(255,240,215,0.10)' : 'rgba(20,12,6,0.13)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(px, py); x.lineTo(px - l, py + (rn() - 0.5) * 3); x.stroke(); }
    x.fillStyle = '#6e5b4b'; x.fillRect(0, 0, W * 0.05, H);                                   // hocico algo mas oscuro
    const t = x.createLinearGradient(0, 0, 0, H); t.addColorStop(0, '#b78f86'); t.addColorStop(0.5, '#caa59b'); t.addColorStop(1, '#b78f86');   // cola: rosada, escamosa y casi sin pelo
    x.fillStyle = t; x.fillRect(W * 0.575, 0, W * 0.425, H);
    x.strokeStyle = 'rgba(70,40,36,0.45)'; x.lineWidth = 1.4; for (let k = W * 0.58; k < W; k += 7) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, H); x.stroke(); }
    const mez = x.createLinearGradient(W * 0.54, 0, W * 0.6, 0); mez.addColorStop(0, 'rgba(120,100,84,0)'); mez.addColorStop(1, 'rgba(120,100,84,0)'); x.fillStyle = mez; x.fillRect(W * 0.54, 0, W * 0.06, H);
  });

  /* ---------------------------------------------------------------- perfil de la piel: [s, semiancho, semialto, caida] (s: 0 nariz .. 1 punta de la cola) */
  const KP = [[0.0, 0.0015, 0.0015, 0.016], [0.02, 0.009, 0.009, 0.013], [0.06, 0.017, 0.016, 0.009], [0.11, 0.027, 0.026, 0.003], [0.16, 0.031, 0.030, 0.0], [0.21, 0.028, 0.027, 0.0],
    [0.28, 0.037, 0.037, 0.0], [0.37, 0.046, 0.045, 0.0], [0.45, 0.045, 0.043, 0.0], [0.52, 0.033, 0.034, 0.0], [0.565, 0.0105, 0.0105, 0.0], [0.7, 0.0072, 0.0072, 0.0], [0.86, 0.0045, 0.0045, 0.0], [1.0, 0.0012, 0.0012, 0.0]];
  const perfil = (s) => { s = c01(s); let i = 0; while (i < KP.length - 2 && s > KP[i + 1][0]) i++; const a = KP[i], b = KP[i + 1], k = c01((s - a[0]) / (b[0] - a[0])), e = k * k * (3 - 2 * k); return [lerp(a[1], b[1], e), lerp(a[2], b[2], e), lerp(a[3], b[3], e)]; };
  const LARGO = 0.41;

  MO.rata = (o = {}) => {
    const id = o.id || 'rata', es = 1, esc0 = o.escala == null ? 1 : o.escala, t = o.t || 0, modo = o.modo || 'nado', quieta = modo === 'quieta';
    const amp = (o.amp == null ? (modo === 'nado' ? 1 : modo === 'flota' ? 0.25 : 0) : o.amp), ond = o.ondas == null ? 1.15 : o.ondas, vel = o.vel == null ? 1.6 : o.vel;
    const ph = TAU * vel * t, ch = o.cabeza || [0, 0], boca = c01(o.boca || 0), moj = o.mojada == null ? 0.6 : o.mojada, L = LARGO * es;
    const resp = 1 + 0.035 * Math.sin(t * 9) * (modo === 'flota' ? 1.6 : 0.8);
    /* linea central: x de nariz (+) a cola (-); onda lateral que crece hacia la cola, cabeceo y guinada de la cabeza */
    const base = (s) => {
      const q = c01(s), env = 0.25 + 0.75 * sm(0.0, 0.62, q) + 0.9 * sm(0.55, 1, q);
      const ay = o.ondaY == null ? 0.006 : o.ondaY, az = o.ondaZ == null ? 0.016 : o.ondaZ;
      const dz = amp * az * env * Math.sin(q * ond * TAU - ph) * (1 + 0.0) + ch[0] * 0.07 * (1 - sm(0, 0.34, q)) - ch[0] * 0.012 * sm(0.5, 1, q) * 0;
      const dy = amp * ay * Math.sin(q * ond * TAU - ph + 1.4) * sm(0.1, 0.7, q) + ch[1] * 0.075 * (1 - sm(0, 0.34, q)) + (modo === 'flota' ? 0.003 * Math.sin(t * 2.2 + q * 3) : 0);
      return [(0.5 - q) * LARGO * 0.97, dy - perfil(q)[2] * 0.0, dz];
    };
    const marco = (s) => { const p = base(s), q = base(Math.min(1, s + 0.004)), p0 = base(Math.max(0, s - 0.004));
      let T = [q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]; const m = Math.hypot(...T) || 1; T = T.map(v => v / m);
      let S = [-T[2], 0, T[0]]; const ms = Math.hypot(...S) || 1; S = S.map(v => v / ms);                    // lateral (+z cuando T = -x... se normaliza)
      if (S[2] < 0) S = S.map(v => -v);
      const U = [T[1] * S[2] - T[2] * S[1], T[2] * S[0] - T[0] * S[2], T[0] * S[1] - T[1] * S[0]]; const sU = U[1] < 0 ? -1 : 1; return { p, T, S, U: U.map(v => v * sU) }; };
    const punto = (s, phi, k = 1) => { const [a, b, caida] = perfil(s), m = marco(s), ca = Math.cos(phi) * a * k, sa = Math.sin(phi), sy = (sa > 0 ? sa : sa * 0.92) * b * k;
      const e = 1 + (s > 0.12 && s < 0.5 ? (resp - 1) : 0);
      return [m.p[0] + m.S[0] * ca * e + m.U[0] * (sy * e - caida), m.p[1] + m.S[1] * ca * e + m.U[1] * (sy * e - caida), m.p[2] + m.S[2] * ca * e + m.U[2] * (sy * e - caida)]; };
    const cuerpo = MA.parametrica(96, 18, (u, v) => punto(u, v * TAU), { dinamica: 'rata|c|' + id });
    const mPiel = { color: '#ffffff', mapa: pielRata(), esp: 0.12 + 0.3 * moj, dureza: 18 + 30 * moj, envolver: 0.35, borde: 0.2 };
    const mOjo = { color: '#07060a', esp: 0.95, dureza: 120, envolver: 0.2 }, mRosa = { color: '#cf8f93', esp: 0.3, dureza: 24, envolver: 0.4 }, mDiente = { color: '#e9d9a8', esp: 0.5, dureza: 40, envolver: 0.3 };
    const mPata = { color: '#c9a099', esp: 0.2, dureza: 20, envolver: 0.4 }, mBig = { color: '#d9d2c4', tipo: 'plano' };
    const en = (s, phi, k) => punto(s, phi, k);
    const hijos = [nodo({ malla: cuerpo, mat: mPiel })];
    const lados = [1, -1];
    /* ojos, orejas, nariz, incisivos, bigotes */
    for (const l of lados) {
      const po = en(0.115, l > 0 ? 0.35 : PI - 0.35, 0.93), pe = en(0.2, l > 0 ? 0.95 : PI - 0.95, 1.02);
      hijos.push(nodo({ malla: MA.esfera(12), esc: 0.0074 * es, pos: po.map(v => v * es), mat: mOjo }));
      hijos.push(nodo({ malla: MA.esfera(6), esc: 0.0022 * es, pos: [po[0] * es + 0.003 * es, po[1] * es + 0.0036 * es, po[2] * es + l * 0.002 * es], mat: mBig }));
      hijos.push(nodo({ pos: pe.map(v => v * es), rot: [l * 0.5, l * -0.3, 0.25], hijos: [
        nodo({ malla: MA.esfera(14), esc: [0.003 * es, 0.0155 * es, 0.0155 * es], mat: mPiel }), nodo({ malla: MA.esfera(12), esc: [0.0034 * es, 0.0115 * es, 0.0112 * es], pos: [l * 0.0012 * es, 0, 0], mat: mRosa })] }));
      for (let k = 0; k < 3; k++) {
        const pb = en(0.04, l > 0 ? 0.2 : PI - 0.2, 0.9), dir = [0.55 - k * 0.22, (k - 1) * 0.28, l * (0.8 + 0.1 * k)], len = 0.052 * es, mov = Math.sin(t * 11 + k) * 0.01;
        hijos.push(nodo({ malla: MA.tubo([pb.map(v => v * es), [pb[0] * es + dir[0] * len * 0.55, pb[1] * es + dir[1] * len * 0.55 + 0.004 * es, pb[2] * es + dir[2] * len * 0.55], [pb[0] * es + dir[0] * len, pb[1] * es + dir[1] * len - 0.004 * es, pb[2] * es + dir[2] * len + mov]], 0.00045 * es, 5, { clave: 'rata|bigote|' + es.toFixed(2) + '|' + k + '|' + l }), mat: { color: '#e6e1d6', esp: 0.2, dureza: 20 } }));
      }
    }
    const pn = en(0.0, PI / 2, 1);
    hijos.push(nodo({ nombre: 'hocico', malla: MA.esfera(12), esc: [0.0075 * es, 0.0065 * es, 0.0085 * es], pos: [pn[0] * es + 0.003 * es, pn[1] * es + 0.0008 * es, pn[2] * es], mat: mRosa }));
    const bj = c01(boca);
    for (const l of lados) {
      const pd = en(0.012, PI * 1.5, 0.9);
      hijos.push(nodo({ malla: MA.capsula(0.0017 * es, 0.0012 * es, 0.0075 * es, 8), pos: [pd[0] * es + 0.002 * es, pd[1] * es - 0.001 * es - bj * 0.005 * es, pd[2] * es + l * 0.0034 * es], rot: [0, 0, -0.28], mat: mDiente }));
    }
    hijos.push(nodo({ nombre: 'cabeza', pos: en(0.13, PI / 2, 0).map(v => v * es), esc: 0.001 }));
    hijos.push(nodo({ nombre: 'cola', pos: en(0.9, PI / 2, 0).map(v => v * es), esc: 0.001 }));
    /* patas: delanteras bajo los hombros, traseras mas grandes que bracean */
    const pata = (s, l, tras) => {
      const p = en(s, l > 0 ? -0.55 : PI + 0.55, 0.95), m = marco(s), f = TAU * vel * t + (tras ? (l > 0 ? 0 : PI) : (l > 0 ? PI * 0.5 : PI * 1.5)), sw = quieta ? 0 : Math.sin(f), bo = modo === 'flota' ? 0.7 : 1;
      const ar = (tras ? 0.9 : 0.8) + sw * 0.45 * bo, lg = tras ? 0.040 : 0.030, r = tras ? 0.0105 : 0.0075;
      const dirv = [-Math.sin(ar) * 0.6, -Math.cos(ar), l * 0.35];
      return nodo({ pos: p.map(v => v * es), hijos: [nodo({ malla: MA.capsula(r * es, r * 0.65 * es, lg * es, 8), pos: [dirv[0] * lg * 0.5 * es, dirv[1] * lg * 0.5 * es, dirv[2] * lg * 0.5 * es], rot: [l * 0.35, 0, -Math.atan2(dirv[0], -dirv[1])], mat: { color: '#7d6b5a', esp: 0.2, dureza: 20, envolver: 0.4 } }),
        nodo({ malla: MA.esfera(10), esc: [(tras ? 0.021 : 0.013) * es, 0.0045 * es, (tras ? 0.0105 : 0.0095) * es], pos: [dirv[0] * lg * es + (tras ? 0.007 : 0.003) * es, dirv[1] * lg * es, dirv[2] * lg * es], rot: [0, 0, 0.3 + sw * 0.2], mat: mPata })] });
    };
    hijos.push(pata(0.27, 1, false), pata(0.27, -1, false), pata(0.47, 1, true), pata(0.47, -1, true));
    return nodo({ pos: o.pos, rot: o.rot || [0, o.rumbo || 0, 0], esc: esc0, alfa: o.alfa, hijos });
  };
  MO.rata.largo = (es = 1) => LARGO * es;

  /* ---------------------------------------------------------------- inodoro */
  const porcelana = { color: '#cfd6de', esp: 0.65, dureza: 70, envolver: 0.35, borde: 0.25 }, porcelanaD = Object.assign({ dobleCara: true }, porcelana);
  const PERFIL_TAZA = [[0.002, 0.045], [0.07, 0.05], [0.115, 0.09], [0.165, 0.17], [0.19, 0.27], [0.195, 0.34], [0.19, 0.39], [0.172, 0.405], [0.156, 0.4], [0.152, 0.34], [0.145, 0.27], [0.12, 0.2], [0.085, 0.14], [0.04, 0.11], [0.002, 0.1]];
  MO.inodoro = (o = {}) => {
    const tapa = c01(o.tapa || 0), asiento = o.asiento == null ? 1 : o.asiento, boton = c01(o.boton || 0), agua = o.agua == null ? 0.2 : o.agua;
    const taza = MA.torno(PERFIL_TAZA.slice().reverse(), 48, 'ino|taza'), ang = tapa * 1.75;
    const hij = [
      nodo({ malla: taza, esc: [0.98, 1, 1.32], pos: [0, 0, 0.04], mat: porcelanaD }),
      nodo({ malla: MA.caja(0.24, 0.3, 0.12, 0.04, 4), pos: [0, 0.15, -0.23], mat: porcelana }),
      nodo({ malla: MA.cilindro(0.085, 0.125, 0.08, 28, true), pos: [0, 0.04, 0.03], esc: [1, 1, 1.25], mat: porcelana }),   // pedestal                                           // pie de porcelana
      nodo({ malla: MA.caja(0.43, 0.36, 0.2, 0.025, 4), pos: [0, 0.6, -0.27], mat: porcelana }),                                           // cisterna
      nodo({ malla: MA.caja(0.45, 0.03, 0.22, 0.014, 4), pos: [0, 0.795, -0.27], mat: porcelana }),
      nodo({ malla: MA.cilindro(0.026, 0.026, 0.02, 20, true), pos: [0, 0.822 - boton * 0.011, -0.27], mat: { color: '#cdd3d8', esp: 0.8, dureza: 80, envolver: 0.3 } }),
      nodo({ malla: MA.cilindro(1, 1, 0.004, 32, true), esc: [(0.085 + (agua - 0.14) * 0.58) * 0.96, 1, (0.085 + (agua - 0.14) * 0.58) * 1.28], pos: [0, agua, 0.04], mat: { color: '#9fd2e8', alfa: 0.55, esp: 0.9, dureza: 90, envolver: 0.2, dobleCara: true } }),
      nodo({ malla: MA.cilindro(1, 1, 0.006, 24, true), esc: [0.08, 1, 0.1], pos: [0, 0.095, 0.05], mat: { color: '#7bb5cf', alfa: 0.6, dobleCara: true } }),
      nodo({ malla: MA.toro(0.19, 0.021, 40, 12), rot: [0, 0, 0], esc: [0.96, 1, 1.34], pos: [0, 0.412, 0.04], mat: { color: '#f6f7f8', esp: 0.55, dureza: 60, envolver: 0.3 } }),            // asiento
      nodo({ pos: [0, 0.428, -0.2], rot: [-ang, 0, 0], alfa: o.alfaTapa, hijos: [
        nodo({ malla: MA.caja(0.37, 0.026, 0.47, 0.012, 3), pos: [0, 0.0, 0.245], mat: { color: '#f6f7f8', esp: 0.55, dureza: 60, envolver: 0.3 } }),
        nodo({ malla: MA.caja(0.33, 0.012, 0.43, 0.01, 3), pos: [0, -0.015, 0.245], mat: { color: '#dfe3e7', esp: 0.2, dureza: 20 } })] }),
    ];
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: hij });
  };
  MO.inodoro.agujero = [0, 0.2, 0.04];
})(window.VE);
