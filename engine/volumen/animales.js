/* VOLUMEN — ANIMALES (unidades: metros). Piel pintada una vez (escamas, dibujo de cada especie) y rasgos de la cara.
     V.modelos.serpiente({ especie, id, t, escala, amp, ondas, vel, pos, rumbo, alfa, alza, res })
        especie: 'interior' (taipan del interior) | 'parda' (parda oriental) | 'costero' (taipan costero) | 'tigre' | 'marina' (marina de pico)
        o un objeto como los de V.modelos.serpiente.especies (largo, r, cab, cabW, cabH, cuello, ojo, iris, ceja, labio, piel).
        Una sola piel (cola -> cabeza, vientre plano, cola en punta o en remo), cabeza aplastada de hocico redondo, ojos con pupila y ceja,
        fosas nasales, linea de la boca, labios claros y lengua bifida que entra y sale. Cabeza hacia +X, apoyada en y = 0.
        id: nombre unico por serpiente en pantalla (la malla dinamica se reutiliza por nombre). alza 0..1 levanta la cabeza. res: resolucion (200).
     V.modelos.serpiente.cabeza(especie, {escala, rumbo, pos})  punto aproximado de la cabeza en el mundo (para etiquetas con V.proyectar)
   Montado con el motor, sin ficheros externos. Probado en proyectos/serpientes (5 especies). */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v));
/* ---- especies: medidas en metros (grosor algo exagerado para verse en vertical) y rasgos de la cabeza ----
   cab = largo de la cabeza / largo total · cabW = ancho de la mandibula respecto al cuerpo · cabH = altura (aplastada)
   cuello = estrechamiento tras la cabeza · ojo = radio del ojo / radio del cuerpo · iris = color del iris */
