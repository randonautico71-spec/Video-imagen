/* Curvas de movimiento. El movimiento lineal es la firma del "hecho con codigo";
   esto es lo que hace que una entrada parezca animada y no interpolada. */
(function (VE) {
  const E = {
    lineal: t => t,
    suaveEntrada: t => t * t * t,
    suaveSalida: t => 1 - Math.pow(1 - t, 3),
    suave: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    expoSalida: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    expoEntrada: t => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    atrasSalida: t => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    atrasEntrada: t => { const c = 1.70158, c3 = c + 1; return c3 * t * t * t - c * t * t; },
    elastico: t => {
      if (t === 0 || t === 1) return t;
      const p = (2 * Math.PI) / 3;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * p) + 1;
    },
    rebote: t => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    }
  };

  // Muelle critico: llega sin oscilar. Para apariciones que no deben distraer.
  E.muelle = function (t, rigidez = 8) {
    if (t <= 0) return 0; if (t >= 1) return 1;
    return 1 - Math.exp(-rigidez * t) * (1 + rigidez * t);
  };

  /* Progreso normalizado de un tramo de tiempo. Es la base de toda animacion:
     en vez de contar fotogramas, cada escena pregunta "por donde voy". */
  VE.tramo = function (t, inicio, duracion, easing) {
    const p = Math.max(0, Math.min(1, (t - inicio) / duracion));
    return (easing || E.suave)(p);
  };

  // Entradas escalonadas: el i-esimo elemento empieza un poco despues que el anterior.
  VE.escalonado = function (t, inicio, duracion, i, retardo, easing) {
    return VE.tramo(t, inicio + i * retardo, duracion, easing);
  };

  VE.mezclar = (a, b, p) => a + (b - a) * p;
  VE.ease = E;
})(window.VE = window.VE || {});
