/* OJOS_NOCHE: por que brillan los ojos de los animales de noche + 2 superpoderes nocturnos. Short vertical, voz Carmen.
   Fondos: paisajes nocturnos reales (VE.real.paisaje) + arboles/rocas reales (VE.real.objeto).
   Animales: gato, perro, lechuza, raton, polilla, murcielagos y flores DIBUJADOS POR CODIGO y animados (parpadeo, cola, giro de cabeza, aleteo).
   El corte del ojo es un ESQUEMA (no anatomia exacta). Decoracion: estrellas titilantes, luciernagas, murcielagos, luna, destellos. */
const E = VE.ease, T = VE.tokens.SCALE, R = VE.real, PI = Math.PI, tr = VE.tramo, lerp = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v));
const S = VE.short, COL = S.COL;
const at = S.en, fin = S.fin, velo = S.velo, rotulo = S.rotulo, pastilla = S.pastilla, flecha = S.flecha, luna = S.luna;
const VERDE = '#9CFF6A', AMBAR = '#FFD84A', AZUL = '#8FE3FF', ROSA = '#FF7FB0';

// ---------- utilidades ----------
function fondo(esc, ctx, tipo, hora, o = {}) {
  return R.paisaje(esc, ctx.tg, Object.assign({ tipo, hora, a: Math.min(1, 0.3 + ctx.t / 0.8), semilla: 'ojn', horizonte: 0.66, nubes: 0, sinSol: true }, o));
}
function brillo(esc, x, y, r, col, a, dur = 0.35) {            // halo (pegar recibe ESCALA, el alfa va en globalAlpha)
  if (a <= 0) return; const c = esc.ctx; c.save(); c.globalAlpha *= Math.min(1, a); esc.pegar(esc.cache.halo(Math.round(r), col, dur), x, y, 1); c.restore();
}
function destello(esc, cx, cy, r, a, rot = 0, col = '#FFF6C8') {
  if (a <= 0) return; const x = esc.ctx; x.save(); x.globalAlpha *= Math.min(1, a); x.translate(cx, cy); x.rotate(rot); x.fillStyle = col; x.beginPath();
  for (let i = 0; i < 8; i++) { const an = i * PI / 4, rr = i % 2 ? r * 0.26 : r; x.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } x.closePath(); x.fill(); x.restore();
}
function estrellas(esc, ctx, n, y0, y1, sem) {                   // estrellas titilantes (decoracion)
  const x = esc.ctx, r = VE.rng(sem); x.save();
  for (let i = 0; i < n; i++) { const px = r() * esc.W, py = lerp(y0, y1, r()), ph = r() * 6, s = 1.4 + r() * 2.4, f = 1.2 + r() * 2;
    x.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ctx.tg * f + ph)); x.fillStyle = '#EAF2FF'; x.beginPath(); x.arc(px, py, s, 0, 7); x.fill(); }
  x.restore();
}
function luciernagas(esc, ctx, n, sem, y0, y1, col) {
  const r = VE.rng(sem);
  for (let i = 0; i < n; i++) { const bx = r() * esc.W, by = lerp(y0, y1, r()), f = 0.25 + r() * 0.5, ph = r() * 6, g = 0.8 + r();
    const px = bx + Math.sin(ctx.tg * f + ph) * 70, py = by + Math.cos(ctx.tg * f * 1.3 + ph) * 45, a = Math.max(0, Math.sin(ctx.tg * g + ph));
    brillo(esc, px, py, 30, col, a * 0.9, 0.5); }
}
function murcielago(esc, x, y, s, fase, a = 1) {                 // silueta que bate las alas
  const c = esc.ctx; c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); const f = Math.sin(fase); c.fillStyle = '#04060b';
  [1, -1].forEach((l) => { c.save(); c.scale(l, 1); c.beginPath(); c.moveTo(6, -4); c.bezierCurveTo(40, -40 - 34 * f, 90, -34 - 54 * f, 124, -8 - 44 * f); c.quadraticCurveTo(104, 2 - 12 * f, 96, 22 - 12 * f);
    c.quadraticCurveTo(80, 8, 64, 26); c.quadraticCurveTo(48, 8, 30, 24); c.quadraticCurveTo(18, 8, 6, 14); c.closePath(); c.fill(); c.restore(); });
  c.beginPath(); c.ellipse(0, 6, 12, 19, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, -14, 10, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-9, -20); c.lineTo(-6, -36); c.lineTo(-1, -22); c.closePath(); c.fill(); c.beginPath(); c.moveTo(9, -20); c.lineTo(6, -36); c.lineTo(1, -22); c.closePath(); c.fill(); c.restore();
}
function vuelo(esc, ctx, id, y, vel, s) {
  const px = ((ctx.tg * vel + id * 430) % (esc.W + 500)) - 250; murcielago(esc, px, y + Math.sin(ctx.tg * 1.7 + id * 2) * 45, s, ctx.tg * 13 + id * 2, 0.92);
}
const parpadeo = (t, s) => { const p = (t + s * 1.7) % 4.4; return p > 4.2 ? Math.abs((p - 4.3) / 0.1) : 1; };
/* Par de ojos brillantes (eyeshine): halo + almendra luminosa + pupila vertical. r = tamano del ojo. */
function ojos(esc, cx, cy, sep, r, a, t, col, sem = 0, pup = 0.17) {
  if (a <= 0) return; const x = esc.ctx, b = parpadeo(t, sem), pul = 0.8 + 0.2 * Math.sin(t * 3 + sem * 2);
  for (const l of [-1, 1]) { const ex = cx + l * sep / 2; brillo(esc, ex, cy, r * 4.2, col, a * pul * 0.8, 0.45);
    x.save(); x.globalAlpha *= Math.min(1, a); x.translate(ex, cy); x.scale(1, Math.max(0.06, b));
    x.beginPath(); x.moveTo(-r * 1.3, 0); x.quadraticCurveTo(0, -r * 1.1, r * 1.3, 0); x.quadraticCurveTo(0, r * 1.1, -r * 1.3, 0); x.closePath();
    const g = x.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.3); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.4, col); g.addColorStop(1, R.oscurecer(col, 0.45)); x.fillStyle = g; x.fill();
    x.fillStyle = '#05070b'; x.beginPath(); x.ellipse(0, 0, r * pup, r * 0.95, 0, 0, 7); x.fill(); x.restore(); }
}

