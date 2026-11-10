/* PLATO: estilo de dibujo 2.5D (vectorial con volumen pintado) para noticias y entrevistas de TV.
   Personajes cabezones con ropa, expresiones y gestos; plato de television propio; publico; piezas graficas
   (tarjeta de cita, periodico generico, bocadillo, barras de audiencia, bandera de Ceuta, barrido de camara).
   Todo lo caro se HORNEA una vez (VE.real.hornear): por fotograma solo drawImage + la cara (unas pocas elipses).
   Sin ctx.filter ni shadowBlur.

   VE.plato.fondo(esc, t, cam)                       plato completo (pared, ventanales con ciudad, neones, suelo, alfombra, sillon, mesa)
   VE.plato.camara(esc, cam, fn)                     cam = {zoom, cx, cy}: punto del mundo (1080x1920) que queda en el centro
   VE.plato.personaje(esc, def, o)                   def = VE.plato.PERSONAS.<nombre> u objeto propio; o = {x, y, tam, pose:'pie'|'sentado',
                                                     expr:'neutro'|'sonrie'|'serio'|'enfadado'|'preocupado'|'triste', habla 0..1, sudor 0..1,
                                                     brazoD/brazoI (radianes; 0 = colgando, -1.4 = senalar hacia fuera), mira -1..1, t, espejo}
   VE.plato.mesa(esc)                                frente de la mesa del presentador (dibujar DESPUES del presentador)
   VE.plato.publico(esc, t, o)                       filas de publico de espaldas {y, filas, animo 0..1, semilla}
   VE.plato.cita(esc, txt, autor, cx, cy, o)         tarjeta blanca de cita con comillas grandes
   VE.plato.periodico(esc, medio, titular, cx, cy, o) recorte de periodico GENERICO (nombre del medio en texto, sin su maqueta)
   VE.plato.bocadillo(esc, txt, cx, cy, o)           globo de dialogo con pico
   VE.plato.barras(esc, datos, caja, o)              barras horizontales con contador animado
   VE.plato.ceuta(esc, cx, cy, w, o)                 bandera de Ceuta (gironada blanca y negra con escudo simplificado)
   VE.plato.barrido(esc, k, dir)                     desenfoque de movimiento de un barrido de camara (k 0..1), sin filtros: copias desplazadas
   Revision: demo/plato.html?modo=plato|personajes|piezas&lienzo=vertical */
