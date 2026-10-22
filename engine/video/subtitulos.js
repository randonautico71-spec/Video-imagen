/* Agrupa las palabras con tiempos en subtitulos y los dibuja. Herramienta: cada proyecto
   decide si los usa y como (tamano, color de la palabra activa, caja). */
(function (VE) {
  VE.agruparSubtitulos = function (palabras, opt = {}) {
    const max = opt.palabras || 6, hueco = opt.hueco || 0.45;
    const grupos = []; let g = null;
    palabras.forEach((w, i) => {
      const ant = palabras[i - 1];
      const corta = g && (g.palabras.length >= max || (ant && w.ini - ant.fin > hueco) || /[.!?…]$/.test(ant ? ant.t : ''));
      if (!g || corta) { g = { palabras: [] }; grupos.push(g); }
      g.palabras.push(w);
    });
    grupos.forEach(q => { q.ini = q.palabras[0].ini; q.fin = q.palabras[q.palabras.length - 1].fin; });
    return grupos;
  };
  // Grupo visible en t: el que empieza antes y no ha sido reemplazado; desaparece 0.25 s tras su ultima palabra.
  VE.grupoEn = function (grupos, t, persistencia = 0.25) {
    let lo = 0, hi = grupos.length - 1, r = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (grupos[m].ini - 0.05 <= t) { r = m; lo = m + 1; } else hi = m - 1; }
    if (r < 0) return null;
    return t <= grupos[r].fin + persistencia ? grupos[r] : null;
  };
})(window.VE = window.VE || {});