// ---------- animales ----------
function gato(esc, cx, by, s, t, a, col, sem = 0) {
  if (a <= 0) return; const x = esc.ctx; x.save(); x.globalAlpha *= Math.min(1, a); x.translate(cx, by); x.scale(s, s);
  R.sombraSuelo(x, 0, 8, 220, 30, 0.5);
  x.strokeStyle = '#12131a'; x.lineWidth = 36; x.lineCap = 'round'; x.beginPath(); x.moveTo(150, -20); x.bezierCurveTo(250, -10 + Math.sin(t * 2) * 34, 280, -120 + Math.sin(t * 2 + 1) * 44, 232, -230 + Math.sin(t * 2 + 2) * 34); x.stroke();
  let g = x.createLinearGradient(-175, 0, 175, 0); g.addColorStop(0, '#5d6380'); g.addColorStop(0.25, '#2b2c38'); g.addColorStop(1, '#0a0b11'); x.fillStyle = g;
  x.beginPath(); x.moveTo(-175, 0); x.bezierCurveTo(-182, -110, -120, -185, 0, -192); x.bezierCurveTo(120, -185, 182, -110, 175, 0); x.closePath(); x.fill();
  x.save(); x.translate(0, -255); x.rotate(0.06 * Math.sin(t * 0.8 + sem));
  [-1, 1].forEach((l) => { x.save(); x.scale(l, 1); x.fillStyle = l < 0 ? '#3b3e52' : '#15161e'; x.beginPath(); x.moveTo(40, -70); x.lineTo(114, -152); x.lineTo(120, -30); x.closePath(); x.fill();
    x.fillStyle = '#5a3345'; x.beginPath(); x.moveTo(62, -70); x.lineTo(106, -122); x.lineTo(108, -48); x.closePath(); x.fill(); x.restore(); });
  g = x.createRadialGradient(-42, -34, 10, 0, 0, 135); g.addColorStop(0, '#5a5f78'); g.addColorStop(0.5, '#2a2b37'); g.addColorStop(1, '#0d0e15'); x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, 124, 100, 0, 0, 7); x.fill();
  x.fillStyle = 'rgba(130,135,160,0.35)'; x.beginPath(); x.ellipse(0, 42, 50, 33, 0, 0, 7); x.fill();
  x.fillStyle = '#c07c8e'; x.beginPath(); x.moveTo(-11, 24); x.lineTo(11, 24); x.lineTo(0, 40); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(210,215,235,0.6)'; x.lineWidth = 2.4; [-1, 1].forEach((k) => [0, 1, 2].forEach((j) => { x.beginPath(); x.moveTo(k * 40, 42 + j * 8); x.lineTo(k * 160, 30 + j * 24 + Math.sin(t * 2 + j) * 2); x.stroke(); }));
  ojos(esc, 0, -8, 120, 27, 1, t, col, sem); x.restore(); x.restore();
}
function perro(esc, cx, by, s, t, a, col, sem = 0) {
  if (a <= 0) return; const x = esc.ctx; x.save(); x.globalAlpha *= Math.min(1, a); x.translate(cx, by); x.scale(s, s);
  R.sombraSuelo(x, 0, 8, 220, 30, 0.5);
  let g = x.createLinearGradient(-175, 0, 175, 0); g.addColorStop(0, '#7b6a58'); g.addColorStop(0.3, '#4a3e34'); g.addColorStop(1, '#16110d'); x.fillStyle = g;
  x.beginPath(); x.moveTo(-178, 0); x.bezierCurveTo(-182, -110, -120, -185, 0, -190); x.bezierCurveTo(120, -185, 182, -110, 178, 0); x.closePath(); x.fill();
  x.save(); x.translate(0, -258); x.rotate(0.05 * Math.sin(t * 0.9 + sem));
  [-1, 1].forEach((l) => { x.save(); x.scale(l, 1); x.fillStyle = l < 0 ? '#5d4d3e' : '#2a211a'; x.beginPath(); x.moveTo(36, -72); x.lineTo(92, -178); x.lineTo(116, -50); x.closePath(); x.fill();
    x.fillStyle = '#3a2a2a'; x.beginPath(); x.moveTo(52, -74); x.lineTo(90, -146); x.lineTo(104, -58); x.closePath(); x.fill(); x.restore(); });
  g = x.createRadialGradient(-40, -34, 10, 0, 0, 135); g.addColorStop(0, '#85735f'); g.addColorStop(0.5, '#4b3e33'); g.addColorStop(1, '#17110d'); x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, 120, 106, 0, 0, 7); x.fill();
  g = x.createRadialGradient(-14, 34, 6, 0, 52, 70); g.addColorStop(0, '#b9a58c'); g.addColorStop(1, '#6d5c4a'); x.fillStyle = g; x.beginPath(); x.ellipse(0, 54, 58, 48, 0, 0, 7); x.fill();
  const lg = 14 + 8 * (0.5 + 0.5 * Math.sin(t * 5 + sem)); x.fillStyle = '#d9667a'; x.beginPath(); x.ellipse(0, 100, 17, lg, 0, 0, 7); x.fill();
  x.strokeStyle = '#1a1210'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 42); x.lineTo(0, 76); x.moveTo(-34, 78); x.quadraticCurveTo(0, 92, 34, 78); x.stroke();
  x.fillStyle = '#0a0808'; x.beginPath(); x.ellipse(0, 32, 22, 15, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.ellipse(-7, 27, 6, 3, 0, 0, 7); x.fill();
  ojos(esc, 0, -12, 124, 24, 1, t, col, sem, 0.3); x.restore(); x.restore();
}
function cabezaLechuza(esc, giro, escala = 1) {                  // lechuza comun: disco facial en forma de corazon
  const x = esc.ctx; x.save(); x.rotate(giro); x.scale(escala, escala);
  x.fillStyle = '#9b6f3f'; x.beginPath(); x.ellipse(0, -34, 98, 66, 0, 0, 7); x.fill();
  const g = x.createLinearGradient(-110, 0, 110, 0); g.addColorStop(0, '#fff8e8'); g.addColorStop(1, '#d8c7a4'); x.fillStyle = g;
  x.beginPath(); x.arc(-44, -6, 64, 0, 7); x.arc(44, -6, 64, 0, 7); x.fill(); x.beginPath(); x.moveTo(-96, 20); x.lineTo(0, 108); x.lineTo(96, 20); x.closePath(); x.fill();
  x.strokeStyle = '#b4875a'; x.lineWidth = 6; x.beginPath(); x.arc(-44, -6, 64, PI * 0.9, PI * 1.9); x.stroke(); x.beginPath(); x.arc(44, -6, 64, PI * 1.1, PI * 2.1); x.stroke();
  x.fillStyle = '#07080a'; [-1, 1].forEach((l) => { x.beginPath(); x.ellipse(l * 38, -4, 16, 19, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(l * 38 - 5, -10, 4, 0, 7); x.fill(); x.fillStyle = '#07080a'; });
  x.fillStyle = '#e4d6b4'; x.beginPath(); x.moveTo(-9, 10); x.lineTo(9, 10); x.lineTo(0, 52); x.closePath(); x.fill(); x.strokeStyle = '#8c7650'; x.lineWidth = 2; x.stroke(); x.restore();
}
function lechuza(esc, cx, by, s, t, a, giro = 0, dy = 0) {
  if (a <= 0) return; const x = esc.ctx; x.save(); x.globalAlpha *= Math.min(1, a); x.translate(cx, by + dy); x.scale(s, s);
  let g = x.createLinearGradient(-110, 0, 110, 0); g.addColorStop(0, '#e0b87c'); g.addColorStop(0.5, '#a07a48'); g.addColorStop(1, '#4e3a22'); x.fillStyle = g; x.beginPath(); x.ellipse(0, -165, 108, 168, 0, 0, 7); x.fill();
  x.fillStyle = '#f1e4c6'; x.beginPath(); x.ellipse(0, -140, 68, 118, 0, 0, 7); x.fill();
  const r = VE.rng('lech'); x.fillStyle = 'rgba(90,60,30,0.5)'; for (let i = 0; i < 26; i++) { const an = r() * PI * 2, d = Math.sqrt(r()); x.beginPath(); x.ellipse(Math.cos(an) * d * 54, -140 + Math.sin(an) * d * 100, 3.2, 4.4, 0, 0, 7); x.fill(); }
  [-1, 1].forEach((l) => { x.save(); x.scale(l, 1); x.fillStyle = l < 0 ? '#b58a54' : '#6b4f2e'; x.beginPath(); x.moveTo(60, -250); x.bezierCurveTo(130, -200, 128, -80, 86, -14); x.bezierCurveTo(70, -80, 56, -170, 60, -250); x.closePath(); x.fill(); x.restore(); });
  x.fillStyle = '#d9b36a'; [-1, 1].forEach((l) => { x.beginPath(); x.ellipse(l * 34, 4, 17, 8, 0, 0, 7); x.fill(); });
  x.save(); x.translate(0, -318); cabezaLechuza(esc, giro); x.restore(); x.restore();
}
function raton(esc, px, py, s, t, a, dir = 1) {
  if (a <= 0) return; const x = esc.ctx; x.save(); x.globalAlpha *= Math.min(1, a); x.translate(px, py); x.scale(s * dir, s); const b = Math.sin(t * 14) * 2;
  x.strokeStyle = '#cc9a98'; x.lineWidth = 5; x.beginPath(); x.moveTo(-34, -12); x.bezierCurveTo(-70, -4 + b, -80, -40, -108, -30 - b); x.stroke();
  R.bola(x, 0, -17, 34, '#b8afa2', '#5f574d'); x.fillStyle = '#9b9286'; x.beginPath(); x.ellipse(34, -20 + b * 0.3, 19, 13, 0.2, 0, 7); x.fill();
  x.fillStyle = '#e2a5ad'; x.beginPath(); x.arc(22, -40, 10, 0, 7); x.fill(); x.beginPath(); x.arc(52, -20, 3.4, 0, 7); x.fill(); x.fillStyle = '#05060a'; x.beginPath(); x.arc(38, -25, 3, 0, 7); x.fill(); x.restore();
}
function florBase(x, col, centro, tallo) {
  x.strokeStyle = tallo; x.lineWidth = 9; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(10, -110, 0, -230); x.stroke();
  for (let i = 0; i < 8; i++) { x.save(); x.translate(0, -240); x.rotate(i * PI / 4); R.bola(x, 0, -34, 30, R.aclarar(col, 0.3), R.oscurecer(col, 0.3)); x.restore(); }
  R.bola(x, 0, -240, 20, R.aclarar(centro, 0.3), R.oscurecer(centro, 0.2));
}
function flor(esc, px, py, s, col, centro, k, sway) {            // k = 0 gris (sin color) -> 1 a todo color
  const x = esc.ctx; x.save(); x.translate(px, py); x.scale(s, s); x.rotate(Math.sin(sway) * 0.05);
  florBase(x, '#8a8e96', '#9ea2a8', '#5b6068'); if (k > 0) { x.globalAlpha *= c01(k); florBase(x, col, centro, '#3f9a4c'); } x.restore();
}
function polilla(esc, px, py, s, t, a, trompa = 0) {              // polilla esfinge vista desde arriba, aleteo rapido
  if (a <= 0) return; const x = esc.ctx, fl = 0.5 + 0.5 * Math.sin(t * 24); x.save(); x.globalAlpha *= Math.min(1, a); x.translate(px, py + Math.sin(t * 2.2) * 8); x.scale(s, s);
  [-1, 1].forEach((l) => { x.save(); x.scale(l * (0.38 + 0.62 * fl), 1);
    let g = x.createLinearGradient(0, 0, 170, 0); g.addColorStop(0, '#6e7030'); g.addColorStop(1, '#a3a64a'); x.fillStyle = g; x.beginPath(); x.moveTo(8, -24); x.quadraticCurveTo(110, -96, 176, -42); x.quadraticCurveTo(150, 30, 10, 36); x.closePath(); x.fill();
    x.fillStyle = '#e9719a'; x.beginPath(); x.moveTo(30, -18); x.quadraticCurveTo(110, -64, 160, -40); x.quadraticCurveTo(110, -36, 30, 4); x.closePath(); x.fill();
    x.fillStyle = '#3a2a22'; x.beginPath(); x.moveTo(8, 24); x.quadraticCurveTo(70, 26, 100, 62); x.quadraticCurveTo(70, 110, 10, 70); x.closePath(); x.fill(); x.strokeStyle = '#e9719a'; x.lineWidth = 6; x.stroke(); x.restore(); });
  R.bola(x, 0, 14, 20, '#b5b85a', '#585a26'); x.fillStyle = '#7a7c36'; x.beginPath(); x.ellipse(0, 20, 17, 74, 0, 0, 7); x.fill(); x.fillStyle = '#e9719a'; x.fillRect(-15, 4, 30, 8); x.fillRect(-14, 28, 28, 8);
  x.fillStyle = '#6b6d2e'; x.beginPath(); x.arc(0, -64, 14, 0, 7); x.fill(); x.fillStyle = '#0a0a08'; [-1, 1].forEach((l) => { x.beginPath(); x.arc(l * 8, -68, 5, 0, 7); x.fill(); });
  x.strokeStyle = '#4c4d20'; x.lineWidth = 3; [-1, 1].forEach((l) => { x.beginPath(); x.moveTo(l * 6, -74); x.quadraticCurveTo(l * 40, -120, l * 52, -140); x.stroke(); });
  if (trompa > 0) { x.strokeStyle = '#d8d3a8'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, -76); x.quadraticCurveTo(24, -100 - 60 * trompa, 4, -76 - 150 * trompa); x.stroke(); } x.restore();
}
function silueta(esc, cx, cy, r, a) {                            // sombra de un animal entre las ramas
  if (a <= 0) return; const x = esc.ctx; x.save(); x.globalAlpha *= a * 0.9; x.fillStyle = '#04060a'; x.beginPath(); x.ellipse(cx, cy + 20, r, r * 0.82, 0, 0, 7); x.fill();
  [-1, 1].forEach((l) => { x.beginPath(); x.moveTo(cx + l * r * 0.35, cy - r * 0.5); x.lineTo(cx + l * r * 0.95, cy - r * 1.15); x.lineTo(cx + l * r * 0.98, cy - r * 0.2); x.closePath(); x.fill(); }); x.restore();
}
function ojoCorte(esc, cx, cy, R0, t, o) {                       // ESQUEMA del ojo de lado: luz entra por la izquierda
  const x = esc.ctx, k = o.k == null ? 1 : o.k; if (k <= 0) return; x.save(); x.translate(cx, cy); const s = 0.75 + 0.25 * Math.min(1, k); x.scale(s, s); x.globalAlpha *= Math.min(1, k * 1.6);
  brillo(esc, 0, 0, R0 * 2.1, '#2a4a8a', 0.5, 0.2);
  let g = x.createRadialGradient(-R0 * 0.2, -R0 * 0.2, R0 * 0.1, 0, 0, R0); g.addColorStop(0, '#16284a'); g.addColorStop(1, '#070d1c'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R0, 0, 7); x.fill();
  x.strokeStyle = '#D5E4FF'; x.lineWidth = 11; x.beginPath(); x.arc(0, 0, R0, -2.55, 2.55); x.stroke();
  x.fillStyle = '#cfe0ff'; [-1, 1].forEach((l) => { x.beginPath(); x.ellipse(-R0 * 0.93, l * R0 * 0.46, 14, 40, l * 0.35, 0, 7); x.fill(); });
  x.fillStyle = 'rgba(170,215,255,0.55)'; x.strokeStyle = '#E8F3FF'; x.lineWidth = 4; x.beginPath(); x.ellipse(-R0 * 0.5, 0, R0 * 0.13, R0 * 0.36, 0, 0, 7); x.fill(); x.stroke();
  const a0 = -1.05, a1 = 1.05, kt = o.tapetum == null ? 1 : o.tapetum, pul = 0.65 + 0.35 * Math.sin(t * 4);
  x.lineCap = 'round'; x.strokeStyle = '#FF9A78'; x.lineWidth = 24; x.beginPath(); x.arc(0, 0, R0 * 0.86, a0, a1); x.stroke();
  if (kt > 0) { x.save(); x.globalAlpha *= c01(kt); brillo(esc, R0 * 0.93, 0, R0 * 0.95, '#7DF3FF', 0.55 * pul, 0.3); x.strokeStyle = '#7DF3FF'; x.lineWidth = 20; x.beginPath(); x.arc(0, 0, R0 * 0.86 + 22, a0 - 0.05, a1 + 0.05); x.stroke(); x.restore(); }
  x.restore();
}
function rayo(esc, cx, cy, R0, t, t0, pasada) {                  // luz que entra, rebota en el tapetum y vuelve a salir
  const u = ((t - t0) * 0.3) % 1; if (t < t0) return; const x = esc.ctx;
  const P = [[-R0 - 430, -170], [-R0 * 0.55, -60], [R0 * 0.846, R0 * 0.154], [-R0 * 0.55, 100], [-R0 - 430, 300]].map(p => [cx + p[0], cy + p[1]]);
  const L = []; let tot = 0; for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(l); tot += l; }
  let rec = u * tot; x.save(); x.lineCap = 'round'; x.lineWidth = 11;
  for (let i = 0; i < L.length && rec > 0; i++) { const f = Math.min(1, rec / L[i]); x.strokeStyle = i < 2 ? '#FFE066' : '#7DF3FF'; x.beginPath(); x.moveTo(P[i][0], P[i][1]); x.lineTo(lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)); x.stroke(); rec -= L[i]; }
  let q = u * tot, i = 0; while (i < L.length - 1 && q > L[i]) { q -= L[i]; i++; } const f = c01(q / L[i]), hx = lerp(P[i][0], P[i + 1][0], f), hy = lerp(P[i][1], P[i + 1][1], f);
  brillo(esc, hx, hy, 70, i < 2 ? '#FFE066' : '#7DF3FF', 0.95, 0.5); x.fillStyle = '#fff'; x.beginPath(); x.arc(hx, hy, 11, 0, 7); x.fill(); x.restore();
  return P;
}
const cuadroTit = (esc, ctx, t, txt, col, y = 215, o = {}) => rotulo(esc, ctx, txt, ctx.zonas.cuerpo.cx, y, Object.assign({ a: tr(t, 0.05, 0.6, E.elastico), color: col, max: T.mega, lineas: 1 }, o));

