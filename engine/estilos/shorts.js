/* SHORTS: piezas reutilizables para videos verticales cortos (extraidas del primer corto, 'orientacion').
   VE.short.rotulo(esc, ctx, txt, cx, y, {a, color, max, lineas, contorno, rot})   texto grande con contorno que entra con rebote (a = 0..1)
   VE.short.pastilla(esc, txt, cx, cy, {a, color, tam, fondo})                   etiqueta redondeada
   VE.short.velo(esc, y0, y1, a0, a1)                                            degradado oscuro para dar contraste al texto sobre un paisaje
   VE.short.flecha(esc, x0, y0, x1, y1, color, ancho, progreso)                  flecha que se dibuja
   VE.short.letrero(esc, t, tInicio, {texto, handle})                            LETRERO FINAL «SIGUE A @handle» con entrada elastica y halo (marca en config/tipos.json)
   VE.short.sol / luna / estrella                                                iconos con halo
   VE.short.en(ctx, palabra, respaldo, desde) / fin(...)                         instante local en que se dice una palabra (o el respaldo si no esta)
   Reglas del tipo SHORT: gancho en los primeros 3 s, un cambio visual cada 5-8 s, subtitulos con palabra resaltada, letrero final. Ver docs/TIPO_SHORT.md */
(function (VE) {
  const E = VE.ease, T = VE.tokens.SCALE, PI = Math.PI, lerp = (a, b, t) => a + (b - a) * t, S = VE.short = {};
  S.COL = { sol: '#FFD36B', rojo: '#FF4D5E', verde: '#5BE08A', cian: '#6EE7F9', blanco: '#FFFFFF', dorado: '#FFC23C' };
  S.en = (ctx, w, fb, desde = 0) => { const p = ctx.palabra(w, desde); return p ? p.ini : fb; };
  S.fin = (ctx, w, fb, desde = 0) => { const p = ctx.palabra(w, desde); return p ? p.fin : fb; };

  S.velo = function (esc, y0, y1, a0, a1) {
    const x = esc.ctx, g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(3,8,20,${a0})`); g.addColorStop(1, `rgba(3,8,20,${a1})`);
    x.fillStyle = g; x.fillRect(0, Math.min(y0, y1), esc.W, Math.abs(y1 - y0));
  };
  S.rotulo = function (esc, ctx, txt, cx, y, o = {}) {
    const z = ctx.zonas.cuerpo, a = o.a == null ? 1 : o.a; if (a <= 0) return 0;
    const fit = VE.texto.ajustar(esc, txt, { w: o.w || z.w, h: o.h || 260 * esc.k }, { max: o.max || T.hero, min: T.lg, maxLineas: o.lineas || 2 });
    esc.tipo(fit.tam, 700); const lh = fit.tam * esc.k * 1.1, x = esc.ctx;
    x.save(); x.globalAlpha *= Math.min(1, a * 1.6); x.translate(cx, y + fit.lineas.length * lh / 2); const s = o.sinRebote ? 1 : 0.7 + 0.3 * Math.min(1, a); x.scale(s, s); x.rotate(o.rot || 0);
    fit.lineas.forEach((l, i) => VE.texto.trazar(esc, l, 0, (i - (fit.lineas.length - 1) / 2) * lh, { color: o.color || S.COL.blanco, contornoAncho: o.contorno || 11, registrar: false }));
    x.restore(); return fit.lineas.length * lh;
  };
  S.pastilla = function (esc, txt, cx, cy, o = {}) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return;
    const tam = o.tam || 34; esc.tipo(tam, 700); const w = x.measureText(txt).width + (o.pad || 44) * esc.k, h = tam * esc.k * 1.75;
    x.save(); x.globalAlpha *= Math.min(1, a * 1.5); x.translate(cx, cy); const s = 0.75 + 0.25 * Math.min(1, a); x.scale(s, s);
    VE.ruta.redondeado(x, -w / 2, -h / 2, w, h, h / 2); x.fillStyle = o.fondo || 'rgba(8,14,32,0.82)'; x.fill(); x.lineWidth = 3 * esc.k; x.strokeStyle = o.color || S.COL.dorado; x.stroke();
    x.fillStyle = o.texto || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, tam * esc.k * 0.04); x.restore();
  };
  S.flecha = function (esc, x0, y0, x1, y1, col, ancho, prog = 1) {
    const x = esc.ctx, px = lerp(x0, x1, prog), py = lerp(y0, y1, prog), an = Math.atan2(y1 - y0, x1 - x0); if (prog <= 0) return;
    x.save(); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = ancho; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(px, py); x.stroke();
    if (prog > 0.85) { const h = ancho * 3.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px - Math.cos(an - 0.45) * h, py - Math.sin(an - 0.45) * h); x.lineTo(px - Math.cos(an + 0.45) * h, py - Math.sin(an + 0.45) * h); x.closePath(); x.fill(); } x.restore();
  };
  S.sol = function (esc, cx, cy, r, a = 1, giro = 0) {
    const x = esc.ctx; if (a <= 0 || r <= 0) return; x.save(); x.globalAlpha *= a; esc.pegar(esc.cache.halo(Math.round(r * 3.4), S.COL.sol, 0.3), cx, cy, 0.9);
    x.translate(cx, cy); x.rotate(giro); x.strokeStyle = '#FFE08A'; x.lineWidth = r * 0.11; x.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const an = i / 12 * PI * 2, r0 = r * 1.18, r1 = r * (i % 2 ? 1.5 : 1.75); x.beginPath(); x.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); x.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); x.stroke(); }
    const g = x.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFFDF0'); g.addColorStop(0.6, '#FFE27A'); g.addColorStop(1, '#FFB52E'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.restore();
  };
  S.luna = function (esc, cx, cy, r, a = 1) {
    const x = esc.ctx; if (a <= 0 || r <= 0) return; x.save(); x.globalAlpha *= a; esc.pegar(esc.cache.halo(Math.round(r * 3), '#BFD0FF', 0.3), cx, cy, 0.8);
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = '#EEF2FF'; x.fill(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(cx + r * 0.45, cy - r * 0.2, r * 0.9, 0, 7); x.fill(); x.restore();
  };
  S.estrella = function (esc, cx, cy, r, a = 1, col = '#FFFFFF') {
    if (a <= 0 || r <= 0) return; esc.pegar(esc.cache.halo(Math.round(r * 5), col, 0.25), cx, cy, a);
    esc.ctx.save(); esc.ctx.globalAlpha *= a; esc.ctx.fillStyle = '#fff'; esc.ctx.beginPath(); esc.ctx.arc(cx, cy, r * 0.55, 0, 7); esc.ctx.fill(); esc.ctx.restore();
  };
  /* Letrero final. t = tiempo local de la escena; tInicio = instante en que debe entrar (p. ej. la palabra 'sigue'). Se dibuja al CENTRO (cy, por defecto 700). */
  S.letrero = function (esc, t, tInicio, o = {}) {
    const k = VE.tramo(t, tInicio - 0.15, 0.8, E.elastico); if (k <= 0) return 0; const x = esc.ctx, cx = o.cx == null ? esc.seguro.cx : o.cx, cy = o.cy == null ? 700 : o.cy;
    x.save(); x.translate(cx, cy); const s = 0.6 + 0.4 * Math.min(1.1, k) + 0.025 * Math.sin(t * 4); x.scale(s, s); x.globalAlpha *= Math.min(1, k * 1.8);
    esc.pegar(esc.cache.halo(520, S.COL.dorado, 0.25), 0, 0, 0.9 + 0.1 * Math.sin(t * 3));
    VE.ruta.redondeado(x, -400, -200, 800, 400, 60); const g = x.createLinearGradient(-400, -200, 400, 200); g.addColorStop(0, '#1B2A5E'); g.addColorStop(1, '#0A1030'); x.fillStyle = g; x.fill(); x.lineWidth = 12; x.strokeStyle = S.COL.dorado; x.stroke();
    esc.tipo(86, 700); VE.texto.trazar(esc, o.texto || 'SIGUE A', 0, -78, { color: '#fff', contornoAncho: 10, registrar: false });
    const h = o.handle || '@randonautico', f = VE.texto.ajustar(esc, h, { w: 700, h: 120 }, { max: 100, min: 50, maxLineas: 1 }); esc.tipo(f.tam, 700);
    VE.texto.trazar(esc, h, 0, 62, { color: S.COL.dorado, contornoAncho: 11, registrar: false }); x.restore(); return Math.min(1, k);
  };
})(window.VE = window.VE || {});