(function (VE) {
  const P = VE.plato = {}, R = VE.real, PI = Math.PI, lerp = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v));
  const mez = (a, b, t) => R.mezcla(a, b, t), osc = (c, t) => R.oscurecer(c, t), acl = (c, t) => R.aclarar(c, t);
  const MUNDO = { W: 1080, H: 1920 };
  P.MUNDO = MUNDO;

  // ------------------------------------------------------------------ personas
  /* Rasgos de dibujo (caricatura amable). pelo: 'largo' | 'corto' | 'rapado'; barba: 'poblada' | 'recortada' | null */
  P.PERSONAS = {
    broncano: { piel: '#e8b28c', pelo: '#2b1f19', peinado: 'largo', barba: 'poblada', barbaCol: '#2b1f19', canas: 0,
      chaqueta: '#26272d', camisa: '#f4f4f2', pantalon: '#3e5f93', zapato: '#f2f2f2', suela: '#c9c9c9', cejas: '#24190f' },
    abascal: { piel: '#e3a985', pelo: '#3a3532', peinado: 'corto', barba: 'recortada', barbaCol: '#4a4541', canas: 0.45,
      chaqueta: '#1f2638', camisa: '#f7f7f5', pantalon: '#2c3243', zapato: '#5a3a24', suela: '#2b1b10', cejas: '#2b2622' }
  };

  const contorno = (x, col, w = 2.6) => { x.lineWidth = w; x.strokeStyle = col; x.stroke(); };
  const lin = (x, x0, y0, x1, y1, c0, c1) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  const rad = (x, cx, cy, r0, r, c0, c1) => { const g = x.createRadialGradient(cx, cy, r0, cx, cy, r); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  /* Motas de textura recortadas a la RUTA ACTUAL (llamar justo despues de rellenarla). */
  function motas(x, semilla, x0, y0, x1, y1, o) {
    const r = VE.rng(semilla); x.save(); x.clip(); const n = Math.round((x1 - x0) * (y1 - y0) / (o.dens || 30));
    for (let i = 0; i < n; i++) { const px = lerp(x0, x1, r()), py = lerp(y0, y1, r()), s = lerp(o.min || 0.8, o.max || 1.8, r());
      x.globalAlpha = (o.alfa || 0.25) * (0.4 + r() * 0.6); x.fillStyle = r() < (o.claras || 0.4) ? o.claro : o.oscuro;
      x.beginPath(); x.ellipse(px, py, s * 0.6, s * 1.8, (o.ang || 0) + (r() - 0.5) * 0.6, 0, 7); x.fill(); }
    x.restore();
  }
  function rr(x, X, Y, w, h, r) { VE.ruta.redondeado(x, X, Y, w, h, Math.min(r, w / 2, h / 2)); }

  /* Coordenadas locales del personaje: pies en (0,0), cabeza arriba (y negativa). Altura total ~ 400. */
  const CAB = { cx: 0, cy: -300, rx: 76, ry: 82 }, HOMBRO = { x: 60, y: -214 }, BRAZO_L = 108;
  const BAKE = 2.4;            // los sprites se hornean a 2,4x para que los primeros planos sigan nitidos

  function horneaLocal(esc, clave, x0, y0, x1, y1, fn) {
    const w = (x1 - x0) * BAKE, h = (y1 - y0) * BAKE;
    const s = R.hornear(esc, 'plato|' + clave, Math.ceil(w), Math.ceil(h), (x) => { x.scale(BAKE, BAKE); x.translate(-x0, -y0); fn(x); });
    return { s, x0, y0, x1, y1 };
  }
  function pegaLocal(x, b) { x.drawImage(b.s.img, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }

  function piernas(x, d, pose) {
    const borde = 'rgba(10,10,20,0.45)';
    if (pose === 'sentado') {
      // muslos hacia el espectador (escorzo) y espinillas que bajan
      [-1, 1].forEach(s => {
        x.beginPath(); x.moveTo(s * 6, -128); x.lineTo(s * 54, -128); x.lineTo(s * 60, -86); x.lineTo(s * 8, -84); x.closePath();
        x.fillStyle = lin(x, -60, -128, 60, -84, acl(d.pantalon, 0.12), osc(d.pantalon, 0.25)); x.fill(); contorno(x, borde);
        rr(x, s > 0 ? 12 : -56, -96, 44, 82, 16); x.fillStyle = lin(x, -60, -96, 60, -10, acl(d.pantalon, 0.06), osc(d.pantalon, 0.3)); x.fill(); contorno(x, borde);
        zapato(x, d, s * 34, -4);
      });
      return;
    }
    [-1, 1].forEach(s => {
      const X = s > 0 ? 4 : -48;
      rr(x, X, -132, 44, 124, 14); x.fillStyle = lin(x, -50, 0, 50, 0, acl(d.pantalon, 0.16), osc(d.pantalon, 0.28)); x.fill(); contorno(x, borde);
      x.save(); x.globalAlpha = 0.18; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(X + 30, -122); x.lineTo(X + 30, -20); x.stroke(); x.restore();
      zapato(x, d, s * 27, 0);
    });
  }
  function zapato(x, d, cx, y) {
    rr(x, cx - 29, y - 22, 58, 22, 11); x.fillStyle = lin(x, 0, y - 22, 0, y, acl(d.zapato, 0.2), osc(d.zapato, 0.15)); x.fill(); contorno(x, 'rgba(10,10,20,0.5)', 2.2);
    x.fillStyle = d.suela; x.fillRect(cx - 28, y - 6, 56, 5);
  }
  function torso(x, d) {
    const borde = 'rgba(8,8,18,0.55)';
    // camisa visible en el pico de la chaqueta
    x.beginPath(); x.moveTo(-26, -226); x.lineTo(26, -226); x.lineTo(14, -136); x.lineTo(-14, -136); x.closePath(); x.fillStyle = lin(x, 0, -226, 0, -136, d.camisa, osc(d.camisa, 0.12)); x.fill();
    // chaqueta (dos mitades con solapa)
    [-1, 1].forEach(s => {
      x.beginPath(); x.moveTo(s * 20, -230); x.quadraticCurveTo(s * 66, -232, s * 70, -206); x.lineTo(s * 62, -120); x.quadraticCurveTo(s * 40, -112, s * 4, -116); x.lineTo(s * 4, -150); x.lineTo(s * 24, -196); x.closePath();
      x.fillStyle = lin(x, -70, -230, 70, -116, acl(d.chaqueta, s < 0 ? 0.2 : 0.08), osc(d.chaqueta, s < 0 ? 0.05 : 0.35)); x.fill(); contorno(x, borde);
      x.beginPath(); x.moveTo(s * 20, -230); x.lineTo(s * 30, -206); x.lineTo(s * 16, -198); x.lineTo(s * 24, -170); x.lineTo(s * 6, -150); x.strokeStyle = acl(d.chaqueta, 0.25); x.lineWidth = 2.4; x.stroke();
    });
    x.fillStyle = acl(d.chaqueta, 0.3); [-140, -128].forEach(y => { x.beginPath(); x.arc(-9, y, 2.6, 0, 7); x.fill(); });
    // cuello de la camisa
    [-1, 1].forEach(s => { x.beginPath(); x.moveTo(s * 2, -224); x.lineTo(s * 24, -232); x.lineTo(s * 18, -212); x.closePath(); x.fillStyle = d.camisa; x.fill(); contorno(x, 'rgba(0,0,0,0.18)', 1.5); });
    // cuello (piel)
    rr(x, -17, -248, 34, 26, 10); x.fillStyle = osc(d.piel, 0.18); x.fill();
  }
  function brazoSprite(x, d) {          // pivote del hombro en (0,0), cuelga hacia +y
    const borde = 'rgba(8,8,18,0.55)';
    rr(x, -17, -8, 34, BRAZO_L, 16); x.fillStyle = lin(x, -17, 0, 17, 0, acl(d.chaqueta, 0.18), osc(d.chaqueta, 0.3)); x.fill(); contorno(x, borde);
    x.fillStyle = d.camisa; rr(x, -15, BRAZO_L - 16, 30, 9, 4); x.fill();
    x.beginPath(); x.arc(0, BRAZO_L + 6, 15, 0, 7); x.fillStyle = rad(x, -5, BRAZO_L, 2, 17, acl(d.piel, 0.12), osc(d.piel, 0.12)); x.fill(); contorno(x, 'rgba(90,40,20,0.45)', 2);
  }
  function cabeza(x, d) {
    const { cx, cy, rx, ry } = CAB, borde = 'rgba(70,30,15,0.5)';
    // pelo largo por detras
    if (d.peinado === 'largo') { x.beginPath(); x.ellipse(cx, cy + 6, rx + 12, ry + 6, 0, PI * 0.95, PI * 2.05); x.lineTo(cx + rx + 8, cy + 46); x.quadraticCurveTo(cx, cy + 30, cx - rx - 8, cy + 46); x.closePath(); x.fillStyle = osc(d.pelo, 0.2); x.fill(); }
    // orejas
    [-1, 1].forEach(s => { x.beginPath(); x.ellipse(cx + s * (rx - 2), cy + 6, 13, 18, 0, 0, 7); x.fillStyle = osc(d.piel, 0.08); x.fill(); contorno(x, borde, 2); });
    // cara
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fillStyle = rad(x, cx - 22, cy - 26, 8, ry * 1.15, acl(d.piel, 0.16), osc(d.piel, 0.14)); x.fill(); contorno(x, borde);
    // barba
    if (d.barba) {
      const larga = d.barba === 'poblada' ? 16 : 2;
      x.beginPath(); x.moveTo(cx - rx + 1, cy - 4); x.bezierCurveTo(cx - rx + 2, cy + 50, cx - 40, cy + ry + larga, cx, cy + ry + larga);
      x.bezierCurveTo(cx + 40, cy + ry + larga, cx + rx - 2, cy + 50, cx + rx - 1, cy - 4); x.lineTo(cx + rx - 12, cy + 2);
      x.bezierCurveTo(cx + 50, cy + 30, cx + 30, cy + 26, cx, cy + 30); x.bezierCurveTo(cx - 30, cy + 26, cx - 50, cy + 30, cx - rx + 12, cy + 2); x.closePath();
      const bc = d.barbaCol; x.fillStyle = lin(x, cx - rx, cy, cx + rx, cy + ry, acl(bc, 0.12), osc(bc, 0.2)); x.fill();
      motas(x, 'barba' + bc, cx - rx, cy - 4, cx + rx, cy + ry + larga, { dens: 14, alfa: 0.4, claro: d.canas ? '#d8d4cf' : acl(bc, 0.3), oscuro: osc(bc, 0.45), claras: 0.3 + d.canas });
      // bigote
      x.beginPath(); x.moveTo(cx - 30, cy + 34); x.quadraticCurveTo(cx, cy + 20, cx + 30, cy + 34); x.quadraticCurveTo(cx, cy + 28, cx - 30, cy + 34); x.lineWidth = 9; x.strokeStyle = d.barbaCol; x.stroke();
    }
    // pelo
    x.save(); x.beginPath(); x.ellipse(cx, cy, rx + 4, ry + 4, 0, 0, 7); x.clip();
    const pc = d.pelo;
    if (d.peinado === 'largo') {
      x.beginPath(); x.moveTo(cx - rx - 6, cy + 10); x.bezierCurveTo(cx - rx - 10, cy - ry - 62, cx + rx + 14, cy - ry - 66, cx + rx + 6, cy + 10);
      x.lineTo(cx + rx - 6, cy - 20); x.bezierCurveTo(cx + 40, cy - 46, cx + 10, cy - 40, cx - 8, cy - 52); x.bezierCurveTo(cx - 30, cy - 36, cx - 56, cy - 40, cx - rx + 6, cy - 16); x.closePath();
    } else {
      x.beginPath(); x.moveTo(cx - rx - 4, cy - 2); x.bezierCurveTo(cx - rx - 4, cy - ry - 52, cx + rx + 4, cy - ry - 52, cx + rx + 4, cy - 2);
      x.lineTo(cx + rx - 8, cy - 26); x.bezierCurveTo(cx + 36, cy - 50, cx + 14, cy - 58, cx - 4, cy - 56); x.bezierCurveTo(cx - 34, cy - 56, cx - 56, cy - 46, cx - rx + 8, cy - 24); x.closePath();
    }
    x.fillStyle = lin(x, cx - rx, cy - ry, cx + rx, cy, acl(pc, 0.2), osc(pc, 0.25)); x.fill();
    motas(x, 'pelo' + pc, cx - rx - 8, cy - ry - 30, cx + rx + 8, cy + 12, { dens: 16, alfa: 0.35, ang: 0.3, claro: d.canas ? '#d4cfc9' : acl(pc, 0.35), oscuro: osc(pc, 0.5), claras: 0.3 + d.canas });
    // brillo del pelo
    x.globalAlpha = 0.22; x.beginPath(); x.ellipse(cx - 24, cy - ry + 14, 26, 8, -0.3, 0, 7); x.fillStyle = '#fff'; x.fill();
    x.restore();
    if (d.peinado === 'largo') { // mechones laterales que caen sobre las orejas
      [-1, 1].forEach(s => { x.beginPath(); x.moveTo(cx + s * (rx + 6), cy - 30); x.quadraticCurveTo(cx + s * (rx + 16), cy + 20, cx + s * (rx - 2), cy + 44); x.lineTo(cx + s * (rx - 12), cy + 4); x.closePath(); x.fillStyle = osc(pc, 0.05); x.fill(); });
    }
    // nariz
    x.beginPath(); x.ellipse(cx + 2, cy + 12, 10, 8, 0, 0, 7); x.fillStyle = rad(x, cx - 2, cy + 8, 1, 11, acl(d.piel, 0.1), osc(d.piel, 0.18)); x.fill();
    // mejillas
    x.globalAlpha = 0.2; x.fillStyle = '#ff6f6f'; [-1, 1].forEach(s => { x.beginPath(); x.ellipse(cx + s * 44, cy + 16, 13, 8, 0, 0, 7); x.fill(); }); x.globalAlpha = 1;
  }

  const EXPR = {     // ceja: [inclinacion (+ = enfadado), altura]; boca: [curva (+ sonrisa), ancho]
    neutro: { ceja: [0, 0], boca: [0.25, 22] }, sonrie: { ceja: [-0.05, -2], boca: [1, 30] }, serio: { ceja: [0.18, 4], boca: [-0.1, 22] },
    enfadado: { ceja: [0.42, 7], boca: [-0.45, 24] }, preocupado: { ceja: [-0.42, -2], boca: [-0.3, 20] }, triste: { ceja: [-0.5, 0], boca: [-0.7, 22] }
  };
  function cara(x, d, o) {
    const { cx, cy } = CAB, e = EXPR[o.expr || 'neutro'] || EXPR.neutro, t = o.t || 0, mira = (o.mira || 0) * 4;
    const fase = (t * 0.31 + (o.semillaParpadeo || 0)) % 1, cerrado = fase < 0.035;
    [-1, 1].forEach(s => {
      const ex = cx + s * 27, ey = cy - 4;
      if (cerrado) { x.beginPath(); x.moveTo(ex - 11, ey + 2); x.quadraticCurveTo(ex, ey + 7, ex + 11, ey + 2); x.lineWidth = 3.2; x.strokeStyle = '#2a1a14'; x.stroke(); }
      else {
        x.beginPath(); x.ellipse(ex, ey, 12.5, 15.5, 0, 0, 7); x.fillStyle = '#fff'; x.fill(); contorno(x, 'rgba(60,30,20,0.35)', 1.6);
        x.beginPath(); x.arc(ex + mira, ey + 2, 8, 0, 7); x.fillStyle = '#3a2418'; x.fill();
        x.beginPath(); x.arc(ex + mira, ey + 2, 4.6, 0, 7); x.fillStyle = '#0d0806'; x.fill();
        x.beginPath(); x.arc(ex + mira - 3, ey - 2, 2.6, 0, 7); x.fillStyle = '#fff'; x.fill();
      }
      // ceja
      const inc = -e.ceja[0] * s, by = cy - 30 + e.ceja[1];
      x.save(); x.translate(ex, by); x.rotate(inc); rr(x, -16, -4, 32, 8.5, 4); x.fillStyle = d.cejas; x.fill(); x.restore();
    });
    // boca
    const my = cy + 44, w = e.boca[1], cur = e.boca[0], ab = c01(o.habla || 0) * 14;
    if (ab > 1.5) {
      x.beginPath(); x.moveTo(cx - w * 0.6, my - 2 - cur * 3); x.quadraticCurveTo(cx, my - 6 + cur * 2, cx + w * 0.6, my - 2 - cur * 3);
      x.quadraticCurveTo(cx, my + ab + cur * 6, cx - w * 0.6, my - 2 - cur * 3); x.fillStyle = '#5a1f1f'; x.fill();
      x.save(); x.clip(); x.fillStyle = '#fff'; x.fillRect(cx - w, my - 10, w * 2, 6); x.fillStyle = '#d65a5a'; x.beginPath(); x.ellipse(cx, my + ab, w * 0.35, 6, 0, 0, 7); x.fill(); x.restore();
    } else {
      x.beginPath(); x.moveTo(cx - w / 2, my - cur * 4); x.quadraticCurveTo(cx, my + cur * 10, cx + w / 2, my - cur * 4); x.lineWidth = 4; x.lineCap = 'round'; x.strokeStyle = '#5a2a20'; x.stroke();
    }
    // sudor
    if (o.sudor > 0) {
      x.save(); x.globalAlpha *= c01(o.sudor); const sx = cx + 62, sy = cy - 44 + ((t * 0.8) % 1) * 10;
      x.beginPath(); x.moveTo(sx, sy - 14); x.quadraticCurveTo(sx + 10, sy, sx, sy + 6); x.quadraticCurveTo(sx - 10, sy, sx, sy - 14);
      x.fillStyle = lin(x, sx, sy - 14, sx, sy + 6, '#dff6ff', '#6cc8ff'); x.fill(); contorno(x, 'rgba(30,90,140,0.6)', 1.6); x.restore();
    }
  }

  function partes(esc, d) {
    const id = d.id || JSON.stringify(d).length + d.piel + d.pelo;
    return {
      pie: horneaLocal(esc, 'cuerpo|' + id + '|pie', -80, -260, 80, 4, (x) => { piernas(x, d, 'pie'); torso(x, d); }),
      sentado: horneaLocal(esc, 'cuerpo|' + id + '|sentado', -80, -260, 80, 4, (x) => { piernas(x, d, 'sentado'); torso(x, d); }),
      brazo: horneaLocal(esc, 'brazo|' + id, -22, -12, 22, BRAZO_L + 26, (x) => brazoSprite(x, d)),
      cabeza: horneaLocal(esc, 'cabeza|' + id, -100, -400, 100, -180, (x) => cabeza(x, d))
    };
  }
  Object.keys(P.PERSONAS).forEach(k => { P.PERSONAS[k].id = k; });

  /* Dibuja un personaje. (x,y) = punto entre los pies; tam = altura total en unidades de diseno. */
  P.personaje = function (esc, d, o = {}) {
    const x = esc.ctx, k = (o.tam || 400) / 400, t = o.t || 0, pz = partes(esc, d), pose = o.pose || 'pie';
    const resp = Math.sin(t * 2.2 + (o.fase || 0)) * 2.2, cab = (o.habla || 0) * Math.sin(t * 17) * 2.5;
    const bajada = pose === 'sentado' ? 0 : 0;
    x.save(); x.translate(o.x || 0, o.y || 0); x.scale(o.espejo ? -k : k, k);
    if (o.alfa != null) x.globalAlpha *= o.alfa;
    // sombra en el suelo
    R.sombraSuelo(x, 0, -2, 90, 14, 0.35);
    const brazo = (lado, ang) => { x.save(); x.translate(lado * HOMBRO.x, HOMBRO.y + bajada - resp * 0.5); x.rotate(ang * lado); pegaLocal(x, pz.brazo); x.restore(); };
    // brazo de atras si apunta hacia fuera se dibuja igual (orden: brazos, cuerpo, brazos levantados delante)
    const aD = o.brazoD || 0.08, aI = o.brazoI || 0.08;
    x.save(); x.translate(0, -resp * 0.5); pegaLocal(x, pose === 'sentado' ? pz.sentado : pz.pie); x.restore();
    brazo(1, -aD); brazo(-1, -aI);
    x.save(); x.translate(0, -resp + cab); if (o.inclina) { x.translate(0, -230); x.rotate(o.inclina); x.translate(0, 230); }
    pegaLocal(x, pz.cabeza); cara(x, d, Object.assign({ semillaParpadeo: (d.id || '').length * 0.137 }, o)); x.restore();
    x.restore();
  };

  // ------------------------------------------------------------------ plato
  function platoCapa(esc) {
    return R.hornear(esc, 'plato|fondo|v3', MUNDO.W, MUNDO.H, (x, W, H) => {
      const suelo = 1060;
      // pared
      x.fillStyle = lin(x, 0, 0, 0, suelo, '#141238', '#2a2163'); x.fillRect(0, 0, W, suelo);
      // ventanales con ciudad nocturna
      const r = VE.rng('ciudad');
      const vx0 = 60, vy0 = 150, vw = W - 120, vh = 700;
      x.fillStyle = lin(x, 0, vy0, 0, vy0 + vh, '#0b1438', '#27306b'); x.fillRect(vx0, vy0, vw, vh);
      for (let capa = 0; capa < 2; capa++) {
        let px = vx0; const base = vy0 + vh;
        while (px < vx0 + vw) {
          const bw = 40 + r() * 70, bh = (capa ? 120 : 240) + r() * (capa ? 240 : 360), col = capa ? '#16204d' : '#0f173c';
          x.fillStyle = col; x.fillRect(px, base - bh, bw - 4, bh);
          if (capa) for (let wy = base - bh + 12; wy < base - 10; wy += 16) for (let wx = px + 6; wx < px + bw - 12; wx += 12) if (r() < 0.32) { x.fillStyle = r() < 0.7 ? 'rgba(255,214,130,0.85)' : 'rgba(150,220,255,0.8)'; x.fillRect(wx, wy, 6, 8); }
          px += bw;
        }
      }
      // reflejo del cristal
      x.save(); x.globalAlpha = 0.1; x.fillStyle = '#fff'; x.beginPath(); x.moveTo(vx0 + 120, vy0); x.lineTo(vx0 + 300, vy0); x.lineTo(vx0 + 120, vy0 + vh); x.lineTo(vx0 - 60, vy0 + vh); x.closePath(); x.fill(); x.restore();
      // perfiles de las ventanas (montantes con volumen)
      for (let i = 0; i <= 6; i++) { const mx = vx0 + i * vw / 6 - 10; x.fillStyle = lin(x, mx, 0, mx + 20, 0, '#3d3685', '#1b1747'); x.fillRect(mx, vy0 - 10, 20, vh + 20); }
      [vy0 - 10, vy0 + vh * 0.42, vy0 + vh].forEach(y => { x.fillStyle = lin(x, 0, y, 0, y + 16, '#463f94', '#1b1747'); x.fillRect(vx0 - 10, y, vw + 20, 16); });
      // neones verticales (cian y rosa) con resplandor horneado
      [[30, '#58f0ff'], [W - 46, '#ff4fa3']].forEach(([nx, c]) => {
        x.fillStyle = lin(x, nx - 60, 0, nx + 76, 0, R.alfa(c, 0), R.alfa(c, 0)); const g = x.createLinearGradient(nx - 60, 0, nx + 76, 0);
        g.addColorStop(0, R.alfa(c, 0)); g.addColorStop(0.45, R.alfa(c, 0.28)); g.addColorStop(0.55, R.alfa(c, 0.28)); g.addColorStop(1, R.alfa(c, 0)); x.fillStyle = g; x.fillRect(nx - 60, 60, 136, suelo - 80);
        x.fillStyle = acl(c, 0.6); rr(x, nx, 80, 16, suelo - 120, 8); x.fill();
      });
      // rotulo EN DIRECTO
      x.save(); x.translate(W / 2, 92); rr(x, -150, -38, 300, 76, 18); x.fillStyle = '#2a0d18'; x.fill(); x.lineWidth = 5; x.strokeStyle = '#ff3b4f'; x.stroke();
      x.beginPath(); x.arc(-100, 0, 13, 0, 7); x.fillStyle = '#ff3b4f'; x.fill(); x.font = '700 40px Fredoka, sans-serif'; x.fillStyle = '#ffe3e6'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('EN DIRECTO', 20, 2); x.restore();
      // zocalo
      x.fillStyle = lin(x, 0, suelo - 60, 0, suelo, '#3a2d78', '#191340'); x.fillRect(0, suelo - 60, W, 60);
      // suelo de madera brillante
      x.fillStyle = lin(x, 0, suelo, 0, H, '#5a3622', '#2b170d'); x.fillRect(0, suelo, W, H - suelo);
      const rp = VE.rng('tablas');
      for (let y = suelo; y < H; y += 46 + (y - suelo) * 0.05) { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, y, W, 2); for (let i = 0; i < 4; i++) { const tx = rp() * W; x.fillRect(tx, y, 2, 46); } }
      x.save(); x.globalAlpha = 0.16; x.fillStyle = lin(x, 0, suelo, 0, suelo + 500, '#9fb2ff', 'rgba(0,0,0,0)'); x.fillRect(0, suelo, W, 500); x.restore();
      // alfombra redonda
      x.save(); x.translate(W / 2, 1330); x.scale(1, 0.32);
      x.beginPath(); x.arc(0, 0, 520, 0, 7); x.fillStyle = rad(x, -80, -80, 40, 540, '#1d5c66', '#0d2f38'); x.fill(); x.lineWidth = 22; x.strokeStyle = '#d9a441'; x.stroke();
      x.beginPath(); x.arc(0, 0, 440, 0, 7); x.lineWidth = 6; x.strokeStyle = 'rgba(217,164,65,0.6)'; x.stroke();
      for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; x.save(); x.rotate(a); x.translate(0, -480); x.rotate(PI / 4); x.fillStyle = 'rgba(217,164,65,0.7)'; x.fillRect(-9, -9, 18, 18); x.restore(); }
      x.restore();
    });
  }
  P.fondo = function (esc, t) {
    const x = esc.ctx, s = platoCapa(esc); x.drawImage(s.img, 0, 0, MUNDO.W, MUNDO.H);
    // focos que oscilan (conos horneados una vez)
    const cono = R.hornear(esc, 'plato|cono', 300, 900, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,240,200,0.32)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(w / 2 - 18, 0); c.lineTo(w / 2 + 18, 0); c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill(); });
    x.save(); x.globalCompositeOperation = 'lighter';
    [[250, 0.35], [830, -0.35]].forEach(([fx, a0], i) => { x.save(); x.translate(fx, 0); x.rotate(a0 + Math.sin(t * 0.5 + i * 2) * 0.12); x.globalAlpha = 0.55; x.drawImage(cono.img, -150, 0, 300, 900); x.restore(); });
    x.restore();
  };
  P.sillon = function (esc, cx, y, tam = 1) {
    const s = R.hornear(esc, 'plato|sillon', 420, 330, (x, w, h) => {
      x.translate(w / 2, h);
      rr(x, -170, -300, 340, 220, 70); x.fillStyle = lin(x, -170, -300, 170, -80, '#f0b444', '#a8661c'); x.fill(); contorno(x, 'rgba(60,30,5,0.5)', 3);
      for (let i = -2; i <= 2; i++) { x.beginPath(); x.arc(i * 60, -210, 5, 0, 7); x.fillStyle = 'rgba(90,50,10,0.5)'; x.fill(); }
      rr(x, -175, -120, 350, 80, 30); x.fillStyle = lin(x, 0, -120, 0, -40, '#f5c060', '#b4721f'); x.fill(); contorno(x, 'rgba(60,30,5,0.5)', 3);
      [-1, 1].forEach(sx => { rr(x, sx * 200 - 40, -200, 80, 160, 36); x.fillStyle = lin(x, sx * 200 - 40, 0, sx * 200 + 40, 0, '#f7c46a', '#9a5a16'); x.fill(); contorno(x, 'rgba(60,30,5,0.5)', 3); });
      x.fillStyle = '#3b2412'; [-150, 140].forEach(px => x.fillRect(px, -42, 12, 42));
    });
    R.pegar(esc, s, cx, y, { escala: tam });
  };
  /* Mesa del presentador: (cx, y) = centro del borde inferior. */
  P.mesa = function (esc, cx, y, tam = 1) {
    const s = R.hornear(esc, 'plato|mesa2', 520, 330, (x, w, h) => {
      x.translate(w / 2, h);
      x.beginPath(); x.moveTo(-250, -300); x.lineTo(250, -300); x.lineTo(232, -270); x.lineTo(-232, -270); x.closePath(); x.fillStyle = lin(x, 0, -300, 0, -270, '#c88a52', '#8a552b'); x.fill();
      x.fillStyle = lin(x, -232, 0, 232, 0, '#7a4523', '#4a2711'); x.fillRect(-232, -270, 464, 270);
      x.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 9; i++) x.fillRect(-232, -250 + i * 28, 464, 2);
      rr(x, -190, -220, 380, 150, 18); x.fillStyle = lin(x, 0, -220, 0, -70, '#173f6e', '#0b1d38'); x.fill(); x.lineWidth = 6; x.strokeStyle = '#58f0ff'; x.stroke();
      for (let i = 0; i < 3; i++) { x.globalAlpha = 0.35 - i * 0.1; x.beginPath(); x.arc(0, -146, 30 + i * 18, 0, 7); x.lineWidth = 4; x.strokeStyle = '#58f0ff'; x.stroke(); } x.globalAlpha = 1;
      // taza
      rr(x, 150, -350, 40, 52, 8); x.fillStyle = lin(x, 150, 0, 190, 0, '#f4f4f4', '#bdbdbd'); x.fill(); x.beginPath(); x.arc(194, -326, 12, -PI / 2, PI / 2); x.lineWidth = 6; x.strokeStyle = '#cfcfcf'; x.stroke();
      // papeles
      x.save(); x.translate(-110, -306); x.rotate(-0.05); x.fillStyle = '#f7f4ea'; x.fillRect(-60, -10, 120, 12); x.restore();
    });
    R.pegar(esc, s, cx, y, { escala: tam });
  };

  P.camara = function (esc, cam, fn) {
    const x = esc.ctx, z = cam.zoom || 1, cx = cam.cx == null ? MUNDO.W / 2 : cam.cx, cy = cam.cy == null ? MUNDO.H / 2 : cam.cy;
    x.save(); x.translate(esc.W / 2, esc.H / 2); x.scale(z, z); x.translate(-cx, -cy); fn(); x.restore();
  };

  // ------------------------------------------------------------------ publico
  const ROPA = ['#c0392b', '#2e86de', '#27ae60', '#8e44ad', '#f39c12', '#34495e', '#16a085', '#d35400', '#7f8c8d', '#e84393'];
  const PELO = ['#2b1d16', '#4a3226', '#8a6a4a', '#c9b38f', '#1d1d1d', '#9b9b9b', '#6b3b20'];
  function espectador(esc, i, arriba) {
    const r = VE.rng('esp' + i), ropa = ROPA[Math.floor(r() * ROPA.length)], pelo = PELO[Math.floor(r() * PELO.length)], piel = ['#f1c3a0', '#e0a77f', '#c58a63', '#8d5b3d'][Math.floor(r() * 4)];
    const calvo = r() < 0.15, largo = r() < 0.35;
    return R.hornear(esc, 'plato|esp|' + i + '|' + (arriba ? 1 : 0), 180, 240, (x, w, h) => {
      x.translate(w / 2, h);
      if (arriba) [-1, 1].forEach(s => { x.save(); x.translate(s * 46, -120); x.rotate(s * 0.35); rr(x, -12, -100, 24, 104, 12); x.fillStyle = lin(x, -12, 0, 12, 0, acl(ropa, 0.15), osc(ropa, 0.3)); x.fill(); x.beginPath(); x.arc(0, -104, 14, 0, 7); x.fillStyle = piel; x.fill(); x.restore(); });
      rr(x, -66, -124, 132, 124, 50); x.fillStyle = lin(x, -66, -124, 66, 0, acl(ropa, 0.18), osc(ropa, 0.32)); x.fill(); contorno(x, 'rgba(0,0,0,0.35)', 2.4);
      x.beginPath(); x.ellipse(0, -160, 44, 50, 0, 0, 7); x.fillStyle = calvo ? rad(x, -10, -180, 4, 56, acl(piel, 0.2), osc(piel, 0.2)) : rad(x, -12, -182, 4, 58, acl(pelo, 0.25), osc(pelo, 0.2)); x.fill(); contorno(x, 'rgba(0,0,0,0.3)', 2);
      if (largo && !calvo) { rr(x, -44, -170, 88, 78, 30); x.fillStyle = osc(pelo, 0.05); x.fill(); }
      [-1, 1].forEach(s => { x.beginPath(); x.ellipse(s * 44, -156, 8, 12, 0, 0, 7); x.fillStyle = osc(piel, 0.1); x.fill(); });
    });
  }
  /* Publico de espaldas en primer plano. o = {y (base de la ultima fila), filas, por, tam, animo 0..1 (brazos arriba y botes), semilla} */
  P.publico = function (esc, t, o = {}) {
    const x = esc.ctx, filas = o.filas || 3, por = o.por || 7, tam = o.tam || 1, y0 = o.y || esc.H, animo = o.animo || 0, r = VE.rng(o.semilla || 'pub');
    for (let f = 0; f < filas; f++) {
      const yf = y0 - (filas - 1 - f) * 120 * tam, esc_f = tam * (0.82 + f * 0.09);
      for (let i = 0; i < por + 1; i++) {
        const id = Math.floor(r() * 40), fase = r() * 7, desf = r() * 0.6 - 0.3;
        const px = (i + 0.5 + (f % 2) * 0.5 - 0.5) * (esc.W / por) + desf * 40;
        const salta = animo > 0 ? Math.max(0, Math.sin(t * 7 + fase)) * 22 * animo : Math.sin(t * 1.3 + fase) * 2;
        const arriba = animo > 0.3 && (id % 3 !== 0);
        R.pegar(esc, espectador(esc, id, arriba), px, yf - salta, { escala: esc_f });
      }
    }
  };

  // ------------------------------------------------------------------ piezas graficas
  P.cita = function (esc, txt, autor, cx, cy, o = {}) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return;
    const w = o.w || 820, fit = VE.texto.ajustar(esc, txt, { w: w - 110, h: o.h || 300 }, { max: o.max || 54, min: 30, maxLineas: o.lineas || 4, peso: 600 });
    const lh = fit.tam * 1.2, h = fit.lineas.length * lh + (autor ? 70 : 34) + 40;
    x.save(); x.globalAlpha *= c01(a * 1.5); x.translate(cx, cy); const s = 0.8 + 0.2 * c01(a); x.scale(s, s); x.rotate(o.rot || 0);
    rr(x, -w / 2 + 8, -h / 2 + 12, w, h, 26); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fill();
    rr(x, -w / 2, -h / 2, w, h, 26); x.fillStyle = '#fbfaf6'; x.fill(); x.lineWidth = 5; x.strokeStyle = o.color || '#7c5cff'; x.stroke();
    esc.tipo(150, 700); x.fillStyle = o.color || '#7c5cff'; x.textAlign = 'left'; x.textBaseline = 'top'; x.fillText('“', -w / 2 + 16, -h / 2 - 50);
    esc.tipo(fit.tam, 600); x.fillStyle = '#16141f'; x.textBaseline = 'middle';
    fit.lineas.forEach((l, i) => x.fillText(l, -w / 2 + 70, -h / 2 + 40 + lh / 2 + i * lh));
    if (autor) { esc.tipo(28, 700); x.fillStyle = '#7a7690'; x.fillText(autor.toUpperCase(), -w / 2 + 70, h / 2 - 38); }
    x.restore();
  };
  P.bocadillo = function (esc, txt, cx, cy, o = {}) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return;
    esc.tipo(o.tam || 50, 700); const tw = x.measureText(txt).width, w = tw + 70, h = (o.tam || 50) * 1.9;
    x.save(); x.globalAlpha *= c01(a * 1.6); x.translate(cx, cy); const s = 0.6 + 0.4 * Math.min(1.08, a); x.scale(s, s); x.rotate(o.rot || 0);
    const px = (o.pico || -0.3) * w;
    rr(x, -w / 2, -h / 2, w, h, 24); x.moveTo(px - 20, h / 2 - 2); x.lineTo(px - 34, h / 2 + 40); x.lineTo(px + 18, h / 2 - 2);
    x.fillStyle = o.fondo || '#ffffff'; x.fill(); x.lineWidth = 5; x.strokeStyle = '#16141f'; x.stroke();
    x.fillStyle = o.color || '#d6203a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, 3); x.restore();
  };
  /* Recorte de periodico generico: el nombre del medio se escribe en texto (sin imitar su cabecera). */
  P.periodico = function (esc, medio, titular, cx, cy, o = {}) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return; const w = o.w || 520, h = o.h || 440;
    x.save(); x.globalAlpha *= c01(a * 2); x.translate(cx, cy - (1 - c01(a)) * 120); x.rotate((o.rot || 0) + (1 - c01(a)) * 0.2);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
    x.fillStyle = lin(x, 0, -h / 2, 0, h / 2, '#fbf8ef', '#ebe5d4'); x.fillRect(-w / 2, -h / 2, w, h);
    x.fillStyle = '#1b1b1b'; x.font = `700 ${Math.round(w * 0.075)}px Georgia, 'DejaVu Serif', serif`; x.textAlign = 'center'; x.textBaseline = 'top'; x.fillText(medio, 0, -h / 2 + 22);
    x.fillRect(-w / 2 + 24, -h / 2 + 22 + w * 0.1, w - 48, 3);
    const tam = o.tamTitular || Math.round(w * 0.068); x.font = `700 ${tam}px Georgia, 'DejaVu Serif', serif`; x.textAlign = 'left';
    const pal = titular.split(' '), lineas = []; let l = '';
    pal.forEach(p => { const n = l ? l + ' ' + p : p; if (x.measureText(n).width > w - 56) { lineas.push(l); l = p; } else l = n; }); if (l) lineas.push(l);
    lineas.slice(0, 5).forEach((ln, i) => x.fillText(ln, -w / 2 + 28, -h / 2 + 40 + w * 0.1 + i * tam * 1.18));
    const yI = -h / 2 + 52 + w * 0.1 + Math.min(5, lineas.length) * tam * 1.18;
    x.fillStyle = '#c9c2ae'; for (let i = 0; i < 6 && yI + i * 22 < h / 2 - 20; i++) x.fillRect(-w / 2 + 28, yI + i * 22, (i % 3 === 2 ? 0.6 : 1) * (w - 56), 9);
    x.restore();
  };
  /* Barras horizontales con contador. datos = [{etiqueta, valor, color, texto}] ; caja = {x,y,w}; o = {a (0..1 progreso), max} */
  P.barras = function (esc, datos, caja, o = {}) {
    const x = esc.ctx, a = c01(o.a == null ? 1 : o.a), max = o.max || Math.max(...datos.map(d => d.valor)), hb = o.alto || 92, sep = o.sep || 170;
    datos.forEach((d, i) => {
      const y = caja.y + i * sep, k = VE.ease.suaveSalida(c01(a * 1.3 - i * 0.3)), w = caja.w * d.valor / max * k;
      esc.tipo(40, 700); x.fillStyle = '#fff'; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; VE.texto.trazar(esc, d.etiqueta, caja.x, y - 18, { align: 'left', baseline: 'alphabetic', color: '#fff', contornoAncho: 7, registrar: false });
      rr(x, caja.x, y, caja.w, hb, hb / 2); x.fillStyle = 'rgba(255,255,255,0.12)'; x.fill();
      if (w > 4) { rr(x, caja.x, y, Math.max(hb, w), hb, hb / 2); x.fillStyle = lin(x, caja.x, y, caja.x, y + hb, acl(d.color, 0.25), osc(d.color, 0.2)); x.fill(); }
      const val = Math.round(d.valor * k), txt = d.texto ? d.texto(val, k) : val.toLocaleString('es-ES');
      esc.tipo(50, 700); VE.texto.trazar(esc, txt, caja.x + 30, y + hb / 2 + 2, { align: 'left', color: '#fff', contornoAncho: 7, registrar: false });
    });
  };
  /* Bandera de Ceuta: gironada de ocho piezas blanco/negro con el escudo (simplificado) en el centro. */
  P.ceuta = function (esc, cx, cy, w, o = {}) {
    const x = esc.ctx, h = w * 2 / 3, a = o.a == null ? 1 : o.a; if (a <= 0) return;
    x.save(); x.globalAlpha *= c01(a * 1.5); x.translate(cx, cy); x.rotate(o.rot || 0); const s = 0.7 + 0.3 * c01(a); x.scale(s, s);
    const ond = (px, py) => [px, py + Math.sin(px / w * 6 + (o.t || 0) * 3) * w * 0.02];
    x.save(); x.beginPath(); x.rect(-w / 2, -h / 2, w, h); x.clip();
    const pts = [[-w / 2, -h / 2], [0, -h / 2], [w / 2, -h / 2], [w / 2, 0], [w / 2, h / 2], [0, h / 2], [-w / 2, h / 2], [-w / 2, 0]];
    for (let i = 0; i < 8; i++) { const p = pts[i], q = pts[(i + 1) % 8]; x.beginPath(); x.moveTo(0, 0); x.lineTo(...ond(p[0], p[1])); x.lineTo(...ond(q[0], q[1])); x.closePath(); x.fillStyle = i % 2 ? '#111' : '#f6f6f6'; x.fill(); }
    x.restore(); x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,0.5)'; x.strokeRect(-w / 2, -h / 2, w, h);
    // escudo: bordura roja con castillos, campo blanco con quinas azules
    const e = w * 0.16; x.beginPath(); x.moveTo(-e, -e * 1.1); x.lineTo(e, -e * 1.1); x.lineTo(e, e * 0.3); x.quadraticCurveTo(e, e * 1.2, 0, e * 1.35); x.quadraticCurveTo(-e, e * 1.2, -e, e * 0.3); x.closePath();
    x.fillStyle = '#c8102e'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#7a0a1c'; x.stroke();
    const ei = e * 0.72; x.beginPath(); x.moveTo(-ei, -ei * 1.05); x.lineTo(ei, -ei * 1.05); x.lineTo(ei, ei * 0.3); x.quadraticCurveTo(ei, ei * 1.15, 0, ei * 1.3); x.quadraticCurveTo(-ei, ei * 1.15, -ei, ei * 0.3); x.closePath(); x.fillStyle = '#fff'; x.fill();
    x.fillStyle = '#0a3a8c'; [[0, -0.5], [-0.5, 0.05], [0, 0.05], [0.5, 0.05], [0, 0.6]].forEach(([qx, qy]) => { rr(x, qx * ei - ei * 0.17, qy * ei - ei * 0.22, ei * 0.34, ei * 0.44, ei * 0.1); x.fill(); });
    x.fillStyle = '#f2c230'; for (let i = 0; i < 7; i++) { const an = PI * (1.15 + i * 0.12); x.fillRect(Math.cos(an) * e * 0.87 - 3, Math.sin(an) * e * 0.87 - 3 + e * 0.15, 6, 6); }
    // corona
    x.fillStyle = '#f2c230'; x.beginPath(); x.moveTo(-e * 0.8, -e * 1.15); x.lineTo(-e * 0.8, -e * 1.55); x.lineTo(-e * 0.4, -e * 1.35); x.lineTo(0, -e * 1.65); x.lineTo(e * 0.4, -e * 1.35); x.lineTo(e * 0.8, -e * 1.55); x.lineTo(e * 0.8, -e * 1.15); x.closePath(); x.fill();
    x.restore();
  };
  /* Barrido de camara: mezcla copias desplazadas del fotograma ya dibujado (k = intensidad 0..1). Coste: ~6 drawImage de pantalla. */
  let tmp = null;
  P.barrido = function (esc, k, dir = 1) {
    if (k <= 0.02) return; const x = esc.ctx, c = esc.canvas;
    if (!tmp || tmp.width !== c.width) { tmp = document.createElement('canvas'); tmp.width = c.width; tmp.height = c.height; }
    const t = tmp.getContext('2d'); t.drawImage(c, 0, 0);
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); const n = 6, d = 70 * k * esc.ss * dir;
    for (let i = 1; i <= n; i++) { x.globalAlpha = 0.5 / i * 1.6 * Math.min(1, k * 1.5); x.drawImage(tmp, d * i / n * 2, 0); x.drawImage(tmp, -d * i / n, 0); }
    x.restore();
  };
})(window.VE = window.VE || {});