// =====================================================================
// 1. GANCHO: unos ojos brillan en la oscuridad
// =====================================================================
function escena1(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx;
  fondo(esc, ctx, 'bosque', 'noche'); velo(esc, 0, esc.H * 0.42, 0.5, 0); estrellas(esc, ctx, 36, 90, 760, 'e1');
  luna(esc, 880, 560, 64, tr(t, 0.2, 0.9, E.suave)); const kT = tr(t, 0, 0.7, E.expoSalida);
  R.objeto(esc, 'pino', { x: 100, y: 1250, tam: 700, hora: 'noche', semilla: 3, alfa: kT });
  R.objeto(esc, 'arbol', { x: 995, y: 1262, tam: 620, hora: 'noche', semilla: 5, alfa: kT });
  R.objeto(esc, 'roca', { x: 330, y: 1262, tam: 130, hora: 'noche', semilla: 2, alfa: kT }); R.objeto(esc, 'roca', { x: 760, y: 1266, tam: 100, hora: 'noche', semilla: 7, alfa: kT });
  luciernagas(esc, ctx, 9, 'f1', 760, 1230, AMBAR); vuelo(esc, ctx, 0, 520, 150, 0.8); vuelo(esc, ctx, 1, 700, 110, 0.55);
  rotulo(esc, ctx, '¿POR QUÉ BRILLAN SUS OJOS?', cx, 215, { a: tr(t, 0.05, 0.6, E.elastico), color: '#fff', max: T.mega, lineas: 2 });
  const tO = at(ctx, 'ojos', 1.7), kO = tr(t, tO, 0.5, E.elastico), tB = at(ctx, 'oscuridad', 3.4);
  silueta(esc, cx, 850, 170, kO); ojos(esc, cx, 830, 250, 58, kO, t, VERDE, 1);
  ojos(esc, 215, 1050, 120, 24, tr(t, tB, 0.5, E.atrasSalida), t, AMBAR, 2); ojos(esc, 850, 1085, 110, 22, tr(t, tB + 0.35, 0.5, E.atrasSalida), t, AZUL, 3); ojos(esc, 600, 1185, 90, 18, tr(t, tB + 0.7, 0.5, E.atrasSalida), t, ROSA, 4);
  destello(esc, cx - 200, 760, 26, tr(t, tO + 0.2, 0.3, E.suave) * (0.6 + 0.4 * Math.sin(t * 6)), t); destello(esc, cx + 215, 905, 20, tr(t, tO + 0.4, 0.3, E.suave) * (0.6 + 0.4 * Math.sin(t * 5)), -t);
  const tE = at(ctx, 'encendidos', 6.2), kE = tr(t, tE, 0.5, E.elastico);
  if (kE > 0) { pastilla(esc, 'NO ESTÁN ENCENDIDOS', cx, 1135, { a: kE, color: COL.rojo, tam: 40, fondo: 'rgba(120,10,20,0.92)' });
    x.save(); x.globalAlpha *= c01(kE); x.strokeStyle = COL.rojo; x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 70, 745); x.lineTo(cx + 70, 915); x.moveTo(cx + 70, 745); x.lineTo(cx - 70, 915); x.stroke(); x.restore(); }
  pastilla(esc, '2 SUPERPODERES MÁS', cx, 1230, { a: tr(t, at(ctx, 'superpoderes', 8.2), 0.5, E.elastico), color: COL.dorado, tam: 36 });
}