const ESP = {
  interior: { piel: 'interior', largo: 1.9, r: 0.040, cab: 0.085, cabW: 1.32, cabH: 0.62, cuello: 0.20, ojo: 0.27, iris: '#2a1c10', ceja: '#1d150d', labio: '#6b5a3a' },
  parda:    { piel: 'parda',    largo: 1.7, r: 0.040, cab: 0.070, cabW: 1.22, cabH: 0.70, cuello: 0.22, ojo: 0.28, iris: '#d08a35', ceja: '#4a2f1a', labio: '#e3cf9f' },
  costero:  { piel: 'costero',  largo: 2.2, r: 0.050, cab: 0.120, cabW: 1.28, cabH: 0.58, cuello: 0.24, ojo: 0.28, iris: '#c4521d', ceja: '#8a6a3c', labio: '#ead9a8' },
  tigre:    { piel: 'tigre',    largo: 1.6, r: 0.060, cab: 0.075, cabW: 1.55, cabH: 0.70, cuello: 0.12, ojo: 0.22, iris: '#2b2a18', ceja: '#1f1e14', labio: '#d9c97c' },
  marina:   { piel: 'marina',   largo: 1.4, r: 0.040, cab: 0.075, cabW: 1.18, cabH: 0.82, cuello: 0.06, ojo: 0.20, iris: '#14120e', ceja: '#3d4332', labio: '#dfe0bf', remo: true },
};
/* piel horneada una vez: ejes de la textura x = largo (cola → hocico), y = vuelta (lomo en y = 25 %, vientre en y = 75 %) */
const PIEL = {
  interior: { lomo: '#a48a4e', flanco: '#c2a868', vientre: '#e9dfb8', cabeza: '#241a10', escama: [10, 6] },
  parda:    { lomo: '#7d5430', flanco: '#9a6c3f', vientre: '#e8d3a0', cabeza: '#4a2f1b', escama: [10, 6] },
  costero:  { lomo: '#8d7446', flanco: '#a98d5a', vientre: '#efe0b0', cabeza: '#d3b87c', escama: [11, 7], raya: '#b9602b' },
  tigre:    { lomo: '#2a2b1f', flanco: '#c8ae48', vientre: '#e7d98a', cabeza: '#2a2a1c', escama: [9, 6], bandas: ['#25261c', '#cdb34a'] },
  marina:   { lomo: '#9ea375', flanco: '#c3c79b', vientre: '#ecebcf', cabeza: '#5c6544', escama: [11, 7], marinas: '#343a2a' },
};
function pintarPiel(nombre) {
  const P = PIEL[nombre], e = ESP[nombre], uh = 1 - e.cab;
  return V.textura('serp|piel2|' + nombre, 1024, 256, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, P.flanco); g.addColorStop(0.25, P.lomo); g.addColorStop(0.5, P.flanco); g.addColorStop(0.6, P.vientre); g.addColorStop(0.9, P.vientre); g.addColorStop(1, P.flanco);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (P.bandas) {                                                              // tigre: anillos amarillos y oscuros (anchos arriba, mas finos abajo)
      const n = 21, w = W * 0.93 / n;
      for (let i = 0; i < n; i++) { if (i % 2) continue; x.fillStyle = P.bandas[0]; x.fillRect(i * w, 0, w * 1.02, H * 0.58); x.fillRect(i * w, H * 0.94, w * 1.02, H * 0.06);
        x.fillStyle = 'rgba(37,38,28,0.35)'; x.fillRect(i * w, H * 0.58, w * 1.02, H * 0.14); }
    }
    if (P.marinas) {                                                             // marina: bandas oscuras que se estrechan hacia el vientre
      const n = 30, w = W * 0.9 / n; x.fillStyle = P.marinas;
      for (let i = 0; i < n; i++) { const cx = (i + 0.5) * w; x.beginPath(); x.moveTo(cx - w * 0.5, 0.02 * H); x.lineTo(cx + w * 0.5, 0.02 * H); x.lineTo(cx + w * 0.22, 0.58 * H); x.lineTo(cx - w * 0.22, 0.58 * H); x.closePath(); x.fill(); x.beginPath(); x.moveTo(cx - w * 0.5, 0.98 * H); x.lineTo(cx + w * 0.5, 0.98 * H); x.lineTo(cx + w * 0.22, 0.9 * H); x.lineTo(cx - w * 0.22, 0.9 * H); x.closePath(); x.fill(); }
    }
    if (P.raya) { x.fillStyle = P.raya; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(W * 0.12, H * 0.25); x.quadraticCurveTo(W * 0.5, H * 0.19, W * (uh - 0.03), H * 0.2); x.lineTo(W * (uh - 0.03), H * 0.3); x.quadraticCurveTo(W * 0.5, H * 0.31, W * 0.12, H * 0.25); x.fill(); x.globalAlpha = 1; }   // taipan costero: raya rojiza del lomo
    const rn = VE.rng('escama' + nombre), cw = P.escama[0], ch = P.escama[1];       // escamas: centro claro y borde oscuro, en quincunce
    for (let j = 0; j * ch < H + ch; j++) for (let i = 0; i * cw < W + cw; i++) {
      const cx = (i + (j % 2 ? 0.5 : 0)) * cw, cy = j * ch;
      x.fillStyle = `rgba(255,255,255,${0.03 + rn() * 0.09})`; x.beginPath(); x.ellipse(cx, cy, cw * 0.52, ch * 0.62, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.24)'; x.lineWidth = 1; x.stroke(); }
    const h0 = W * (uh - 0.05), h1 = W * (uh + 0.005);                           // cabeza y cuello: mas oscuros (o mas palidos) y de escamas mas grandes
    const gc = x.createLinearGradient(h0, 0, h1, 0); gc.addColorStop(0, 'rgba(0,0,0,0)'); gc.addColorStop(1, P.cabeza);
    x.fillStyle = gc; x.fillRect(h0, 0, h1 - h0, H); x.fillStyle = P.cabeza; x.fillRect(h1, 0, W - h1, H);
    x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 1.5;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) { x.beginPath(); x.ellipse(h1 + (i + 0.5 * (j % 2)) * (W - h1) / 8.5, (j + 0.5) * H / 6.5, (W - h1) / 17, H / 13.5, 0, 0, TAU); x.stroke(); }
    x.fillStyle = e.labio; x.globalAlpha = 0.9; x.fillRect(h1, 0.925 * H, W - h1, 0.05 * H); x.fillRect(h1, 0.6 * H, W - h1, 0.3 * H); x.globalAlpha = 1;   // labios y barbilla claros
    x.strokeStyle = 'rgba(15,8,4,0.85)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(h1, 0.975 * H); x.lineTo(W, 0.975 * H); x.stroke();                      // linea de la boca
  });
}
const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };

