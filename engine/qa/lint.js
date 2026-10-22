/* LINTER VISUAL — revisa cada fotograma de control y falla el build.

   Sustituye al "montar mosaicos y revisar a ojo", que es por donde se colaban los
   errores. Cada escena registra las cajas que dibuja y aqui se comprueban las reglas
   que hasta ahora eran notas en un documento. */
(function (VE) {

  let registro = [];
  VE.registrar = function (tipo, caja, extra) {
    registro.push(Object.assign({ tipo, x: caja.x, y: caja.y, w: caja.w, h: caja.h }, extra || {}));
  };
  VE.limpiarRegistro = function () { registro = []; };
  VE.verRegistro = function () { return registro; };

  function solapan(a, b, holgura = 0) {
    return !(a.x + a.w <= b.x + holgura || b.x + b.w <= a.x + holgura ||
             a.y + a.h <= b.y + holgura || b.y + b.h <= a.y + holgura);
  }
  function area(a) { return Math.max(0, a.w) * Math.max(0, a.h); }
  function areaSolape(a, b) {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return (w > 0 && h > 0) ? w * h : 0;
  }

  /* Analiza los pixeles de verdad: detecta fotogramas vacios, negros o reventados.
     Un fotograma casi vacio suele significar que una escena no ha dibujado nada
     porque su tramo de tiempo estaba mal calculado. */
  function analizarPixeles(esc) {
    const c = esc.canvas, x = esc.ctx;
    const N = 160; // muestreo reducido: basta para estadisticas y es barato
    const tmp = VE.atlas.lienzo(N, Math.round(N * c.height / c.width));
    const tx = tmp.getContext('2d');
    tx.drawImage(c, 0, 0, tmp.width, tmp.height);
    const d = tx.getImageData(0, 0, tmp.width, tmp.height).data;
    let suma = 0, n = 0, min = 255, max = 0;
    const vals = [];
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      vals.push(l); suma += l; n++;
      if (l < min) min = l; if (l > max) max = l;
    }
    const media = suma / n;
    let va = 0; for (const v of vals) va += (v - media) * (v - media);
    const desv = Math.sqrt(va / n);
    return { media, desv, min, max };
  }

  /* Reglas de marca: lo que el brief prohibe pasa a ser comprobacion, no memoria. */
  const PROHIBIDO = [
    { clave: 'fuente_pie', msg: 'Hay una fuente de informacion al pie de imagen (prohibido).' },
    { clave: 'chip_seccion', msg: 'Hay un chip de seccion tipo HOOK/PUPA/QUIZ (prohibido).' }
  ];

  VE.lint = function (esc, t) {
    const avisos = [];
    const err = (regla, msg) => avisos.push({ nivel: 'error', regla, t, msg });
    const adv = (regla, msg) => avisos.push({ nivel: 'aviso', regla, t, msg });
    const S = esc.seguro;

    // 1) Nada fuera de la zona segura.
    for (const r of registro) {
      if (r.ignorarSeguro) continue;
      if (r.x < S.x - 1 || r.y < S.y - 1 || r.x + r.w > S.x2 + 1 || r.y + r.h > S.y2 + 1) {
        err('zona-segura', `${r.tipo}${r.nota ? ' (' + r.nota + ')' : ''} se sale de la zona segura: ` +
          `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)}] vs ` +
          `[${S.x},${S.y} ${S.w}x${S.h}]`);
      }
    }

    // 2) El texto no se solapa con nada que lo tape.
    const textos = registro.filter(r => r.tipo === 'texto');
    const otros = registro.filter(r => r.tipo !== 'texto');
    for (let i = 0; i < textos.length; i++) {
      for (let j = i + 1; j < textos.length; j++) {
        if (solapan(textos[i], textos[j], 2)) {
          err('solape-texto', `Dos textos se solapan: "${textos[i].nota || '?'}" y "${textos[j].nota || '?'}"`);
        }
      }
      for (const o of otros) {
        if (o.detras) continue; // declarado explicitamente como capa de fondo
        const s = areaSolape(textos[i], o);
        if (s > area(textos[i]) * 0.18) {
          err('tapa-texto', `"${textos[i].nota || 'texto'}" queda tapado por ${o.tipo}` +
            `${o.nota ? ' (' + o.nota + ')' : ''} en un ${Math.round(100 * s / area(textos[i]))}%`);
        }
      }
    }

    // 3) Texto que no cupo ni en el cuerpo minimo.
    for (const r of registro) {
      if (r.desbordado) err('texto-desbordado', `"${r.nota || 'texto'}" no cabe ni al tamano minimo.`);
    }

    // 4) Contraste real del color del texto contra el fondo del estilo.
    for (const r of textos) {
      if (!r.color || r.contorno) continue; // el contorno ya garantiza legibilidad
      const cr = Math.max(VE.color.contraste(r.color, esc.estilo.fondo[0]),
                          VE.color.contraste(r.color, esc.estilo.fondo[1]));
      if (cr < 4.5) adv('contraste', `"${r.nota || 'texto'}" tiene contraste ${cr.toFixed(2)}:1 (minimo 4.5) y no lleva contorno.`);
    }

    // 5) Elementos prohibidos por el brief.
    for (const p of PROHIBIDO) {
      if (registro.some(r => r.prohibido === p.clave)) err('marca', p.msg);
    }

    // 6) Estadistica de pixeles.
    const px = analizarPixeles(esc);
    // Umbrales por proyecto: VE.proyecto({ lint: { negro: true } }) admite fondos negros deliberados (meditacion),
    // pero sigue fallando si el fotograma es TOTALMENTE negro/plano (render roto).
    const cfg = VE.lintCfg || {}, minDesv = cfg.negro ? 0.35 : 6, minMedia = cfg.negro ? 1.2 : 10;
    if (px.desv < minDesv) err('fotograma-vacio', `Fotograma casi plano (desviacion ${px.desv.toFixed(2)}): puede que no se dibuje nada.`);
    if (px.media < minMedia) err('fotograma-negro', `Fotograma casi negro (luminancia media ${px.media.toFixed(1)}).`);
    if (px.media > 230) adv('fotograma-quemado', `Fotograma muy claro (luminancia media ${px.media.toFixed(1)}).`);

    return { t, avisos, pixeles: px, elementos: registro.length };
  };
})(window.VE = window.VE || {});