// =====================================================================
// 2. DATO LOCO: el espejo natural (tapetum lucidum)
// =====================================================================
function escena2(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'lago', 'noche'); velo(esc, 0, esc.H * 0.62, 0.62, 0.28); estrellas(esc, ctx, 30, 90, 700, 'e2');
  cuadroTit(esc, ctx, t, 'DATO LOCO', COL.dorado); luciernagas(esc, ctx, 7, 'f2', 500, 1200, AZUL); vuelo(esc, ctx, 2, 440, 120, 0.6);
  const ex = cx - 20, ey = 800, R0 = 215, tTap = at(ctx, 'espejo', 8.0), tRet = at(ctx, 'retina', 6.4);
  ojoCorte(esc, ex, ey, R0, t, { k: tr(t, 0.3, 0.8, E.expoSalida), tapetum: tr(t, tTap - 0.3, 0.6, E.suave) });
  const kF = tr(t, at(ctx, 'fabrican', 2.6), 0.5, E.elastico), kR = tr(t, at(ctx, 'rebota', 4.2), 0.5, E.elastico);
  pastilla(esc, 'LUZ PROPIA: NO', cx, 530, { a: kF * (1 - c01(kR * 2)), color: COL.rojo, tam: 40, fondo: 'rgba(120,10,20,0.92)' });
  pastilla(esc, 'ES LUZ QUE REBOTA', cx, 530, { a: kR, color: COL.cian, tam: 40 });
  const kRe = tr(t, tRet, 0.5, E.atrasSalida); pastilla(esc, 'RETINA', ex + 280, 640, { a: kRe, color: '#FF9A78', tam: 32 });
  if (kRe > 0) { const xx = esc.ctx; xx.save(); xx.globalAlpha *= kRe; xx.strokeStyle = '#FF9A78'; xx.lineWidth = 5; xx.setLineDash([10, 9]); xx.beginPath(); xx.moveTo(ex + 215, 646); xx.lineTo(ex + R0 * 0.86 * Math.cos(-0.7), ey + R0 * 0.86 * Math.sin(-0.7)); xx.stroke(); xx.restore(); }
  const kTa = tr(t, tTap, 0.5, E.atrasSalida); pastilla(esc, 'ESPEJO NATURAL', ex + 255, 985, { a: kTa, color: '#7DF3FF', tam: 32 });
  rotulo(esc, ctx, 'TAPETUM LUCIDUM', cx, 1100, { a: tr(t, at(ctx, 'tapetum', 10.6), 0.6, E.elastico), color: '#7DF3FF', max: 88, lineas: 1 });
}

