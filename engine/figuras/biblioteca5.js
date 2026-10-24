/* BIBLIOTECA 5: relatividad general / gravedad (satelite, agujero negro, ascensor, sabana del espacio-tiempo, rosetas de Mercurio, luz que se curva,
   eclipse, ondas gravitacionales, lente gravitacional, interferometro, telescopio). Mismo estilo de luz que las bibliotecas 3 y 4. */
(function (VE) {
  const D = VE.trazo.definir, PI = Math.PI;
  const ORO = '#FFC84A', AZ = '#6CC8FF', VI = '#B88CFF', ROSA = '#FF8FC0', BL = '#EAF4FF', AM = '#FFB86B', GR = '#9FB6E8', VD = '#5BE07A', RJ = '#FF7A6B';
  const elipse = (cx, cy, rx, ry, n = 80, rot = 0) => { const o = []; for (let i = 0; i <= n; i++) { const a = i / n * PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return o; };

  D('satelite_gps', { desc: 'satelite con dos paneles solares y ondas de senal', partes: [
    { d: 'M40 40 L60 40 L60 60 L40 60 Z', color: GR, relleno: false, ancho: 1.3, orden: 1 },
    { d: 'M8 42 L38 42 L38 58 L8 58 Z M62 42 L92 42 L92 58 L62 58 Z M18 42 L18 58 M28 42 L28 58 M72 42 L72 58 M82 42 L82 58', color: AZ, relleno: false, ancho: 0.9, orden: 1 },
    { d: 'M50 60 L50 72', color: GR, relleno: false, ancho: 1, orden: 0 }, { arco: [50, 72, 10, 10, 0.2, PI - 0.2, 20, 0], color: ORO, ancho: 0.8, relleno: false, orden: 2 },
    { arco: [50, 72, 18, 18, 0.35, PI - 0.35, 24, 0], color: ORO, ancho: 0.6, relleno: false, orden: 2 }, { arco: [50, 72, 26, 26, 0.5, PI - 0.5, 28, 0], color: ORO, ancho: 0.5, relleno: false, orden: 2 }] });
  D('agujero_negro', { desc: 'agujero negro: horizonte oscuro, disco de materia inclinado y luz curvada alrededor', partes: [
    { circ: [50, 50, 14], color: GR, relleno: false, ancho: 1.4, orden: 2 }, { circ: [50, 50, 20], color: AM, relleno: false, ancho: 0.8, orden: 1 },
    { gen: () => [elipse(50, 50, 44, 11, 90), elipse(50, 50, 34, 8, 90), elipse(50, 50, 26, 6, 90)], color: AM, ancho: 0.9 },
    { arco: [50, 50, 24, 30, PI * 1.1, PI * 1.9, 40, 0], color: ORO, ancho: 1.1, relleno: false, orden: 3 }] });
  D('ascensor', { desc: 'ascensor cerrado que acelera hacia arriba, con una pelota que cae en curva', partes: [
    { d: 'M26 14 L74 14 L74 86 L26 86 Z', color: GR, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M50 6 L50 14 M44 10 L50 4 L56 10', color: ORO, relleno: false, ancho: 1.2, orden: 3 },
    { circ: [32, 76, 4], color: BL, orden: 3 }, { d: 'M32 44 C44 30 60 40 66 64', color: AZ, relleno: false, ancho: 0.8, orden: 2 }, { circ: [66, 66, 3.4], color: ORO, orden: 3 }] });
  D('sabana', { desc: 'rejilla del espacio-tiempo hundida por una masa', partes: [
    { gen: () => { const o = []; for (let i = 0; i <= 8; i++) { const x0 = 10 + i * 10, l = []; for (let j = 0; j <= 30; j++) { const y = 20 + j * 2, dx = x0 - 50, dy = y - 52, g = Math.exp(-(dx * dx + dy * dy) / 260); l.push([x0 - dx * g * .25, y + g * 22]); } o.push(l); } for (let j = 0; j <= 8; j++) { const y0 = 20 + j * 7.5, l = []; for (let i = 0; i <= 30; i++) { const x = 10 + i * 2.67, dx = x - 50, dy = y0 - 52, g = Math.exp(-(dx * dx + dy * dy) / 260); l.push([x - dx * g * .25, y0 + g * 22]); } o.push(l); } return o; }, color: AZ, ancho: 0.7 },
    { circ: [50, 70, 8], color: ORO, orden: 3 }] });
  D('roseta_mercurio', { desc: 'orbita elipse que gira poco a poco (precesion) alrededor del sol', partes: [
    { gen: () => { const o = []; for (let i = 0; i <= 420; i++) { const t = i / 420 * PI * 2 * 4, r = 30 / (1 + 0.45 * Math.cos(t - t * 0.05)), a = t; o.push([50 + Math.cos(a) * r * 1.4, 50 + Math.sin(a) * r * 1.4]); } return [o]; }, color: AZ, ancho: 0.8 },
    { circ: [50, 50, 5], color: ORO, orden: 3 }] });
  D('luz_curvada', { desc: 'rayo de luz de una estrella lejana que se curva al pasar cerca del sol', partes: [
    { circ: [50, 62, 12], color: ORO, relleno: false, ancho: 1.3, orden: 2 },
    { d: 'M6 20 C30 40 36 44 50 44 C64 44 70 40 94 20', color: AM, relleno: false, ancho: 1.2, orden: 2 }, { d: 'M6 20 L94 20', color: GR, relleno: false, ancho: 0.4, orden: 0 },
    { circ: [8, 18, 3], color: BL, orden: 3 }, { circ: [92, 18, 3], color: VI, relleno: false, ancho: 0.9, orden: 3 }] });
  D('eclipse', { desc: 'eclipse total: disco oscuro con corona de rayos', partes: [
    { circ: [50, 50, 20], color: GR, relleno: false, ancho: 1.4, orden: 2 },
    { gen: () => Array.from({ length: 24 }, (_, i) => { const a = i / 24 * PI * 2, r0 = 24, r1 = 30 + (i % 3) * 8; return [[50 + Math.cos(a) * r0, 50 + Math.sin(a) * r0], [50 + Math.cos(a) * r1, 50 + Math.sin(a) * r1]]; }), color: ORO, ancho: 0.9 },
    { circ: [70, 24, 2], color: BL, orden: 3 }, { circ: [22, 76, 2], color: BL, orden: 3 }] });
  D('ondas_gravitacionales', { desc: 'dos masas que giran juntas y ondas que se expanden por el espacio', partes: [
    { gen: () => [18, 26, 34, 42].map(r => elipse(50, 50, r, r * .62, 70)), color: VI, ancho: 0.8 },
    { circ: [44, 50, 4], color: ORO, orden: 3 }, { circ: [56, 50, 4], color: AM, orden: 3 }] });
  D('lente_gravitacional', { desc: 'galaxia en el centro que curva la luz de una fuente lejana en arcos', partes: [
    { circ: [50, 50, 5], color: ORO, orden: 3 }, { arco: [50, 50, 22, 22, 0.2, 1.3, 30, 0], color: AZ, ancho: 1.3, relleno: false, orden: 2 }, { arco: [50, 50, 22, 22, PI + 0.2, PI + 1.3, 30, 0], color: AZ, ancho: 1.3, relleno: false, orden: 2 },
    { gen: () => [[[6, 70], [30, 58], [50, 60]], [[94, 30], [70, 42], [50, 40]]], color: AM, ancho: 0.7 }, { circ: [8, 72, 2.4], color: BL, orden: 3 }] });
  D('interferometro', { desc: 'detector en forma de L con dos brazos, laser y espejos', partes: [
    { d: 'M18 76 L18 18 M18 76 L82 76', color: GR, relleno: false, ancho: 1.6, orden: 1 }, { d: 'M12 18 L24 18 M82 70 L82 82', color: BL, relleno: false, ancho: 2, orden: 2 },
    { circ: [18, 76, 4], color: ORO, orden: 3 }, { d: 'M6 88 L14 80', color: RJ, relleno: false, ancho: 1.4, orden: 2 }, { gen: () => [[[18, 70], [18, 24]], [[24, 76], [76, 76]]], color: RJ, ancho: 0.5 }] });
  D('telescopio', { desc: 'telescopio sobre un tripode', partes: [
    { d: 'M24 62 L70 30 L78 42 L32 74 Z', color: GR, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M40 70 L28 94 M46 66 L58 94 M30 74 L44 90', color: GR, relleno: false, ancho: 1, orden: 0 }, { circ: [80, 32, 2.4], color: BL, orden: 3 }, { d: 'M88 22 L96 14', color: ORO, relleno: false, ancho: 1, orden: 2 }] });
  D('persona_cayendo', { desc: 'figura humana en caida libre, brazos abiertos', partes: [
    { circ: [50, 22, 7], color: BL, relleno: false, ancho: 1.3, orden: 2 }, { d: 'M50 29 L50 58 M50 38 L30 28 M50 38 L70 28 M50 58 L36 82 M50 58 L64 82', color: BL, relleno: false, ancho: 1.3, orden: 1 }, { d: 'M20 14 L20 40 M80 8 L80 34 M86 56 L86 84', color: GR, relleno: false, ancho: 0.5, orden: 0 }] });
  D('universo_expansion', { desc: 'puntos de galaxias que se alejan del centro con flechas', partes: [
    { gen: () => { const o = []; for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2 + (k % 2) * .2, r1 = 12 + (k % 3) * 6, r2 = r1 + 18; o.push([[50 + Math.cos(a) * r1, 50 + Math.sin(a) * r1], [50 + Math.cos(a) * r2, 50 + Math.sin(a) * r2]]); } return o; }, color: AZ, ancho: 0.8 },
    { gen: () => Array.from({ length: 14 }, (_, k) => { const a = k / 14 * PI * 2 + (k % 2) * .2, r = 36 + (k % 3) * 5; return [[50 + Math.cos(a) * r, 50 + Math.sin(a) * r], [50.6 + Math.cos(a) * r, 50.3 + Math.sin(a) * r]]; }), color: ORO, ancho: 3.2 },
    { circ: [50, 50, 4], color: VI, orden: 3 }] });
})(window.VE);
