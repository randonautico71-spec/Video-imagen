/* VOLUMEN — GORILA DE ESPALDA PLATEADA (unidades: metros; mira a +X, apoyado en y = 0, +Z lado). Piel de pelo pintada una vez
   (negro pardo, silla plateada en el lomo y los muslos, pelo largo en los brazos), cara de piel negra brillante con cresta sagital,
   arcos de las cejas, ojos hundidos, nariz ancha con fosas, mandibula potente, colmillos, manos con nudillos y pies anchos.
     V.modelos.gorila({ erguido, golpe, boca, cab, brazoI, brazoD, marcha, fase, edad, pos, rot, esc })
        erguido 0..1  (0 = apoyado en los nudillos, 1 = de pie con el torso casi vertical)
        golpe 0..1    (ciclo del golpe de pecho: el puño derecho/izquierdo sube y baja; se pasa t*frecuencia mod 1 en 'golpeFase')
        golpeFase     fase del golpe (vueltas) · boca 0..1 (mandibula abierta, rugido) · cab (rad, + = mira arriba)
        brazoI / brazoD  [hombro, codo] en rad para forzar una pose · marcha 'quieto'|'camina' + fase (vueltas)
        plata 0..1 (cantidad de pelo plateado; 1 = macho maduro)
   Convenio: como el felino: rz > 0 balancea un miembro que cuelga de -Y hacia +X. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI;
  const c01 = (v) => Math.max(0, Math.min(1, v)), sn = Math.sin, cs = Math.cos;
  MO.gorila = function (o = {}) {
    const rng0 = 'gorila';
    const plata = o.plata == null ? 1 : o.plata;
    const mt = (mapa, extra) => Object.assign({ color: '#ffffff', mapa, esp: 0.08, dureza: 14, envolver: 0.55, borde: 0.6 }, extra || {});
    const liso = (c, e) => Object.assign({ color: c, esp: 0.35, dureza: 40, envolver: 0.25 }, e || {});
    // ---------------------------------------------------------------- pelo a trazos (una vez)
    const pelo = (x, W, H, n, cols, largo, ancho) => {
      const r = VE.rng('pelo|' + W + '|' + cols.join('') + '|' + n); x.lineCap = 'round';
      for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, l = largo * (0.5 + r()), c = cols[Math.floor(r() * cols.length)];
        x.globalAlpha = 0.12 + r() * 0.3; x.strokeStyle = c; x.lineWidth = (ancho || 1) * (0.6 + r() * 1.1); x.beginPath(); x.moveTo(x0, y0);
        x.quadraticCurveTo(x0 + (r() - 0.5) * 4, y0 + l * 0.5, x0 + (r() - 0.5) * 5, y0 + l); x.stroke(); }
      x.globalAlpha = 1;
    };
    const NEG = '#15120f', PARDO = '#221a15', PARDO2 = '#30261d', PLATA = '#bdbcb4', PLATA2 = '#8e8d88';
    // cuerpo: u = vuelta (dorso en 0,25 · lado en 0 · vientre en 0,75), v = largo (0 cola, 1 pecho)
    const texCuerpo = V.textura('gor|cuerpo|' + plata, 1024, 512, (x, W, H) => {
      x.fillStyle = PARDO; x.fillRect(0, 0, W, H);
      pelo(x, W, H, 30000, [NEG, PARDO, PARDO2, NEG], 16, 1.3);
      // silla plateada: franja en el dorso (u 0.25) que cubre desde el cuello hasta la grupa y baja por los muslos
      if (plata > 0) {
        const r = VE.rng('silla');
        for (let i = 0; i < 26000; i++) {
          const v = 0.12 + r() * 0.78, ancho = 0.12 + 0.12 * Math.sin(v * 3.1), du = (r() - 0.5) * 2 * ancho, u = 0.25 + du, falda = 1 - Math.abs(du) / ancho;
          if (r() > Math.pow(falda, 1.6) * plata) continue;
          x.globalAlpha = 0.25 + r() * 0.5; x.strokeStyle = r() < 0.55 ? PLATA : PLATA2; x.lineWidth = 0.8 + r() * 1.3;
          const px = u * W, py = (1 - v) * H; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + (r() - 0.5) * 4, py + 8, px + (r() - 0.5) * 5, py + 15 + r() * 6); x.stroke();
        }
        x.globalAlpha = 1;
      }
      // vientre y pecho: piel de pelo mas ralo y oscuro
      const g = x.createLinearGradient(W * 0.6, 0, W * 0.9, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(10,7,5,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(W * 0.6, 0, W * 0.3, H);
    });
    const texBrazo = V.textura('gor|brazo', 256, 256, (x, W, H) => {
      x.fillStyle = PARDO; x.fillRect(0, 0, W, H); pelo(x, W, H, 9000, [NEG, PARDO, PARDO2, '#554332'], 30, 1.6);
    });
    const texPierna = V.textura('gor|pierna', 256, 256, (x, W, H) => {
      x.fillStyle = PARDO; x.fillRect(0, 0, W, H); pelo(x, W, H, 7000, [NEG, PARDO, PARDO2], 20, 1.4);
      if (plata > 0) { const r = VE.rng('mus'); for (let i = 0; i < 2400; i++) { x.globalAlpha = 0.2 + r() * 0.4; x.strokeStyle = r() < 0.5 ? PLATA2 : PLATA; x.lineWidth = 1; const px = r() * W, py = r() * H * 0.55; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 3, py + 14); x.stroke(); } x.globalAlpha = 1; }
    });
    const texCuero = V.textura('gor|cuero', 256, 256, (x, W, H) => {   // piel desnuda: cara, manos, pies
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b2522'); g.addColorStop(1, '#171311'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = VE.rng('cuero'); for (let i = 0; i < 2600; i++) { x.globalAlpha = 0.1 + r() * 0.22; x.fillStyle = r() < 0.5 ? '#4b423c' : '#0c0908'; x.beginPath(); x.arc(r() * W, r() * H, 0.6 + r() * 2.4, 0, 7); x.fill(); }
      x.globalAlpha = 0.18; x.strokeStyle = '#59504a'; x.lineWidth = 1.2; for (let i = 0; i < 70; i++) { const y = r() * H; x.beginPath(); x.moveTo(r() * W * 0.3, y); x.bezierCurveTo(W * 0.35, y + (r() - 0.5) * 14, W * 0.65, y + (r() - 0.5) * 14, W * (0.7 + r() * 0.3), y + (r() - 0.5) * 8); x.stroke(); }
      x.globalAlpha = 1;
    });
    const texCab = V.textura('gor|cabeza', 512, 256, (x, W, H) => {   // pelo de la corona (pardo rojizo en la cresta), carrillos con pelo largo
      x.fillStyle = '#3a2a1f'; x.fillRect(0, 0, W, H); pelo(x, W, H, 14000, ['#241912', '#4a3425', '#5c4430', NEG], 18, 1.4);
    });
    const mCuerpo = mt(texCuerpo), mBrazo = mt(texBrazo), mPierna = mt(texPierna), mCuero = mt(texCuero, { esp: 0.3, dureza: 30, envolver: 0.35, borde: 0.55 }), mCab = mt(texCab);
    // ---------------------------------------------------------------- pose
    const ph = (o.fase || 0) * 2 * PI, erg = c01(o.erguido || 0), boca = c01(o.boca || 0), gp = o.golpeFase == null ? 0 : o.golpeFase * 2 * PI, gol = c01(o.golpe || 0);
    const pitch = 0.3 * (1 - erg) + erg * 1.28 + 0.015 * sn(ph * 0.5), cab = (o.cab == null ? 0 : o.cab) - pitch * 0.9;
    const marcha = o.marcha || 'quieto';
    const bob = marcha === 'camina' ? 0.018 * Math.abs(sn(ph)) : 0.004 * sn(ph * 0.5 + 1);
    // brazos [hombro, codo]; reposo apoyado en nudillos: cuelgan casi rectos y adelantados
    const rest = -pitch + 0.09;
    let bI = [rest, -0.1], bD = [rest, -0.1];
    if (marcha === 'camina') { bI = [rest + 0.5 * sn(ph), -0.1 - 0.3 * Math.max(0, sn(ph + 1.5))]; bD = [rest - 0.5 * sn(ph), -0.1 - 0.3 * Math.max(0, -sn(ph + 1.5))]; }
    if (erg > 0) { bI = [bI[0] + 0.15 * erg, bI[1] - 0.25 * erg]; bD = [bD[0] + 0.15 * erg, bD[1] - 0.25 * erg]; }
    if (gol > 0) {   // golpe de pecho: los puños suben al pecho y baten alternados (hombro hacia delante, codo flexionado)
      const a = (s) => 0.5 + 0.5 * sn(gp + s), I = a(0), D = a(PI);
      bI = [-pitch + 0.55 + 0.35 * I, 1.75 - 0.3 * I]; bD = [-pitch + 0.55 + 0.35 * D, 1.75 - 0.3 * D];
      bI = [bI[0] * gol + rest * (1 - gol), bI[1] * gol - 0.1 * (1 - gol)]; bD = [bD[0] * gol + rest * (1 - gol), bD[1] * gol - 0.1 * (1 - gol)];
    }
    if (o.brazoI) bI = o.brazoI; if (o.brazoD) bD = o.brazoD;
    // ---------------------------------------------------------------- piezas
    const elip = (mat, esc3, pos, rot) => V.nodo({ malla: MA.esfera(28), esc: esc3, pos: pos || [0, 0, 0], rot, mat });
    const eje = (a, b, c, pos, mat) => V.nodo({ malla: MA.esfera(40), esc: [a, b, c], pos, rot: [0, 0, PI / 2], mat });
    const dedo = (pos, rz, largo, r) => V.nodo({ pos, rot: [0, 0, rz], hijos: [V.nodo({ malla: MA.capsula(r, r * 0.85, largo, 12), mat: mCuero }), V.nodo({ pos: [0, -largo, 0], rot: [0, 0, 0.9], hijos: [V.nodo({ malla: MA.capsula(r * 0.85, r * 0.7, largo * 0.8, 12), mat: mCuero })] })] });
    const brazo = (z, ang) => {
      const L1 = 0.42, L2 = 0.44, r1 = 0.15, r2 = 0.112;
      const mano = V.nodo({ pos: [0, -L2, 0], rot: [0, 0, 0.1], hijos: [
        elip(mCuero, [0.15, 0.1, 0.125], [0.03, -0.06, 0]),                                       // palma y dorso
        ...[-0.065, -0.022, 0.022, 0.065].map((dz) => V.nodo({ pos: [0.1, -0.12, dz * 1.05], rot: [0, 0, -1.45], hijos: [V.nodo({ malla: MA.capsula(0.04, 0.034, 0.09, 12), mat: mCuero }), V.nodo({ pos: [0, -0.09, 0], rot: [0, 0, 0.6], hijos: [V.nodo({ malla: MA.capsula(0.034, 0.028, 0.07, 12), mat: mCuero })] })] })),
        V.nodo({ pos: [0.05, -0.04, z > 0 ? -0.1 : 0.1], rot: [0, 0, -0.9], hijos: [V.nodo({ malla: MA.capsula(0.03, 0.025, 0.07, 10), mat: mCuero })] })] });   // pulgar
      const ante = V.nodo({ pos: [0, -L1, 0], rot: [0, 0, ang[1]], hijos: [elip(mBrazo, [r2 * 1.25, r2 * 1.2, r2 * 1.25], [0, 0.02, 0]), V.nodo({ malla: MA.capsula(r2 * 1.12, r2 * 0.82, L2, 20), mat: mBrazo }), mano] });
      const fleco = [0, 1, 2, 3, 4].map((i) => elip(mBrazo, [0.04, 0.12, 0.055], [-0.1, -0.06 - 0.17 * i, 0], [0, 0, 0.12]));
      return V.nodo({ pos: [0.42, 0.22, z * 0.44], rot: [0, 0, ang[0]], hijos: [
        elip(mBrazo, [0.19, 0.2, 0.17], [0, 0.01, 0]),                                          // hombro/deltoides enorme
        V.nodo({ malla: MA.capsula(r1 * 1.15, r1 * 0.9, L1, 22), mat: mBrazo }), ...fleco.slice(0, 2), V.nodo({ pos: [0, -L1, 0], rot: [0, 0, ang[1]], hijos: fleco.slice(2).map((f, i) => V.nodo({ pos: [0, 0.4 - 0.1 * i, 0], hijos: [f] })) }), ante] });
    };
    const pierna = (z, s) => {
      const t1 = 0.36, t2 = 0.34, base = -pitch, rodilla = 0.55 + erg * 0.22 + (marcha === 'camina' ? 0.25 * Math.max(0, sn(ph + s)) : 0);
      const pie = V.nodo({ pos: [0, -t2, 0], rot: [0, 0, -base + rodilla * 0.75], hijos: [
        elip(mCuero, [0.17, 0.05, 0.095], [0.1, -0.03, 0]),
        ...[-0.045, -0.015, 0.015, 0.045].map((dz) => elip(mCuero, [0.03, 0.026, 0.02], [0.27, -0.035, dz * 1.6])),
        elip(mCuero, [0.045, 0.03, 0.03], [0.23, -0.02, z > 0 ? -0.05 : 0.05])] });
      const baja = V.nodo({ pos: [0, -t1, 0], rot: [0, 0, -rodilla], hijos: [elip(mPierna, [0.1, 0.1, 0.1], [0, 0.02, 0]), V.nodo({ malla: MA.capsula(0.105, 0.075, t2, 18), mat: mPierna }), pie] });
      return V.nodo({ pos: [-0.26, -0.05, z], rot: [0, 0, base + rodilla * 0.25], hijos: [elip(mPierna, [0.22, 0.24, 0.17], [0, 0.0, 0]), V.nodo({ malla: MA.capsula(0.17, 0.105, t1, 22), mat: mPierna }), baja] });
    };
    // ---------------------------------------------------------------- cabeza
    const cabeza = () => {
      const h = [], nar = liso('#1a1412', { esp: 0.25, dureza: 25, envolver: 0.4 });
      h.push(elip(mCab, [0.21, 0.2, 0.185], [0, 0.03, 0]));                                            // craneo
      h.push(elip(mCab, [0.2, 0.1, 0.075], [-0.03, 0.2, 0], [0, 0, 0.15]));                             // cresta sagital (corona alta)
      h.push(elip(mCab, [0.14, 0.16, 0.2], [-0.13, 0.04, 0]));                                          // nuca
      h.push(elip(mCuero, [0.11, 0.155, 0.165], [0.15, -0.01, 0]));                                    // mascara de la cara
      h.push(elip(mCuero, [0.07, 0.048, 0.205], [0.205, 0.088, 0], [0, 0, 0.05]));                      // arcos de las cejas (toro supraorbital)
      h.push(elip(mCuero, [0.14, 0.075, 0.135], [0.26, -0.095, 0]));                                   // hocico y labio superior
      h.push(elip(nar, [0.052, 0.062, 0.115], [0.315, -0.025, 0]));                                    // nariz ancha
      h.push(elip(mCuero, [0.05, 0.03, 0.12], [0.285, 0.03, 0], [0, 0, -0.3]));                         // puente de la nariz
      for (const s of [-1, 1]) {
        h.push(elip(liso('#030202', { esp: 0.1 }), [0.013, 0.026, 0.021], [0.362, -0.034, s * 0.046], [0, s * 0.4, 0]));                    // fosa nasal
        h.push(elip(liso('#0a0706', { esp: 0.1 }), [0.04, 0.03, 0.04], [0.245, 0.057, s * 0.08]));                                         // cuenca hundida
        h.push(elip(liso('#ede0c4', { esp: 0.7, dureza: 80 }), [0.022, 0.018, 0.02], [0.262, 0.056, s * 0.083], [0, s * 0.3, 0]));         // esclera
        h.push(elip(liso('#3a2210', { esp: 0.95, dureza: 120, emision: 0.1 }), [0.017, 0.017, 0.015], [0.272, 0.056, s * 0.086], [0, s * 0.3, 0]));   // iris pardo
        h.push(elip(liso('#020101', { esp: 1, dureza: 150 }), [0.009, 0.009, 0.008], [0.281, 0.056, s * 0.088], [0, s * 0.3, 0]));          // pupila
        h.push(elip(mCuero, [0.03, 0.012, 0.03], [0.265, 0.077, s * 0.083], [0, s * 0.3, s * 0.1]));                                       // parpado superior
        h.push(elip(mCab, [0.07, 0.11, 0.05], [-0.05, -0.02, s * 0.185], [s * 0.25, 0, 0]));                                              // patilla de pelo largo
        h.push(elip(mCuero, [0.03, 0.05, 0.016], [-0.04, 0.03, s * 0.2], [0, s * 0.3, 0]));                                               // oreja pequeña
        h.push(elip(mCab, [0.05, 0.018, 0.045], [0.23, 0.115, s * 0.09], [0, s * 0.3, s * 0.1]));                                         // pelo de la ceja
      }
      const mandi = V.nodo({ pos: [0.04, -0.13, 0], rot: [0, 0, -boca * 0.75], hijos: [
        elip(mCuero, [0.17, 0.07, 0.12], [0.17, -0.02, 0]), elip(mCuero, [0.09, 0.09, 0.15], [0.02, 0.04, 0]),
        elip(liso('#4a1b1e', { esp: 0.5 }), [0.12, 0.012 + boca * 0.04, 0.085], [0.2, 0.04, 0]),
        elip(liso('#b25a60', { esp: 0.5 }), [0.07, 0.016, 0.05], [0.2, 0.045, 0]),
        ...[-1, 1].map((s) => V.nodo({ malla: MA.cilindro(0, 0.016, 0.07 + 0.03 * boca, 8), pos: [0.29, 0.07, s * 0.04], mat: liso('#efe6cf', { esp: 0.6, dureza: 70 }) }))] });
      h.push(mandi);
      for (const s of [-1, 1]) h.push(V.nodo({ malla: MA.cilindro(0.017, 0, 0.075 + 0.03 * boca, 8), pos: [0.32, -0.135, s * 0.046], mat: liso('#efe6cf', { esp: 0.6, dureza: 70 }) }));
      h.push(elip(liso('#241615', { esp: 0.35 }), [0.095, 0.011, 0.125], [0.275, -0.15 - boca * 0.04, 0]));   // labio
      return V.nodo({ pos: [0.84, 0.3, 0], rot: [0, 0, cab], hijos: h });
    };
    // torso: una sola piel. Secciones elipticas a lo largo de X: [x, radio vertical, radio lateral, centro y]
    const SEC = [[-0.66, 0.02, 0.02, 0.02], [-0.6, 0.16, 0.2, 0.0], [-0.5, 0.3, 0.33, 0.0], [-0.3, 0.38, 0.4, 0.02], [-0.05, 0.42, 0.42, 0.0], [0.2, 0.44, 0.45, 0.06], [0.42, 0.46, 0.5, 0.23], [0.62, 0.4, 0.42, 0.33], [0.78, 0.27, 0.3, 0.37], [0.86, 0.12, 0.17, 0.33]];
    const interp = (t) => { const n = SEC.length - 1, f = t * n, i = Math.min(n - 1, Math.floor(f)), u = f - i, a = SEC[i], b = SEC[i + 1], w = u * u * (3 - 2 * u); return [0, 1, 2, 3].map((k) => a[k] + (b[k] - a[k]) * w); };
    const torsoMalla = MA.parametrica(56, 56, (u, v) => { const q = interp(v), th = u * 2 * PI; return [q[0], q[3] + q[1] * Math.sin(th), q[2] * Math.cos(th)]; }, { clave: 'gorila|torso|v2' });
    // ---------------------------------------------------------------- tronco (pivota en la cadera)
    const tronco = V.nodo({ pos: [-0.3, 0.6, 0], rot: [0, 0, pitch], hijos: [
      V.nodo({ pos: [0.3, 0, 0], hijos: [
        V.nodo({ malla: torsoMalla, mat: mCuerpo }),                                              // torso continuo: grupa, barriga, pecho, joroba y cuello
        brazo(1, bI)].concat([brazo(-1, bD), pierna(0.2, 0), pierna(-0.2, PI), cabeza()]) })] });
    // hombros: el brazo cuelga del torso (quedan dentro del nodo del torso)
    return V.nodo({ nombre: 'gorila', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ pos: [0, bob + (o.altura || 0), 0], hijos: [tronco] })] });
  };
  MO.gorila.cabeza = function (o = {}) { const p = o.pos || [0, 0, 0], e = o.esc == null ? 1 : (Array.isArray(o.esc) ? o.esc[0] : o.esc), ry = (o.rot && o.rot[1]) || 0, a = 1.28 * (o.erguido || 0); const dx = (0.66 + 0.66 * Math.cos(a) + 0.35) * e; return [p[0] + Math.cos(ry) * dx, p[1] + (0.6 + 0.7 * Math.sin(a) + 0.35) * e, p[2] - Math.sin(ry) * dx]; };
})(window.VE);