// =====================================================================
// 3. ASI FUNCIONA: la luz pasa dos veces
// =====================================================================
function escena3(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'lago', 'noche'); velo(esc, 0, esc.H * 0.62, 0.62, 0.28); estrellas(esc, ctx, 30, 90, 700, 'e3');
  cuadroTit(esc, ctx, t, 'ASÍ FUNCIONA', '#fff'); vuelo(esc, ctx, 3, 450, 100, 0.5);
  const ex = cx + 30, ey = 790, R0 = 215; ojoCorte(esc, ex, ey, R0, t, { k: tr(t, 0.1, 0.6, E.expoSalida), tapetum: 1 });
  const t0 = at(ctx, 'entra', 1.6); const P = rayo(esc, ex, ey, R0, t, t0);
  pastilla(esc, '1.ª PASADA', ex - 160, 560, { a: tr(t, at(ctx, 'atraviesa', 3.4), 0.5, E.atrasSalida), color: '#FFE066', tam: 36 });
  pastilla(esc, '2.ª PASADA', ex - 210, 1075, { a: tr(t, at(ctx, 'vuelve', 8.2), 0.5, E.atrasSalida), color: '#7DF3FF', tam: 36 });
  rotulo(esc, ctx, 'SEGUNDA OPORTUNIDAD', cx, 1130, { a: tr(t, at(ctx, 'oportunidad', 10.0), 0.6, E.elastico), color: COL.dorado, max: 70, lineas: 1 });
  pastilla(esc, 'MÁS LUZ CAPTADA', cx, 1225, { a: tr(t, at(ctx, 'poca', 13.4), 0.5, E.atrasSalida), color: COL.verde, tam: 34 });
  const kI = tr(t, at(ctx, 'iluminas', 16.0), 0.6, E.elastico);
  if (kI > 0) { const xx = esc.ctx; xx.save(); xx.globalAlpha *= c01(kI); const g = xx.createLinearGradient(40, 1000, 400, 800); g.addColorStop(0, 'rgba(255,240,170,0.55)'); g.addColorStop(1, 'rgba(255,240,170,0)'); xx.fillStyle = g; xx.beginPath(); xx.moveTo(40, 1010); xx.lineTo(ex - R0, ey - 70); xx.lineTo(ex - R0, ey + 70); xx.closePath(); xx.fill(); xx.restore();
    pastilla(esc, 'TE LA DEVUELVE', ex - 120, 1000, { a: kI, color: COL.cian, tam: 32 }); }
  if (P) destello(esc, P[2][0], P[2][1], 26, 0.8 + 0.2 * Math.sin(t * 9), t * 2, '#FFFFFF');
}

