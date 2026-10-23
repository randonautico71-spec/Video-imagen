/* BIBLIOTECA 3: fisica para explicar de forma plana (escalera, pendulo, atomo con niveles, foton, tunel, moneda, nube de probabilidad,
   entrelazamiento, lampara, chip, taza...). Trazos de luz suaves; pensada para fondo oscuro. */
(function (VE) {
  const D = VE.trazo.definir, PI = Math.PI;
  const ORO = '#FFC84A', AZ = '#6CC8FF', VI = '#B88CFF', ROSA = '#FF8FC0', VERDE = '#5BE07A', BL = '#EAF4FF', AM = '#FFB86B', GR = '#9FB6E8';
  const rnd = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

  D('escalera', { desc: 'escalera de tres escalones con un punto en el segundo', partes: [
    { d: 'M8 88 L8 70 L30 70 L30 52 L52 52 L52 34 L74 34 L74 16 L92 16', color: AZ, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M8 88 L92 88', color: GR, relleno: false, ancho: 0.6, orden: 0 },
    { circ: [41, 44, 4], color: ORO, orden: 3 }] });

  D('rampa', { desc: 'rampa suave con una bolita', partes: [
    { d: 'M8 86 L92 20', color: AZ, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M8 86 L92 86 L92 20', color: GR, relleno: false, ancho: 0.6, orden: 0 },
    { circ: [52, 49, 4], color: ORO, orden: 3 }] });

  D('manzana', { desc: 'manzana', partes: [
    { union: [[40, 56, 22], [60, 56, 22]], color: '#FF7A7A', orden: 1 },
    { d: 'M50 36 C50 28 52 22 56 16', color: '#C8A878', relleno: false, ancho: 1.1, orden: 2 },
    { d: 'M54 22 C62 14 72 16 74 22 C66 28 58 28 54 22 Z', color: VERDE, orden: 2 }] });

  D('pelota', { desc: 'pelota', partes: [
    { circ: [50, 50, 30], color: AM, relleno: false, ancho: 1.2, orden: 1 },
    { d: 'M20 50 C38 40 62 40 80 50 M20 50 C38 60 62 60 80 50 M50 20 C42 38 42 62 50 80', color: AM, relleno: false, ancho: 0.7, orden: 0 }] });

  D('pendulo', { desc: 'pendulo colgando', partes: [
    { d: 'M30 10 L70 10', color: GR, relleno: false, ancho: 1.2, orden: 0 },
    { d: 'M50 10 L50 70', color: GR, relleno: false, ancho: 0.8, orden: 1 },
    { circ: [50, 78, 9], color: ORO, orden: 3 },
    { arco: [50, 10, 70, 70, PI * 0.30, PI * 0.70, 40, 0], color: AZ, ancho: 0.5, relleno: false, orden: 0 }] });

  D('engranaje', { desc: 'engranaje de relojeria', partes: [
    { gen: () => { const o = []; const n = 12; for (let i = 0; i < n * 4; i++) { const a = i / (n * 4) * PI * 2, k = i % 4, r = (k === 1 || k === 2) ? 44 : 36; o.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]); } o.push(o[0]); return [o]; }, color: GR, ancho: 1.1 },
    { circ: [50, 50, 16], color: GR, relleno: false, ancho: 0.8, orden: 1 },
    { circ: [50, 50, 4], color: ORO, orden: 3 }] });

  D('lupa', { desc: 'lupa', partes: [
    { circ: [42, 42, 26], color: AZ, relleno: false, ancho: 1.4, orden: 1 },
    { d: 'M61 61 L88 88', color: AM, relleno: false, ancho: 2.2, orden: 1 },
    { arco: [42, 42, 18, 18, PI * 1.1, PI * 1.6, 20, 0], color: BL, ancho: 0.6, relleno: false, orden: 2 }] });

  D('plano', { desc: 'plano de una ciudad con calles', partes: [
    { d: 'M10 20 L90 20 L90 80 L10 80 Z', color: GR, relleno: false, ancho: 1, orden: 0 },
    { d: 'M10 50 L90 50 M35 20 L35 80 M65 20 L65 80 M10 35 L35 35 M65 65 L90 65', color: AZ, relleno: false, ancho: 0.8, orden: 1 },
    { circ: [50, 50, 3], color: ORO, orden: 3 }] });

  D('relojeria', { desc: 'dos engranajes', partes: [
    { gen: () => { const o = []; for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2, r = (i % 4 < 2) ? 26 : 21; o.push([30 + Math.cos(a) * r, 52 + Math.sin(a) * r]); } o.push(o[0]); return [o]; }, color: GR, ancho: 1 },
    { gen: () => { const o = []; for (let i = 0; i < 32; i++) { const a = i / 32 * PI * 2, r = (i % 4 < 2) ? 20 : 16; o.push([68 + Math.cos(a) * r, 40 + Math.sin(a) * r]); } o.push(o[0]); return [o]; }, color: AM, ancho: 1 },
    { circ: [30, 52, 4], color: ORO, orden: 3 }, { circ: [68, 40, 3], color: ORO, orden: 3 }] });

  D('atomo_niveles', { desc: 'atomo con nucleo y tres niveles de energia concentricos', partes: [
    { circ: [50, 50, 5], color: ORO, orden: 3 },
    { circ: [50, 50, 16], color: AZ, relleno: false, ancho: 0.8, orden: 0 },
    { circ: [50, 50, 28], color: VI, relleno: false, ancho: 0.8, orden: 0 },
    { circ: [50, 50, 42], color: ROSA, relleno: false, ancho: 0.8, orden: 0 },
    { circ: [66, 50, 2.6], color: BL, orden: 4 }] });

  D('nucleo', { desc: 'nucleo pequeño con electrones lejanos', partes: [
    { union: [[48, 48, 3], [53, 51, 3], [50, 54, 3], [52, 46, 3]], color: ORO, orden: 3 },
    { circ: [50, 50, 40], color: GR, relleno: false, ancho: 0.4, orden: 0 },
    { circ: [88, 40, 2], color: AZ, orden: 3 }, { circ: [14, 64, 2], color: AZ, orden: 3 }] });

  D('foton', { desc: 'paquete de luz: onda corta con envolvente', partes: [
    { gen: () => { const o = []; for (let i = 0; i <= 120; i++) { const t = i / 120, x = 6 + t * 88, env = Math.exp(-Math.pow((t - 0.5) / 0.22, 2)); o.push([x, 50 - Math.sin(t * PI * 14) * 26 * env]); } return [o]; }, color: AM, ancho: 1.2 },
    { d: 'M6 50 L94 50', color: GR, relleno: false, ancho: 0.4, orden: 0 }] });

  D('onda', { desc: 'onda senoidal suave', partes: [
    { gen: () => { const o = []; for (let i = 0; i <= 100; i++) { const t = i / 100; o.push([4 + t * 92, 50 - Math.sin(t * PI * 6) * 22]); } return [o]; }, color: AZ, ancho: 1.2 }] });

  D('lluvia_luz', { desc: 'lluvia fina de paquetes de luz', partes: [
    { gen: () => { const r = rnd(7), o = []; for (let i = 0; i < 26; i++) { const x = 6 + r() * 88, y = 6 + r() * 70, l = 6 + r() * 8; o.push([[x, y], [x - 2, y + l]]); } return o; }, color: AM, ancho: 0.9 }] });

  D('tunel', { desc: 'colina con tunel y una particula que la atraviesa', partes: [
    { d: 'M4 86 C20 86 24 24 50 24 C76 24 80 86 96 86', color: GR, relleno: false, ancho: 1.2, orden: 1 },
    { d: 'M36 86 C36 62 64 62 64 86', color: AZ, relleno: false, ancho: 0.9, orden: 1 },
    { circ: [14, 78, 3.5], color: ORO, orden: 3 }, { circ: [86, 78, 3.5], color: ORO, relleno: false, ancho: 0.9, orden: 3 },
    { d: 'M20 78 L80 78', color: ORO, relleno: false, ancho: 0.4, orden: 0 }] });

  D('moneda', { desc: 'moneda girando (elipse)', partes: [
    { arco: [50, 50, 12, 36, 0, PI * 2, 60, 0], color: ORO, ancho: 1.3, orden: 1 },
    { arco: [50, 50, 7, 26, 0, PI * 2, 60, 0], color: AM, ancho: 0.5, relleno: false, orden: 0 }] });

  D('moneda_cara', { desc: 'moneda de frente', partes: [
    { circ: [50, 50, 32], color: ORO, relleno: false, ancho: 1.3, orden: 1 },
    { circ: [50, 50, 24], color: AM, relleno: false, ancho: 0.5, orden: 0 }] });

  D('nube_prob', { desc: 'nube de puntos: probabilidad, mas densa en el centro', partes: [
    { gen: () => { const r = rnd(11), o = []; for (let i = 0; i < 90; i++) { const a = r() * PI * 2, d = Math.pow(r(), 1.7) * 40; const x = 50 + Math.cos(a) * d, y = 50 + Math.sin(a) * d * 0.9; o.push([[x, y], [x + 0.5, y + 0.2]]); } return o; }, color: AZ, ancho: 2.2 },
    { circ: [50, 50, 3], color: ORO, orden: 3 }] });

  D('franjas', { desc: 'pantalla con franjas de interferencia', partes: [
    { d: 'M86 8 L86 92', color: GR, relleno: false, ancho: 1, orden: 0 },
    { gen: () => Array.from({ length: 7 }, (_, i) => [[86, 14 + i * 12], [86 + 6 - Math.abs(i - 3) * 1.3, 14 + i * 12]]), color: AZ, ancho: 2.4 },
    { d: 'M10 8 L10 40 M10 46 L10 54 M10 60 L10 92', color: GR, relleno: false, ancho: 1.2, orden: 1 },
    { gen: () => [[[10, 43], [60, 43]], [[10, 57], [60, 57]]], color: VI, ancho: 0.4 }] });

  D('entrelazadas', { desc: 'dos particulas unidas por un hilo de luz que se curva', partes: [
    { circ: [14, 50, 6], color: AZ, orden: 3 }, { circ: [86, 50, 6], color: VI, orden: 3 },
    { gen: () => { const o = []; for (let i = 0; i <= 80; i++) { const t = i / 80; o.push([20 + t * 60, 50 + Math.sin(t * PI * 4) * 10 * Math.sin(t * PI)]); } return [o]; }, color: ROSA, ancho: 0.9 }] });

  D('lampara', { desc: 'bombilla encendida', partes: [
    { union: [[50, 40, 22], [50, 54, 14]], color: AM, orden: 1 },
    { d: 'M42 72 L58 72 M44 78 L56 78 M47 84 L53 84', color: GR, relleno: false, ancho: 1.1, orden: 1 },
    { d: 'M44 50 C46 42 50 56 50 44 C50 56 54 42 56 50', color: BL, relleno: false, ancho: 0.6, orden: 2 }] });

  D('led', { desc: 'diodo led con luz', partes: [
    { d: 'M38 74 L38 40 C38 22 62 22 62 40 L62 74 Z', color: VERDE, orden: 1 },
    { d: 'M44 74 L44 92 M56 74 L56 92', color: GR, relleno: false, ancho: 1, orden: 0 },
    { d: 'M20 30 L28 36 M80 30 L72 36 M50 8 L50 16', color: VERDE, relleno: false, ancho: 0.9, orden: 1 }] });

  D('laser', { desc: 'rayo laser fino', partes: [
    { d: 'M10 50 L90 50', color: '#FF6B6B', relleno: false, ancho: 1.2, orden: 1 },
    { d: 'M6 44 L22 44 L22 56 L6 56 Z', color: GR, relleno: false, ancho: 0.9, orden: 0 },
    { circ: [90, 50, 2.6], color: '#FF9A9A', orden: 3 }] });

  D('movil', { desc: 'telefono movil con pantalla', partes: [
    { d: 'M34 8 L66 8 C70 8 72 10 72 14 L72 86 C72 90 70 92 66 92 L34 92 C30 92 28 90 28 86 L28 14 C28 10 30 8 34 8 Z', color: GR, relleno: false, ancho: 1.2, orden: 1 },
    { d: 'M34 16 L66 16 L66 78 L34 78 Z', color: AZ, ancho: 0.5, relleno: false, orden: 0 },
    { circ: [50, 85, 2.2], color: GR, relleno: false, ancho: 0.8, orden: 1 }] });

  D('resonancia', { desc: 'maquina de resonancia: anillo con camilla', partes: [
    { circ: [50, 46, 34], color: GR, relleno: false, ancho: 1.3, orden: 1 },
    { circ: [50, 46, 22], color: AZ, relleno: false, ancho: 0.8, orden: 0 },
    { d: 'M14 74 L86 74 M14 78 L86 78', color: VI, relleno: false, ancho: 0.9, orden: 1 }, { d: 'M30 90 L30 78 M70 90 L70 78', color: GR, relleno: false, ancho: 0.8, orden: 0 }] });

  D('placa_solar', { desc: 'panel solar inclinado', partes: [
    { d: 'M18 74 L34 28 L90 28 L74 74 Z', color: AZ, relleno: false, ancho: 1.2, orden: 1 },
    { d: 'M26 51 L82 51 M50 28 L38 74 M70 28 L58 74', color: GR, relleno: false, ancho: 0.6, orden: 0 },
    { d: 'M46 74 L42 92 M60 74 L64 92', color: GR, relleno: false, ancho: 0.9, orden: 0 }] });

  D('chip', { desc: 'chip con patillas', partes: [
    { d: 'M26 26 L74 26 L74 74 L26 74 Z', color: GR, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M36 36 L64 36 L64 64 L36 64 Z', color: AZ, relleno: false, ancho: 0.6, orden: 0 },
    { gen: () => { const o = []; for (let i = 0; i < 5; i++) { const p = 33 + i * 8.5; o.push([[p, 26], [p, 16]], [[p, 74], [p, 84]], [[26, p], [16, p]], [[74, p], [84, p]]); } return o; }, color: GR, ancho: 0.9 },
    { circ: [50, 50, 3], color: ORO, orden: 3 }] });

  D('transistor', { desc: 'interruptor diminuto: compuerta entre dos canales', partes: [
    { d: 'M8 62 L40 62 M60 62 L92 62', color: AZ, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M36 52 L64 52 L64 62 L36 62 Z', color: GR, relleno: false, ancho: 0.9, orden: 0 },
    { d: 'M50 52 L50 24', color: AM, relleno: false, ancho: 1.1, orden: 1 }, { circ: [50, 20, 4], color: ORO, orden: 3 },
    { circ: [24, 62, 2.4], color: BL, orden: 4 }] });

  D('reloj_atomico', { desc: 'reloj de pared con onda en su interior', partes: [
    { circ: [50, 50, 38], color: GR, relleno: false, ancho: 1.3, orden: 1 },
    { gen: () => Array.from({ length: 12 }, (_, i) => { const a = i / 12 * PI * 2; return [[50 + Math.cos(a) * 33, 50 + Math.sin(a) * 33], [50 + Math.cos(a) * 37, 50 + Math.sin(a) * 37]]; }), color: GR, ancho: 0.8 },
    { gen: () => { const o = []; for (let i = 0; i <= 60; i++) { const t = i / 60; o.push([26 + t * 48, 50 - Math.sin(t * PI * 8) * 9]); } return [o]; }, color: AM, ancho: 0.8 }] });

  D('taza', { desc: 'taza', partes: [
    { d: 'M24 38 L24 66 C24 80 36 86 48 86 C60 86 72 80 72 66 L72 38 Z', color: AM, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M72 46 C88 46 88 66 72 66', color: AM, relleno: false, ancho: 1.1, orden: 1 },
    { d: 'M38 30 C34 24 42 20 38 12 M52 30 C48 24 56 20 52 12', color: GR, relleno: false, ancho: 0.7, orden: 0 }] });

  D('silla', { desc: 'silla', partes: [
    { d: 'M30 14 L30 54 L72 54 M30 54 L28 90 M72 54 L74 90 M36 54 L36 74', color: AM, relleno: false, ancho: 1.4, orden: 1 }] });

  D('celula', { desc: 'celula con nucleo y organulos', partes: [
    { union: [[40, 50, 30], [62, 46, 26], [52, 62, 24]], color: ROSA, relleno: false, ancho: 1.1, orden: 1 },
    { circ: [52, 52, 10], color: VI, relleno: false, ancho: 1, orden: 2 }, { circ: [52, 52, 3.5], color: VI, orden: 3 },
    { circ: [32, 44, 3], color: ORO, orden: 3 }, { circ: [68, 66, 3], color: ORO, orden: 3 }, { circ: [70, 38, 2.5], color: AZ, orden: 3 }] });

  D('cabello', { desc: 'un cabello con atomos en fila', partes: [
    { d: 'M6 40 L94 40 M6 60 L94 60', color: AM, relleno: false, ancho: 1.1, orden: 1 },
    { gen: () => Array.from({ length: 22 }, (_, i) => [[10 + i * 3.7, 50], [10.6 + i * 3.7, 50]]), color: AZ, ancho: 3.2 }] });

  D('tierra', { desc: 'planeta azul con continentes', partes: [
    { circ: [50, 50, 34], color: AZ, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M30 40 C36 30 46 32 48 40 C50 48 42 52 36 50 C30 48 28 44 30 40 Z', color: VERDE, orden: 2 },
    { d: 'M58 54 C66 52 72 58 68 66 C64 72 58 68 56 62 Z', color: VERDE, orden: 2 }] });

  D('cama', { desc: 'cama con almohada', partes: [
    { d: 'M8 72 L92 72 M8 72 L8 86 M92 72 L92 86 M8 44 L8 72', color: GR, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M14 60 C14 52 36 52 36 60 Z', color: BL, relleno: false, ancho: 0.9, orden: 2 },
    { d: 'M38 70 C50 54 74 54 92 62 L92 72 L38 72 Z', color: VI, relleno: false, ancho: 0.9, orden: 1 }] });

  D('matraz', { desc: 'matraz de experimento', partes: [
    { d: 'M42 14 L42 42 L20 82 C18 88 22 90 26 90 L74 90 C78 90 82 88 80 82 L58 42 L58 14', color: AZ, relleno: false, ancho: 1.2, orden: 1 },
    { d: 'M32 68 C42 62 58 74 70 66', color: VERDE, relleno: false, ancho: 0.9, orden: 0 }, { d: 'M38 14 L62 14', color: GR, relleno: false, ancho: 1, orden: 0 }] });

  D('mapa', { desc: 'mapa doblado con ruta', partes: [
    { d: 'M10 24 L36 16 L64 26 L90 16 L90 76 L64 86 L36 76 L10 84 Z', color: GR, relleno: false, ancho: 1, orden: 0 },
    { d: 'M36 16 L36 76 M64 26 L64 86', color: GR, relleno: false, ancho: 0.5, orden: 0 },
    { d: 'M18 66 C30 48 44 62 56 44 C64 34 76 40 82 28', color: ORO, relleno: false, ancho: 1, orden: 2 }] });

  D('piedra_ola', { desc: 'piedra y ola', partes: [
    { union: [[26, 62, 14], [38, 66, 12]], color: GR, relleno: false, ancho: 1.1, orden: 1 },
    { gen: () => { const o = []; for (let i = 0; i <= 60; i++) { const t = i / 60; o.push([48 + t * 46, 56 + Math.sin(t * PI * 3) * 8]); } return [o]; }, color: AZ, ancho: 1.1 }] });

  D('fase_gas', { desc: 'dos particulas lejanas y un hilo', partes: [
    { circ: [20, 50, 5], color: AZ, orden: 3 }, { circ: [80, 50, 5], color: VI, orden: 3 }] });

  D('arbol_estrella', { desc: 'estrella de varias puntas', partes: [
    { d: 'M50 6 L58 38 L92 40 L64 58 L74 90 L50 72 L26 90 L36 58 L8 40 L42 38 Z', color: ORO, relleno: false, ancho: 1.2, orden: 1 }] });

  D('respiro', { desc: 'tres lineas de aire suave', partes: [
    { d: 'M10 36 C30 24 50 48 70 36 C80 30 86 34 90 38 M10 52 C30 40 50 64 70 52 C80 46 86 50 90 54 M10 68 C30 56 50 80 70 68 C80 62 86 66 90 70', color: '#BFE8FF', relleno: false, ancho: 1, orden: 1 }] });
})(window.VE);
