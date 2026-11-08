/* VOLUMEN — ANIMALES EXTINTOS (unidades: metros; todos miran a +X y se apoyan en y = 0, salvo el delfin, que nada centrado en y = 0).
   Piel, pelo y marfil pintados una vez (V.textura) y rasgos propios de cada especie, para planos cercanos.
     V.modelos.neandertal({ yaw, cab, giro, parpadeo, boca, pos, rot, esc })
        Busto de Homo neanderthalensis (cabeza + hombros con capa de piel): craneo largo y bajo con moño occipital, arco superciliar
        marcado, ojos hundidos, nariz ancha y grande, cara adelantada, mentón huidizo, barba y pelo largos, colgante de garras.
        cab: cabeza arriba/abajo (rad) · giro: cabeza a un lado (rad) · parpadeo 0..1 · boca 0..1 · origen en el esternon, mirando a +X.
     V.modelos.mamut({ marcha: 'quieto'|'camina', fase, trompa, cab, pos, rot, esc })
        Mammuthus primigenius: cupula en la cabeza, joroba de los hombros, lomo que cae, pelaje largo (con faldon), trompa
        con anillos, colmillos de marfil curvados, orejas pequeñas. Alzada ~3,2 m. fase: vueltas del ciclo de paso.
     V.modelos.baiji({ id, t, escala, amp, vel, aleta, pos, rot })
        Lipotes vexillifer (delfin del Yangtse): cuerpo gris azulado, vientre blanco, rostro largo y levantado, frente (melon) abombada,
        ojo diminuto, aleta dorsal baja y triangular, aletas anchas, cola con dos lobulos. Ondula con t. Largo ~2,2 m.
   Probado en proyectos/extintos. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const liso = (c, e) => Object.assign({ color: c, esp: 0.3, dureza: 36, envolver: 0.25 }, e || {});
  const ell = (mat, esc3, pos, rot) => V.nodo({ malla: MA.esfera(24), esc: esc3, pos: pos || [0, 0, 0], rot, mat });
  /* trazos de pelo/fibra sobre un lienzo: n trazos de largo ~largo en los colores dados */
  const pelo = (x, W, H, n, cols, largo, sem, ang) => {
    const r = VE.rng('pelo|' + sem); x.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, l = largo * (0.5 + r()), a = (ang == null ? PI / 2 : ang) + (r() - 0.5) * 0.5;
      x.globalAlpha = 0.18 + r() * 0.5; x.strokeStyle = cols[Math.floor(r() * cols.length)]; x.lineWidth = 0.8 + r() * 1.6;
      x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + Math.cos(a) * l * 0.5 + (r() - 0.5) * 4, y0 + Math.sin(a) * l * 0.5, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); x.stroke(); }
    x.globalAlpha = 1;
  };

  /* ================================================================== NEANDERTAL */
  MO.neandertal = function (o = {}) {
    const PIEL = '#c49a78', PIEL_O = '#a67a5c', PIEL_C = '#d9b392', LABIO = '#b0675c';
    const texPiel = V.textura('nea|piel', 512, 512, (x, W, H) => {
      x.fillStyle = PIEL; x.fillRect(0, 0, W, H); const r = VE.rng('neapiel');
      for (let i = 0; i < 700; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); const cx = r() * W, cy = r() * H, rr = 12 + r() * 46;
        const gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); const c = r() < 0.5 ? '166,110,84' : '226,184,150'; gg.addColorStop(0, `rgba(${c},${0.05 + r() * 0.1})`); gg.addColorStop(1, `rgba(${c},0)`); x.fillStyle = gg; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      for (let i = 0; i < 5200; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '90,56,40' : '240,212,186'},${0.05 + r() * 0.1})`; x.fillRect(r() * W, r() * H, 1 + r() * 1.6, 1 + r() * 1.6); }   // poros y brillo
      x.lineWidth = 1.2; for (let i = 0; i < 34; i++) { x.strokeStyle = `rgba(110,70,52,${0.08 + r() * 0.12})`; const y0 = r() * H; x.beginPath(); x.moveTo(r() * W, y0); x.bezierCurveTo(r() * W, y0 + 5, r() * W, y0 - 5, r() * W, y0 + r() * 8); x.stroke(); }   // arrugas finas
      const rub = x.createLinearGradient(0, H * 0.45, 0, H * 0.7); rub.addColorStop(0, 'rgba(190,100,84,0)'); rub.addColorStop(0.5, 'rgba(190,100,84,0.16)'); rub.addColorStop(1, 'rgba(190,100,84,0)'); x.fillStyle = rub; x.fillRect(0, H * 0.45, W, H * 0.25);   // pomulos curtidos
    });
    const texPelo = V.textura('nea|pelo', 512, 512, (x, W, H) => {
      x.fillStyle = '#3b2a1c'; x.fillRect(0, 0, W, H); pelo(x, W, H, 9000, ['#1f160e', '#4d3622', '#6a4a2e', '#2b1d12', '#8a6a46', '#9b8a74'], 46, 'neapelo');
    });
    const texBarba = V.textura('nea|barba', 512, 512, (x, W, H) => {
      x.fillStyle = '#4a3422'; x.fillRect(0, 0, W, H); pelo(x, W, H, 8000, ['#2a1c10', '#5e4128', '#7a5a38', '#8d7a66', '#a49a8c'], 40, 'neabarba');
    });
    const texCapa = V.textura('nea|capa', 512, 512, (x, W, H) => {
      x.fillStyle = '#7a5530'; x.fillRect(0, 0, W, H); pelo(x, W, H, 12000, ['#4b3118', '#8f6a3a', '#a8814c', '#5d3f20', '#c9a56e', '#33200e'], 30, 'neacapa');
      const r = VE.rng('neacapa2'); for (let i = 0; i < 14; i++) { x.globalAlpha = 0.25; x.fillStyle = '#2b1c0e'; x.beginPath(); x.ellipse(r() * W, r() * H, 30 + r() * 60, 12 + r() * 24, r() * 3, 0, TAU); x.fill(); } x.globalAlpha = 1;
    });
    const mP = { color: '#ffffff', mapa: texPiel, esp: 0.12, dureza: 20, envolver: 0.45, borde: 0.2 };
    const mPelo = { color: '#ffffff', mapa: texPelo, esp: 0.06, dureza: 14, envolver: 0.5, borde: 0.25 };
    const mBarba = { color: '#ffffff', mapa: texBarba, esp: 0.05, dureza: 12, envolver: 0.5, borde: 0.25 };
    const mCapa = { color: '#ffffff', mapa: texCapa, esp: 0.04, dureza: 10, envolver: 0.55, borde: 0.3 };
    const par = (f) => [1, -1].map(f);
    const parp = c01(o.parpadeo || 0), boca = c01(o.boca || 0), cab = o.cab || 0, giro = o.giro || 0;
    /* ---- cabeza (origen en el centro de la cara; +X adelante, +Y arriba, +Z lado) ---- */
    const cabeza = [];
    cabeza.push(ell(mP, [0.118, 0.108, 0.086], [-0.012, 0.095, 0]));                                  // craneo largo y bajo
    cabeza.push(ell(mP, [0.05, 0.052, 0.075], [-0.118, 0.07, 0]));                                    // moño occipital
    cabeza.push(ell(mP, [0.07, 0.092, 0.07], [0.055, 0.015, 0]));                                     // cara adelantada (prognatismo medio)
    cabeza.push(ell(mP, [0.052, 0.04, 0.074], [0.02, -0.07, 0]));                                     // mandibula
    cabeza.push(ell(mP, [0.026, 0.026, 0.034], [0.062, -0.1, 0]));                                    // menton huidizo
    par(s => { cabeza.push(ell(mP, [0.034, 0.022, 0.05], [0.078, 0.083, s * 0.04], [s * 0.1, s * 0.25, 0.1]));         // arco superciliar (toro supraorbitario)
      cabeza.push(ell(mP, [0.032, 0.03, 0.034], [0.04, -0.012, s * 0.068]));                          // pomulo
      cabeza.push(ell(liso('#1d1210', { esp: 0.05 }), [0.02, 0.019, 0.022], [0.075, 0.045, s * 0.04]));   // cuenca hundida
      cabeza.push(ell(liso('#ece4d6', { esp: 0.7, dureza: 60 }), [0.0145, 0.0135, 0.0165], [0.082, 0.045, s * 0.04]));   // globo ocular
      cabeza.push(ell(liso('#4a2e18', { esp: 0.8, dureza: 90 }), [0.0072, 0.0072, 0.0072], [0.094, 0.045, s * 0.04 + s * 0.0035]));   // iris
      cabeza.push(ell(liso('#050403', { esp: 0.9, dureza: 110 }), [0.0035, 0.0035, 0.0035], [0.0975, 0.045, s * 0.04 + s * 0.0038]));   // pupila
      cabeza.push(ell(mP, [0.0215, 0.012 + 0.009 * parp, 0.0235], [0.0795, 0.0535 - 0.0075 * parp, s * 0.04], [s * 0.1, 0, 0]));   // parpado superior (cierra al parpadear)
      cabeza.push(ell(mP, [0.019, 0.006, 0.021], [0.079, 0.031, s * 0.04]));                          // parpado inferior
      cabeza.push(ell(liso('#2a1a10', { esp: 0.05 }), [0.03, 0.007, 0.03], [0.083, 0.082, s * 0.04], [s * 0.1, s * 0.2, 0.05]));   // ceja espesa
      cabeza.push(ell(mP, [0.012, 0.03, 0.014], [-0.012, 0.03, s * 0.086], [s * 0.3, 0, 0]));          // oreja
      cabeza.push(ell(liso('#0d0807', { esp: 0.05 }), [0.0065, 0.0075, 0.007], [0.141, -0.02, s * 0.0155]));   // fosa nasal
    });
    cabeza.push(ell(mP, [0.046, 0.05, 0.026], [0.117, 0.01, 0], [0, 0, -0.22]));                       // nariz grande y ancha
    cabeza.push(ell(mP, [0.03, 0.04, 0.022], [0.098, 0.05, 0]));                                      // puente
    cabeza.push(ell(mP, [0.03, 0.02, 0.034], [0.128, -0.014, 0]));                                    // punta
    cabeza.push(ell(liso(LABIO, { esp: 0.25, dureza: 30 }), [0.014, 0.007, 0.032], [0.1, -0.06, 0]));   // labio superior
    cabeza.push(ell(liso(LABIO, { esp: 0.25, dureza: 30 }), [0.014, 0.0075 + 0.01 * boca, 0.03], [0.096, -0.072 - 0.012 * boca, 0]));   // labio inferior
    cabeza.push(ell(liso('#2a0f0f', { esp: 0.1 }), [0.011, 0.0035 + 0.01 * boca, 0.027], [0.099, -0.0665 - 0.006 * boca, 0]));   // linea de la boca
    cabeza.push(V.nodo({ malla: MA.esfera(16), esc: [0.12, 0.1, 0.092], pos: [-0.038, 0.128, 0], rot: [0, 0, 0.3], mat: mPelo }));   // pelo (casquete echado atras)
    for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.3; cabeza.push(V.nodo({ malla: MA.capsula(0.02, 0.006, 0.2, 10), pos: [-0.1, 0.1, Math.sin(a) * 0.082], rot: [Math.sin(a) * 0.5, 0, 0.12 + 0.05 * (i % 3)], mat: mPelo })); }   // mechones largos
    const barba = [{ malla: MA.esfera(16), m: V.m4.mul(V.m4.tras(0.04, -0.09, 0), V.m4.esc(0.074, 0.06, 0.086)) }];
    const rb = VE.rng('neabarba'); for (let i = 0; i < 22; i++) { const a = i / 21 * PI - PI / 2; barba.push({ malla: MA.esfera(12), m: V.m4.mul(V.m4.tras(0.05 + Math.cos(a) * 0.012, -0.11 - rb() * 0.045, Math.sin(a) * 0.08), V.m4.esc(0.035, 0.05 + rb() * 0.03, 0.03)) }); }
    par(s => { barba.push({ malla: MA.esfera(14), m: V.m4.mul(V.m4.tras(0.02, -0.03, s * 0.088), V.m4.esc(0.045, 0.07, 0.025)) }); });   // patillas
    barba.push({ malla: MA.esfera(12), m: V.m4.mul(V.m4.tras(0.105, -0.048, 0), V.m4.esc(0.012, 0.007, 0.04)) });   // bigote
    cabeza.push(V.nodo({ malla: MA.fusionar(barba, 'nea|barba|v1'), mat: mBarba }));
    const gy = giro, pitch = cab;
    const cabNodo = V.nodo({ pos: [0.0, 0.34, 0], rot: [0, gy, pitch], hijos: cabeza });
    /* ---- cuello, hombros con capa de piel y colgante ---- */
    const cuerpo = [
      V.nodo({ malla: MA.capsula(0.062, 0.07, 0.2, 16), pos: [0, 0.3, 0], mat: mP }),                 // cuello grueso
      ell(mCapa, [0.15, 0.1, 0.27], [-0.01, 0.02, 0]), ell(mCapa, [0.1, 0.1, 0.12], [-0.01, 0.16, 0.14]), ell(mCapa, [0.1, 0.1, 0.12], [-0.01, 0.16, -0.14]),   // hombros
      ell(mCapa, [0.13, 0.2, 0.2], [-0.02, -0.18, 0]),                                                // pecho
      ell(mP, [0.05, 0.05, 0.09], [0.07, 0.24, 0]),                                                   // garganta abierta
    ];
    const cap = [{ malla: MA.esfera(14), m: V.m4.mul(V.m4.tras(0.01, 0.2, 0), V.m4.esc(0.09, 0.05, 0.19)) }]; const rc = VE.rng('neacuello');
    for (let i = 0; i < 18; i++) { const a = i / 17 * PI * 1.9 - PI * 0.95; cap.push({ malla: MA.esfera(12), m: V.m4.mul(V.m4.tras(-0.02 + Math.cos(a) * 0.05, 0.215 + rc() * 0.02, Math.sin(a) * 0.14), V.m4.esc(0.05, 0.036, 0.05)) }); }   // cuello de piel
    cuerpo.push(V.nodo({ malla: MA.fusionar(cap, 'nea|cuello|v1'), mat: mCapa }));
    const col = V.nodo({ pos: [0.085, 0.215, 0], rot: [0, 0, -0.12], hijos: [V.nodo({ malla: MA.toro(0.052, 0.003, 24, 8), rot: [0, 0, PI / 2 - 0.1], esc: [1, 1, 1], mat: liso('#6a5236') })] });   // cordon
    cuerpo.push(col);
    for (let i = -2; i <= 2; i++) cuerpo.push(V.nodo({ malla: MA.cilindro(0.008, 0, 0.05, 8), pos: [0.128 - Math.abs(i) * 0.011, 0.16 - Math.abs(i) * 0.004, i * 0.017], rot: [0, 0, PI + 0.25], mat: liso('#efe6d0', { esp: 0.6, dureza: 60 }) }));   // garras
    return V.nodo({ nombre: 'neandertal', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ rot: [0, 0, 0], hijos: [...cuerpo, cabNodo] })] });
  };

  /* ================================================================== MAMUT */
  MO.mamut = function (o = {}) {
    const texPelaje = V.textura('mam|pelo', 1024, 512, (x, W, H) => {
      x.fillStyle = '#4f3320'; x.fillRect(0, 0, W, H);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(30,18,10,0.45)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(120,80,44,0.35)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      pelo(x, W, H, 26000, ['#2b1a0f', '#5e3d22', '#8a5d34', '#3a2415', '#a47544', '#1d1109'], 64, 'mamuto');
      const r = VE.rng('mammanchas'); for (let i = 0; i < 40; i++) { x.globalAlpha = 0.14; x.fillStyle = r() < 0.5 ? '#150b05' : '#9b6c3c'; x.beginPath(); x.ellipse(r() * W, r() * H, 20 + r() * 70, 8 + r() * 28, r() * 3, 0, TAU); x.fill(); } x.globalAlpha = 1;
    });
    const texTrompa = V.textura('mam|trompa', 256, 512, (x, W, H) => {
      x.fillStyle = '#5a4030'; x.fillRect(0, 0, W, H); const r = VE.rng('mamtrompa');
      for (let k = 0; k < 46; k++) { const y = (k + r() * 0.3) / 46 * H; x.strokeStyle = `rgba(30,18,10,${0.35 + r() * 0.3})`; x.lineWidth = 2 + r() * 2; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(W * 0.3, y + 4, W * 0.7, y - 4, W, y + r() * 3); x.stroke();
        x.strokeStyle = 'rgba(150,115,90,0.25)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, y + 4); x.lineTo(W, y + 4); x.stroke(); }
      pelo(x, W, H * 0.35, 1400, ['#2b1a0f', '#6e4a2a', '#8a5d34'], 40, 'mamtrompapelo');
      for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(20,12,8,${r() * 0.15})`; x.fillRect(r() * W, r() * H, 2, 2); }
    });
    const texMarfil = V.textura('mam|marfil', 128, 512, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#b9a37a'); g.addColorStop(0.45, '#efe2c2'); g.addColorStop(1, '#a08a62'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = VE.rng('mammarfil'); for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(${r() < 0.5 ? '110,86,50' : '255,248,225'},${0.06 + r() * 0.12})`; x.lineWidth = 1 + r(); const x0 = r() * W; x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 + (r() - 0.5) * 8, H); x.stroke(); }
      const gp = x.createLinearGradient(0, H * 0.7, 0, H); gp.addColorStop(0, 'rgba(70,52,30,0)'); gp.addColorStop(1, 'rgba(70,52,30,0.5)'); x.fillStyle = gp; x.fillRect(0, H * 0.7, W, H * 0.3);
    });
    const mF = { color: '#ffffff', mapa: texPelaje, esp: 0.04, dureza: 10, envolver: 0.5, borde: 0.3 };
    const mT = { color: '#ffffff', mapa: texTrompa, esp: 0.08, dureza: 16, envolver: 0.4, borde: 0.25 };
    const mM = { color: '#ffffff', mapa: texMarfil, esp: 0.45, dureza: 50, envolver: 0.3, borde: 0.3 };
    const marcha = o.marcha || 'quieto', ph = (o.fase || 0) * TAU, camina = marcha === 'camina', sn = Math.sin, cs = Math.cos;
    const bob = camina ? 0.035 * sn(2 * ph) : 0.006 * sn(ph * 0.5), cab = (o.cab || 0) + (camina ? 0.03 * sn(ph) : 0), tr = o.trompa == null ? 0 : o.trompa;
    const yb = 2.1 + bob;
    /* ---- patas: columnas peludas con faldon; diagonales opuestas ---- */
    const pata = (x, z, fase) => {
      const a = camina ? 0.42 * sn(ph + fase) : 0, lev = camina ? Math.max(0, sn(ph + fase + 1.6)) * 0.26 : 0;
      return V.nodo({ pos: [x, yb - 0.45 + lev * 0.55, z], rot: [0, 0, a], hijos: [
        V.nodo({ malla: MA.capsula(0.34, 0.28, 1.5, 18), mat: mF }),
        V.nodo({ pos: [0.0, -1.45, 0], rot: [0, 0, -a * 0.8], hijos: [ell(mF, [0.34, 0.2, 0.32], [0.02, -0.04, 0]), ell(liso('#2a1d14'), [0.3, 0.05, 0.27], [0.04, -0.2, 0])] }),
        ell(mF, [0.42, 0.36, 0.38], [0, -0.05, 0]) ] });
    };
    /* ---- cuerpo: cupula, joroba, lomo que cae y faldon de pelo ---- */
    const cuerpo = [
      ell(mF, [1.85, 1.0, 0.98], [0, 0, 0]),                                                          // tronco
      ell(mF, [0.95, 0.8, 0.85], [0.75, 0.62, 0], [0, 0, -0.15]),                                     // joroba
      ell(mF, [1.0, 0.9, 0.82], [-1.5, -0.08, 0], [0, 0, 0.2]),                                       // grupa
      ell(mF, [0.9, 1.0, 0.72], [1.75, 0.38, 0], [0, 0, 0.25]),                                       // cabeza con cupula
      ell(mF, [0.55, 0.7, 0.5], [2.15, -0.1, 0]),                                                     // frente y base de la trompa
    ];
    const falda = [], rf = VE.rng('mamfalda');
    for (let i = 0; i < 26; i++) { const u = i / 25, xx = (u - 0.45) * 3.3, lg = 0.55 + rf() * 0.5; falda.push({ malla: MA.esfera(12), m: V.m4.mul(V.m4.tras(xx, -0.78 - lg * 0.35, (rf() < 0.5 ? 1 : -1) * (0.55 + rf() * 0.25)), V.m4.esc(0.22, lg * 0.55, 0.14)) }); }
    cuerpo.push(V.nodo({ malla: MA.fusionar(falda, 'mam|falda|v1'), mat: mF }));
    /* ---- trompa: tubo con anillos que cuelga y se curva ---- */
    const pts = [], npt = 22;
    for (let i = 0; i < npt; i++) { const u = i / (npt - 1), cur = 0.5 + tr * 1.1; pts.push([2.45 + 0.35 * Math.sin(u * 2.2) * (1 + tr * 0.4), 0.1 - 2.0 * u + 0.2 * tr * Math.sin(u * PI) - 0.5 * tr * u * u, 0.05 * Math.sin(u * 5 + ph * 0.3)]); }
    pts[npt - 1][0] += 0.25 * tr; pts[npt - 1][1] += 0.4 * tr;
    const tromp = V.nodo({ malla: MA.tubo(pts.map(p => [p[0], p[1], p[2]]), (u) => 0.30 - 0.19 * u + 0.015 * sn(u * 40), 16, { dinamica: 'mam|trompa' }), mat: mT });
    cuerpo.push(tromp, ell(liso('#1a100a'), [0.06, 0.04, 0.06], [pts[npt - 1][0] + 0.02, pts[npt - 1][1] - 0.03, 0]));
    /* ---- colmillos: dos arcos de marfil que bajan, avanzan y suben hacia dentro ---- */
    for (const s of [1, -1]) { const tp = []; for (let i = 0; i < 26; i++) { const u = i / 25; tp.push([2.05 + 1.45 * Math.sin(u * 1.75) * 1.0 + 0.1 * u, -0.5 - 0.75 * Math.sin(u * 2.2) * (1 - u * 0.15) + 0.05 * u, s * (0.52 - 0.34 * sm(0.45, 1, u) + 0.12 * Math.sin(u * 3))]); }
      cuerpo.push(V.nodo({ malla: MA.tubo(tp, (u) => 0.115 * (1 - 0.82 * Math.pow(u, 1.6)) + 0.012, 14, { clave: 'mam|colmillo|' + s }), mat: mM })); }
    /* ---- ojo pequeño, orejas, cola ---- */
    for (const s of [1, -1]) {
      cuerpo.push(ell(mF, [0.1, 0.15, 0.07], [1.6, 0.35, s * 0.82], [s * 0.2, s * 0.2, 0.1]));        // oreja pequeña
      cuerpo.push(ell(liso('#1a0f09', { esp: 0.2 }), [0.065, 0.06, 0.05], [2.2, 0.28, s * 0.52]));      // cuenca
      cuerpo.push(ell(liso('#3a2412', { esp: 0.7, dureza: 80 }), [0.036, 0.036, 0.03], [2.25, 0.285, s * 0.545]));   // iris
      cuerpo.push(ell(liso('#050302', { esp: 0.9, dureza: 100 }), [0.016, 0.016, 0.014], [2.28, 0.287, s * 0.565]));   // pupila
      cuerpo.push(ell(mF, [0.12, 0.04, 0.09], [2.23, 0.37, s * 0.54], [s * 0.1, s * 0.2, 0]));         // ceja de pelo
    }
    cuerpo.push(V.nodo({ malla: MA.capsula(0.06, 0.04, 0.55, 10), pos: [-2.3, 0.1, 0], rot: [0, 0, 0.25], mat: mF }));
    const raiz = V.nodo({ pos: [0, yb, 0], rot: [0, 0, 0.0 + cab * 0.0], hijos: cuerpo });
    return V.nodo({ nombre: 'mamut', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [raiz, pata(1.2, 0.5, 0), pata(1.2, -0.5, PI), pata(-1.3, 0.55, PI), pata(-1.3, -0.55, 0)] });
  };

  /* ================================================================== CEREBRO (dos hemisferios con circunvoluciones, cerebelo y tronco) y HACHA de mano */
  MO.cerebro = function (o = {}) {
    const tex = V.textura('cerebro|piel', 1024, 512, (x, W, H) => {
      x.fillStyle = '#d9a39f'; x.fillRect(0, 0, W, H); const r = VE.rng('cerebro');
      for (let i = 0; i < 500; i++) { const cx = r() * W, cy = r() * H, rr = 8 + r() * 34, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); const c = r() < 0.5 ? '236,190,184' : '176,108,112'; g.addColorStop(0, `rgba(${c},${0.1 + r() * 0.14})`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      x.lineCap = 'round'; x.lineJoin = 'round';
      for (let k = 0; k < 260; k++) { let px = r() * W, py = r() * H, a = r() * TAU; x.strokeStyle = `rgba(112,52,62,${0.45 + r() * 0.4})`; x.lineWidth = 2 + r() * 3; x.beginPath(); x.moveTo(px, py);
        for (let j = 0; j < 10; j++) { a += (r() - 0.5) * 2.2; px += Math.cos(a) * (8 + r() * 12); py += Math.sin(a) * (8 + r() * 12); x.lineTo(px, py); } x.stroke();
        x.strokeStyle = 'rgba(244,208,200,0.35)'; x.lineWidth = 1.4; x.stroke(); }
      for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(150,50,60,0.5)'; x.lineWidth = 1; const x0 = r() * W, y0 = r() * H; x.beginPath(); x.moveTo(x0, y0); x.bezierCurveTo(x0 + 20, y0 - 30, x0 + 40, y0 + 30, x0 + 70, y0 + (r() - 0.5) * 30); x.stroke(); }   // venas finas
    });
    const texCb = V.textura('cerebro|cerebelo', 256, 256, (x, W, H) => { x.fillStyle = '#c98f8c'; x.fillRect(0, 0, W, H); for (let k = 0; k < 46; k++) { x.strokeStyle = `rgba(100,45,55,${0.3 + (k % 3) * 0.12})`; x.lineWidth = 2; x.beginPath(); x.moveTo(0, k * 5.6); x.bezierCurveTo(W * 0.3, k * 5.6 + 5, W * 0.6, k * 5.6 - 5, W, k * 5.6); x.stroke(); } });
    const mC = { color: '#ffffff', mapa: tex, esp: 0.5, dureza: 40, envolver: 0.4, borde: 0.35 }, mCb = { color: '#ffffff', mapa: texCb, esp: 0.3, dureza: 30, envolver: 0.4 };
    const pu = 1 + (o.pulso || 0);
    return V.nodo({ nombre: 'cerebro', pos: o.pos, rot: o.rot, esc: (o.esc == null ? 1 : o.esc) * pu, hijos: [
      ell(mC, [0.092, 0.07, 0.056], [0.0, 0.02, 0.05]), ell(mC, [0.092, 0.07, 0.056], [0.0, 0.02, -0.05]),                  // hemisferios
      ell(mC, [0.07, 0.05, 0.05], [0.0, 0.06, 0.0]),                                                                       // union superior
      ell(mCb, [0.045, 0.032, 0.06], [-0.07, -0.04, 0]), ell(liso('#d4a9a0', { esp: 0.3 }), [0.018, 0.05, 0.018], [-0.0, -0.06, 0], [0, 0, -0.35]) ] });
  };
  MO.hacha = function (o = {}) {
    const tex = V.textura('hacha|piedra', 256, 256, (x, W, H) => { x.fillStyle = '#8c8272'; x.fillRect(0, 0, W, H); const r = VE.rng('hacha');
      for (let i = 0; i < 90; i++) { x.globalAlpha = 0.18; x.fillStyle = r() < 0.5 ? '#4f483d' : '#cfc4ad'; x.beginPath(); x.moveTo(r() * W, r() * H); for (let j = 0; j < 4; j++) x.lineTo(r() * W, r() * H); x.fill(); } x.globalAlpha = 1; });
    const poli = [[0, 0.1], [0.045, 0.06], [0.07, -0.005], [0.06, -0.06], [0.03, -0.095], [0, -0.105], [-0.03, -0.095], [-0.06, -0.06], [-0.07, -0.005], [-0.045, 0.06]];
    return V.nodo({ nombre: 'hacha', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ malla: MA.extrusion(poli, 0.03, 'hacha|bifaz'), mat: { color: '#ffffff', mapa: tex, esp: 0.18, dureza: 22, envolver: 0.35, borde: 0.3 } })] });
  };
  MO.mamut.cabeza = (o = {}) => { const p = o.pos || [0, 0, 0], e = o.esc == null ? 1 : o.esc, ry = (o.rot && o.rot[1]) || 0; return [p[0] + Math.cos(ry) * 2.1 * e, p[1] + 2.6 * e, p[2] - Math.sin(ry) * 2.1 * e]; };

  /* ================================================================== BAIJI (delfin del Yangtse) */
  const texBaiji = () => V.textura('baiji|piel', 1024, 256, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5f7388'); g.addColorStop(0.22, '#6f8499'); g.addColorStop(0.42, '#9bacb9'); g.addColorStop(0.55, '#dfe6e8'); g.addColorStop(0.75, '#f1f3f1'); g.addColorStop(0.95, '#dfe6e8'); g.addColorStop(1, '#6f8499');
    x.fillStyle = g; x.fillRect(0, 0, W, H); const r = VE.rng('baijipiel');
    for (let i = 0; i < 900; i++) { const cx = r() * W, cy = r() * H, rr = 4 + r() * 22, gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); const c = r() < 0.5 ? '70,90,110' : '230,238,242'; gg.addColorStop(0, `rgba(${c},${0.04 + r() * 0.08})`); gg.addColorStop(1, `rgba(${c},0)`); x.fillStyle = gg; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }   // manchas de la piel
    x.lineCap = 'round'; for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(235,242,246,${0.12 + r() * 0.22})`; x.lineWidth = 0.7 + r() * 1.2; const x0 = r() * W, y0 = r() * H * 0.6; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + 8 + r() * 30, y0 + (r() - 0.5) * 6); x.stroke(); }   // rasguños claros
    x.strokeStyle = 'rgba(30,38,46,0.85)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(W * 0.8, H * 0.5); x.bezierCurveTo(W * 0.88, H * 0.48, W * 0.94, H * 0.52, W, H * 0.5); x.stroke();   // linea de la boca (rostro)
    x.fillStyle = 'rgba(40,52,62,0.55)'; for (let i = 0; i < 18; i++) { x.fillRect(W * (0.84 + i * 0.008), H * 0.505, 1.4, 3); }                                                                               // dientes pequeños
  });
  const BAIJI_L = 2.2;
  const radio = (u) => {                                                                   // radio del cuerpo en u (0 cola -> 1 punta del rostro)
    if (u < 0.12) return 0.012 + 0.05 * sm(0, 0.12, u);
    if (u < 0.46) return 0.062 + 0.118 * sm(0.12, 0.46, u);
    if (u < 0.68) return 0.18 - 0.03 * sm(0.46, 0.68, u);
    if (u < 0.78) return 0.15 - 0.045 * sm(0.68, 0.78, u) + 0.028 * Math.sin(PI * sm(0.7, 0.8, u));            // cuello y frente (melon)
    if (u < 0.84) return 0.105 - 0.062 * sm(0.78, 0.84, u) + 0.045 * Math.sin(PI * sm(0.76, 0.84, u));
    return 0.043 - 0.0285 * sm(0.84, 1, u);                                                  // rostro largo y fino
  };
  MO.baiji = function (o = {}) {
    const t = o.t || 0, s = o.escala == null ? 1 : o.escala, L = BAIJI_L * s, amp = (o.amp == null ? 0.07 : o.amp) * s, fase = (o.vel == null ? 3.4 : o.vel) * t, id = o.id || 'b';
    const ys = (u) => amp * Math.sin(u * 4.2 - fase) * Math.pow(1 - u, 1.15) * (0.4 + 0.6 * (1 - u));
    const xs = (u) => (u - 0.5) * L;
    const lev = (u) => 0.1 * s * sm(0.86, 1, u);                                            // rostro levantado
    const cl = (u) => [xs(u), ys(u) + lev(u)];
    const malla = MA.parametrica(90, 24, (u, v) => { const r = radio(u) * s, a = v * TAU, p = cl(u), q = cl(Math.min(1, u + 0.005)), p0 = cl(Math.max(0, u - 0.005)), ang = Math.atan2(q[1] - p0[1], q[0] - p0[0]);
      const cy = r * 1.0 * Math.sin(a) * (Math.sin(a) < 0 ? 0.95 : 1.05), cz = r * Math.cos(a) * (u > 0.84 ? 1.12 : 1.0);
      return [p[0] - Math.sin(ang) * cy, p[1] + Math.cos(ang) * cy, cz]; }, { dinamica: 'baiji|' + id });
    const mat = { color: '#ffffff', mapa: texBaiji(), esp: 0.5, dureza: 46, envolver: 0.35, borde: 0.3 };
    const hijos = [V.nodo({ malla, mat })];
    const ang = (u) => { const p = cl(Math.max(0, u - 0.01)), q = cl(Math.min(1, u + 0.01)); return Math.atan2(q[1] - p[1], q[0] - p[0]); };
    const skin = liso('#6f8499', { esp: 0.4, dureza: 40, envolver: 0.35 });
    /* ojo diminuto, alto en la cabeza */
    const ue = 0.805, pe = cl(ue), re = radio(ue) * s;
    for (const k of [1, -1]) { hijos.push(ell(liso('#10161c', { esp: 0.85, dureza: 90 }), [0.0095 * s, 0.0095 * s, 0.0075 * s], [pe[0] + 0.006 * s, pe[1] + re * 0.2, k * re * 0.9], null)); }
    hijos.push(ell(liso('#0b1014', { esp: 0.3 }), [0.02 * s, 0.004 * s, 0.014 * s], [xs(0.735), ys(0.735) + radio(0.735) * s * 1.04, 0.01 * s]));   // orificio respiratorio
    /* aleta dorsal baja y triangular */
    const ud = 0.48, pd = cl(ud), ad = ang(ud);
    hijos.push(V.nodo({ pos: [pd[0], pd[1] + radio(ud) * s * 0.98, 0], rot: [0, 0, ad - 0.62], hijos: [ell(skin, [0.115 * s, 0.045 * s, 0.011 * s], [0.0, 0.02 * s, 0])] }));
    /* aletas pectorales anchas y redondeadas */
    const ap = (o.aleta || 0) + 0.18 * Math.sin(fase * 0.9);
    for (const k of [1, -1]) { const up = 0.67, pp = cl(up); hijos.push(V.nodo({ pos: [pp[0], pp[1] - radio(up) * s * 0.75, k * radio(up) * s * 0.85], rot: [k * (0.55 + ap), k * -0.35, ang(up) - 0.45], hijos: [ell(skin, [0.14 * s, 0.014 * s, 0.075 * s], [-0.07 * s, 0, 0])] })); }
    /* cola: dos lobulos horizontales siguiendo el extremo */
    const p0 = cl(0.02), a0 = ang(0.02);
    for (const k of [1, -1]) hijos.push(V.nodo({ pos: [p0[0] - 0.015 * s, p0[1], 0], rot: [0, k * 0.28, a0 + 0.04 * Math.sin(fase)], hijos: [ell(skin, [0.085 * s, 0.012 * s, 0.17 * s], [-0.02 * s, 0, k * 0.115 * s], [0, 0, 0])] }));
    return V.nodo({ nombre: 'baiji', pos: o.pos, rot: o.rot, hijos });
  };
  MO.baiji.cabeza = (o = {}) => { const p = o.pos || [0, 0, 0], s = o.escala == null ? 1 : o.escala, ry = (o.rot && o.rot[1]) || 0, d = 0.3 * BAIJI_L * s; return [p[0] + Math.cos(ry) * d, p[1] + 0.1 * s, p[2] - Math.sin(ry) * d]; };
})(window.VE);