// =====================================================================
// 4. QUIEN LO TIENE: gato y perro (nosotros no)
// =====================================================================
function escena4(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'noche', { horizonte: 0.7 }); velo(esc, 0, esc.H * 0.5, 0.55, 0.05); estrellas(esc, ctx, 40, 90, 800, 'e4');
  luna(esc, 880, 470, 54, tr(t, 0.2, 0.8, E.suave)); cuadroTit(esc, ctx, t, '¿QUIÉN LO TIENE?', COL.dorado, 215, { max: 108 }); vuelo(esc, ctx, 4, 560, 130, 0.6);
  R.objeto(esc, 'arbol', { x: 80, y: 1236, tam: 560, hora: 'noche', semilla: 9, alfa: tr(t, 0, 0.6, E.suave) }); R.objeto(esc, 'pino', { x: 1010, y: 1240, tam: 600, hora: 'noche', semilla: 4, alfa: tr(t, 0, 0.6, E.suave) });
  const kC = tr(t, at(ctx, 'gatos', 1.2), 0.7, E.expoSalida), kP = tr(t, at(ctx, 'perros', 1.9), 0.7, E.expoSalida), tCol = at(ctx, 'color', 9.0), ciclo = Math.floor(Math.max(0, t - tCol) / 1.2) % 3;
  const cols = [VERDE, AMBAR, AZUL], cA = t > tCol ? cols[ciclo] : VERDE, cB = t > tCol ? cols[(ciclo + 1) % 3] : AMBAR;
  gato(esc, 285, 1120 + (1 - kC) * 160, 0.95, t, kC, cA, 1); perro(esc, 800, 1120 + (1 - kP) * 160, 0.95, t, kP, cB, 2);
  pastilla(esc, 'GATOS', 285, 650, { a: tr(t, at(ctx, 'gatos', 1.2) + 0.2, 0.5, E.elastico), color: cA, tam: 40 }); pastilla(esc, 'PERROS', 800, 650, { a: tr(t, at(ctx, 'perros', 1.9) + 0.2, 0.5, E.elastico), color: cB, tam: 40 });
  pastilla(esc, 'Y MUCHOS MÁS', cx, 480, { a: tr(t, at(ctx, 'muchos', 3.2), 0.5, E.atrasSalida), color: '#fff', tam: 34 });
  pastilla(esc, 'EL COLOR CAMBIA SEGÚN LA ESPECIE', cx, 560, { a: tr(t, tCol - 0.2, 0.5, E.atrasSalida), color: COL.cian, tam: 28 });
  const tN = at(ctx, 'nosotros', 12.4), kN = tr(t, tN, 0.6, E.elastico);
  if (kN > 0) { const x = esc.ctx; x.save(); x.globalAlpha *= c01(kN); x.translate(cx + 8, 960); const s = 0.8 + 0.2 * Math.min(1, kN); x.scale(s, s);
    R.bola(x, 0, 0, 66, '#f0c9a0', '#9a6c48'); x.fillStyle = '#1a120c'; [-1, 1].forEach((l) => { x.beginPath(); x.ellipse(l * 24, -6, 7, 9, 0, 0, 7); x.fill(); }); x.strokeStyle = '#7a4a3a'; x.lineWidth = 5; x.beginPath(); x.arc(0, 18, 20, 0.2, PI - 0.2); x.stroke();
    x.strokeStyle = COL.rojo; x.lineWidth = 13; x.beginPath(); x.moveTo(-90, -96); x.lineTo(90, 96); x.moveTo(90, -96); x.lineTo(-90, 96); x.stroke(); x.restore();
    pastilla(esc, 'NOSOTROS: SIN ESPEJO', cx, 1230, { a: kN, color: COL.rojo, tam: 36, fondo: 'rgba(120,10,20,0.92)' }); }
}