/* Serpiente de una sola piel (cola → cabeza): seccion eliptica con vientre plano, cabeza aplastada de hocico redondo,
   ojos con pupila y ceja, fosas nasales y lengua bifida que sale a ratos. Cabeza hacia +X, apoyada en y = 0.
   o: { t, escala, amp, ondas, vel, pos, rumbo, alfa, alza (cabeza levantada 0..1), res (resolucion) } */
function serpienteMalla(id, e, o = {}) {
  const t = o.t || 0, s = o.escala == null ? 1 : o.escala, L = e.largo * s, r0 = e.r * s, uh = 1 - e.cab;
  const amp = (o.amp == null ? 0.14 : o.amp) * L / 1.6 * 1.6, ond = o.ondas || 2.3, fase = (o.vel == null ? 3.2 : o.vel) * t, alza = o.alza || 0;
  const NU = o.res || 200, NV = 18;
  const forma = (u) => {                                                          // semiejes a (ancho) y b (alto) de la seccion en u
    const tailr = u < 0.3 ? 0.03 + 0.97 * Math.pow(Math.sin(u / 0.3 * PI / 2), 0.8) : 1;
    let a = r0 * tailr * (1 + 0.10 * Math.sin(PI * c01((u - 0.15) / 0.7))) * (1 - e.cuello * Math.exp(-Math.pow((u - (uh - 0.035)) / 0.03, 2)));
    const h = c01((u - uh) / (1 - uh));
    a *= (1 + (e.cabW - 1) * sm(0, 0.38, h)) * (1 - 0.42 * sm(0.35, 0.85, h)) * (h > 0.82 ? Math.sqrt(Math.max(0.0004, 1 - Math.pow((h - 0.82) / 0.18, 2))) : 1);
    let b = a * (0.95 + (e.cabH - 0.95) * sm(0, 0.3, h));
    if (e.remo && u < 0.3) { const q = 1 - u / 0.3; a *= 1 - 0.35 * q; b *= 1 + 1.3 * q; }   // marina: cola en forma de remo (aplastada de lado)
    return [a, b];
  };
  const lift = (u) => alza * 0.26 * (L / 1.9) * (sm(0.74, 0.92, u) - 0.15 * sm(0.93, 1, u));
  const base = (u) => [(u - 0.5) * L, lift(u), Math.sin(u * ond * TAU - fase) * amp * (0.45 + 0.55 * (1 - u))];
  const marco = (u) => { const p = base(u), q = base(Math.min(1, u + 0.004)), p0 = base(Math.max(0, u - 0.004));
    let T = [q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]; const m = Math.hypot(...T) || 1; T = T.map(v => v / m);
    let S = [T[2], 0, -T[0]]; const ms = Math.hypot(...S) || 1; S = S.map(v => v / ms);
    const U = [T[1] * S[2] - T[2] * S[1], T[2] * S[0] - T[0] * S[2], T[0] * S[1] - T[1] * S[0]]; return { p, T, S, U }; };
  const punto = (u, phi, k = 1) => { const [a, b] = forma(u), m = marco(u), ca = Math.cos(phi) * a * k, sa = Math.sin(phi), sy = (sa > 0 ? sa : sa * 0.78) * b * k;
    return [m.p[0] + m.S[0] * ca + m.U[0] * sy, m.p[1] + b * 0.78 + m.S[1] * ca + m.U[1] * sy, m.p[2] + m.S[2] * ca + m.U[2] * sy]; };
  const malla = MA.parametrica(NU, NV, (u, v) => punto(u, v * TAU), { dinamica: 'serp|' + id });
  const mat = { color: '#ffffff', mapa: pintarPiel(e.piel), esp: 0.22, dureza: 34, envolver: 0.35 };
  /* cabeza: ojos, cejas, fosas nasales y lengua */
  const ue = uh + 0.5 * e.cab, phie = 0.62, hijos = [V.nodo({ malla, mat })], yaw = (u) => { const m = marco(u); return Math.atan2(-m.T[2], m.T[0]); };
  const re = e.ojo * r0, ye = yaw(ue), mE = marco(ue);
  for (const lado of [1, -1]) {
    const pe = punto(ue, lado > 0 ? phie : PI - phie, 0.96), nx = [mE.S[0] * lado * Math.cos(phie) + mE.U[0] * Math.sin(phie) + mE.T[0] * 0.4, mE.S[1] * lado * Math.cos(phie) + mE.U[1] * Math.sin(phie) + mE.T[1] * 0.4, mE.S[2] * lado * Math.cos(phie) + mE.U[2] * Math.sin(phie) + mE.T[2] * 0.4];
    const mn = Math.hypot(...nx), n = nx.map(v => v / mn);
    hijos.push(V.nodo({ malla: MA.esfera(14), esc: re, pos: pe, mat: { color: e.iris, esp: 0.7, dureza: 70, envolver: 0.2 } }));
    hijos.push(V.nodo({ malla: MA.esfera(10), esc: re * 0.52, pos: [pe[0] + n[0] * re * 0.62, pe[1] + n[1] * re * 0.62, pe[2] + n[2] * re * 0.62], mat: { color: '#050403', esp: 0.8, dureza: 90, tipo: 'plano' } }));
    hijos.push(V.nodo({ malla: MA.esfera(10), esc: [re * 1.5, re * 0.42, re * 0.95], rot: [0, ye, 0], pos: [pe[0] + mE.U[0] * re * 0.78 - mE.T[0] * re * 0.15, pe[1] + mE.U[1] * re * 0.78, pe[2] + mE.U[2] * re * 0.78 - mE.T[2] * re * 0.15], mat: { color: e.ceja, esp: 0.1, dureza: 20 } }));
    const pn = punto(uh + 0.9 * e.cab, lado > 0 ? 1.05 : PI - 1.05, 1.0);
    hijos.push(V.nodo({ malla: MA.esfera(8), esc: [r0 * 0.1, r0 * 0.06, r0 * 0.1], pos: pn, mat: { color: '#0a0806', tipo: 'plano' } }));
  }
  const flick = Math.pow(Math.max(0, Math.sin(t * 5.2 + id.length * 1.7)), 8);
  if (flick > 0.04) {                                                              // lengua bifida (negra con punta rojiza) que entra y sale
    const tip = punto(1, -0.5, 1), len = r0 * (0.5 + 3.4 * flick), th = r0 * 0.06, yt = yaw(0.995);
    hijos.push(V.nodo({ pos: [tip[0], tip[1] + r0 * 0.05, tip[2]], rot: [0, yt, 0], hijos: [
      V.nodo({ malla: MA.caja(len, th, th, th * 0.4), pos: [len * 0.5, 0, 0], mat: { color: '#4a1118' } }),
      ...[1, -1].map(k => V.nodo({ malla: MA.caja(len * 0.35, th, th, th * 0.4), rot: [0, k * 0.5, 0], pos: [len + len * 0.14, 0, k * len * 0.08], mat: { color: '#a3202c' } })) ] }));
  }
  return V.nodo({ pos: o.pos, rot: [0, o.rumbo || 0, 0], alfa: o.alfa, hijos });
}

const cabezaMundo = (e, o = {}) => { const s = o.escala == null ? 1 : o.escala, a = o.rumbo || 0, x = (e.largo * s) / 2 - e.r * s * 1.2, p = o.pos || [0, 0, 0];
  return [p[0] + x * Math.cos(a), p[1] + e.r * s, p[2] - x * Math.sin(a)]; };
const dame = (esp) => typeof esp === 'string' ? ESP[esp] : esp;
MO.serpiente = (o = {}) => serpienteMalla(o.id || ('serp_' + (typeof o.especie === 'string' ? o.especie : 'x')), dame(o.especie || 'interior'), o);
MO.serpiente.especies = ESP; MO.serpiente.pieles = PIEL;
MO.serpiente.cabeza = (esp, o) => cabezaMundo(dame(esp), o);
})(window.VE);