// =====================================================================
// 5. PUENTE: cazar sin ver
// =====================================================================
function escena5(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'montanas', 'noche'); velo(esc, 0, esc.H * 0.5, 0.55, 0.1); estrellas(esc, ctx, 50, 90, 900, 'e5');
  luna(esc, 800, 620, 80, tr(t, 0.1, 0.9, E.suave)); cuadroTit(esc, ctx, t, '¿CAZAR SIN VER?', '#fff', 215, { max: 118 });
  for (let i = 0; i < 5; i++) vuelo(esc, ctx, 10 + i, 760 + i * 95, 90 + i * 25, 0.55 + 0.12 * (i % 3)); luciernagas(esc, ctx, 8, 'f5', 900, 1220, AMBAR);
  [[-1.1, 330, 0.0], [1.0, 360, 0.25], [-0.45, 285, 0.5]].forEach(([an, rr, d], i) => { const k = tr(t, 0.5 + d, 0.5, E.atrasSalida); if (k <= 0) return; esc.tipo(130 - i * 18, 700); x.save(); x.globalAlpha *= k;
    VE.texto.trazar(esc, '?', cx + Math.sin(an) * rr, 905 - Math.cos(an) * rr * 0.55 + Math.sin(t * 2 + i * 2) * 14, { color: COL.dorado, contornoAncho: 10, registrar: false }); x.restore(); });
  pastilla(esc, 'SIN VER NADA', cx, 1040, { a: tr(t, at(ctx, 'ver', 2.8), 0.5, E.elastico), color: COL.rojo, tam: 40, fondo: 'rgba(120,10,20,0.92)' });
  pastilla(esc, 'EL SIGUIENTE TE VUELA LA CABEZA', cx, 1135, { a: tr(t, at(ctx, 'cabeza', 5.6), 0.5, E.elastico), color: COL.dorado, tam: 32 });
  destello(esc, 330, 1200, 24, 0.7 + 0.3 * Math.sin(t * 5), t); destello(esc, 780, 1180, 18, 0.7 + 0.3 * Math.sin(t * 6), -t);
}

// =====================================================================
// 6. SUPERPODER 1: la lechuza oye a su presa
// =====================================================================
function escena6(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'bosque', 'noche'); velo(esc, 0, esc.H * 0.5, 0.6, 0.1); estrellas(esc, ctx, 34, 90, 560, 'e6');
  const tD = at(ctx, 'oscuridad', 8.0), osc = tr(t, tD, 0.8, E.suave); luna(esc, 905, 470, 46, tr(t, 0.2, 0.8, E.suave) * (1 - 0.7 * osc));
  cuadroTit(esc, ctx, t, 'SUPERPODER 1', COL.dorado, 205, { max: 112 }); rotulo(esc, ctx, 'LA LECHUZA COMÚN', cx, 320, { a: tr(t, 0.3, 0.6, E.elastico), color: '#fff', max: 80, lineas: 1 });
  R.objeto(esc, 'pino', { x: 70, y: 1250, tam: 760, hora: 'noche', semilla: 11, alfa: tr(t, 0, 0.6, E.suave) }); R.objeto(esc, 'arbol', { x: 1020, y: 1262, tam: 640, hora: 'noche', semilla: 12, alfa: tr(t, 0, 0.6, E.suave) });
  const rg = x.createLinearGradient(0, 880, 0, 930); rg.addColorStop(0, '#6d5233'); rg.addColorStop(1, '#2a1d11'); x.strokeStyle = rg; x.lineWidth = 46; x.lineCap = 'round'; x.beginPath(); x.moveTo(110, 925); x.bezierCurveTo(330, 905, 700, 935, 980, 900); x.stroke();
  x.strokeStyle = '#8c6c44'; x.lineWidth = 6; x.beginPath(); x.moveTo(120, 910); x.bezierCurveTo(330, 890, 700, 918, 970, 886); x.stroke();
  const tS = at(ctx, 'sonido', 4.6), tZ = at(ctx, 'zas', 14.5), kEsc = at(ctx, 'escucha', 12.4);
  const mx = cx + 170 + (t < tZ ? Math.sin(t * 1.3) * 120 : 0), my = 1215, atrap = t > tZ + 0.15, kL = tr(t, 0.4, 0.7, E.expoSalida);
  const dirR = Math.cos(t * 1.3) >= 0 ? 1 : -1; const giro = t < kEsc ? 0.5 * Math.sin(t * 1.6) : lerp(0.5 * Math.sin(kEsc * 1.6), Math.atan2(mx - cx, 400) * 0.6, c01((t - kEsc) / 0.5));
  const picado = t > tZ ? E.expoSalida(c01((t - tZ) / 0.35)) : 0, vuelta = c01((t - tZ - 1.2) / 0.8);
  if (!atrap) raton(esc, mx, my, 0.8, t, kL, dirR);
  const kO = tr(t, tS, 0.6, E.suave); if (kO > 0 && !atrap) { x.save(); x.lineWidth = 6; for (let i = 0; i < 4; i++) { const f = ((t * 0.5 + i * 0.25) % 1), rr = 40 + f * 330; x.globalAlpha = kO * (1 - f) * 0.8; x.strokeStyle = '#8FE3FF'; x.beginPath(); x.arc(mx, my - 15, rr, PI * 1.12, PI * 1.88); x.stroke(); } x.restore(); }
  lechuza(esc, cx - 90, 912, 1.0, t, kL, t > tZ ? 0 : giro, picado * 270 * (1 - vuelta));
  pastilla(esc, 'CAZA POR EL SONIDO', cx, 520, { a: tr(t, tS, 0.5, E.elastico), color: COL.cian, tam: 38 });
  const kT = tr(t, tD, 0.6, E.elastico); if (osc > 0) { x.save(); x.globalAlpha = osc * 0.35; x.fillStyle = '#000'; x.fillRect(0, 0, esc.W, esc.H); x.restore(); }
  pastilla(esc, 'OSCURIDAD TOTAL', cx, 1060, { a: kT, color: '#fff', tam: 36 });
  const kZ = tr(t, tZ, 0.35, E.elastico); if (kZ > 0) { x.save(); x.globalAlpha = c01(1 - (t - tZ) * 1.4) * 0.6; x.fillStyle = '#fff'; x.fillRect(0, 0, esc.W, esc.H); x.restore(); rotulo(esc, ctx, '¡ZAS!', cx, 560, { a: kZ * (1 - 0.8 * vuelta), color: COL.rojo, max: 190, lineas: 1, contorno: 16 }); }
}

// =====================================================================
// 7. SUPERPODER 2: la polilla ve colores de noche
// =====================================================================
function escena7(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'llanura', 'noche', { horizonte: 0.62 }); velo(esc, 0, esc.H * 0.5, 0.6, 0.1); estrellas(esc, ctx, 40, 90, 700, 'e7');
  luna(esc, 890, 500, 52, tr(t, 0.2, 0.8, E.suave)); cuadroTit(esc, ctx, t, 'SUPERPODER 2', COL.dorado, 205, { max: 112 }); rotulo(esc, ctx, 'LA POLILLA ESFINGE', cx, 320, { a: tr(t, 0.3, 0.6, E.elastico), color: '#fff', max: 78, lineas: 1 });
  const tC = at(ctx, 'viendolos', 13.2), kC = tr(t, tC, 1.0, E.suave), kF = tr(t, 0.3, 0.8, E.expoSalida);
  const flores = [[200, 1215, 0.9, '#FF5C9E', '#FFE45C'], [420, 1235, 1.05, '#B27DFF', '#FFF2A0'], [660, 1225, 0.95, '#FFB347', '#7A3B14'], [880, 1240, 1.0, '#5CC8FF', '#FFE45C']];
  flores.forEach((f, i) => flor(esc, f[0], f[1] + (1 - kF) * 200, f[2], f[3], f[4], kC, t * 1.3 + i * 1.7));
  const tG = at(ctx, 'perderiamos', 8.6), kG = tr(t, tG, 0.5, E.elastico);
  pastilla(esc, 'NOSOTROS: SIN COLOR', cx, 600, { a: kG * (1 - c01(kC * 2)), color: '#C9CED6', tam: 36 });
  pastilla(esc, 'ELLA: CON COLOR', cx, 600, { a: tr(t, tC, 0.5, E.elastico), color: ROSA, tam: 36 });
  polilla(esc, cx + 20 + Math.sin(t * 0.8) * 50, 860 + Math.sin(t * 1.1) * 25, 1.15, t, tr(t, 0.5, 0.7, E.suave), c01((t - 3) / 1.2) * 0.8);
  if (kC > 0) for (let i = 0; i < 7; i++) destello(esc, 140 + i * 130, 1000 + Math.sin(t * 3 + i) * 40, 16 + (i % 3) * 5, kC * (0.5 + 0.5 * Math.sin(t * 6 + i * 2)), t * 2 + i, ['#FF5C9E', '#B27DFF', '#FFE45C', '#5CC8FF'][i % 4]);
  pastilla(esc, 'ESTUDIO EN LA REVISTA NATURE · 2002', cx, 700, { a: tr(t, at(ctx, 'nature', 17.2), 0.5, E.elastico), color: COL.cian, tam: 30 });
}

// =====================================================================
// 8. CIERRE + LETRERO
// =====================================================================
function escena8(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'lago', 'alba', { nubes: 2 }); velo(esc, 0, esc.H * 0.75, 0.5, 0.35); luciernagas(esc, ctx, 8, 'f8', 700, 1200, '#FFE9A8');
  const tS = at(ctx, 'sigue', ctx.dur - 3.2), kS = tr(t, tS - 0.15, 0.8, E.elastico), atenua = 1 - 0.72 * c01(kS * 2);
  rotulo(esc, ctx, '¿CON CUÁL TE QUEDAS?', cx, 230, { a: tr(t, 0.1, 0.6, E.elastico), color: '#fff', max: T.hero }); vuelo(esc, ctx, 6, 560, 100, 0.55);
  x.save(); x.globalAlpha *= atenua; const w0 = 270, gap = 24, x0 = cx - (3 * w0 + 2 * gap) / 2 + w0 / 2, py = 850, nom = ['EL ESPEJO', 'EL OÍDO', 'EL COLOR'];
  for (let i = 0; i < 3; i++) { const a = tr(t, 0.9 + i * 0.25, 0.5, E.atrasSalida), px = x0 + i * (w0 + gap); if (a <= 0) continue; const am = Math.min(1, a);
    x.save(); x.globalAlpha *= am; x.translate(px, py); x.scale(0.7 + 0.3 * am, 0.7 + 0.3 * am); VE.ruta.redondeado(x, -w0 / 2, -w0 / 2 - 20, w0, w0 + 40, 34); x.fillStyle = 'rgba(8,14,32,0.85)'; x.fill(); x.lineWidth = 4; x.strokeStyle = COL.dorado; x.stroke();
    if (i === 0) ojos(esc, 0, -20, 130, 28, 1, t, VERDE, 1); else if (i === 1) { x.save(); x.translate(0, 30); cabezaLechuza(esc, 0.1 * Math.sin(t * 1.6), 0.95); x.restore(); } else { polilla(esc, 0, -10, 0.55, t, 1, 0); }
    esc.tipo(32, 700); VE.texto.trazar(esc, nom[i], 0, 128, { color: COL.dorado, contornoAncho: 6, registrar: false }); x.restore(); }
  x.restore();
  pastilla(esc, 'GUARDA ESTE VÍDEO', cx, 1120, { a: tr(t, at(ctx, 'guarda', 99), 0.5, E.atrasSalida) * atenua, color: COL.cian, tam: 36 });
  S.letrero(esc, t, tS);
}

VE.proyecto({
  estilo: 'LAB', lint: { negro: true },
  subtitulos: { palabras: 4, tam: 74 },
  transicion: { entrada: 0.28, salida: 0.18 },
  escenas: [escena1, escena2, escena3, escena4, escena5, escena6, escena7, escena8]
});
