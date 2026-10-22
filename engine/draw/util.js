(function (VE) {
  /* Color: convierte cualquier notacion a rgba con alfa dado. El atlas necesita
     generar degradados que terminan en alfa 0, y '#RRGGBB00' no vale en todos los casos. */
  function aRGB(col) {
    if (col.startsWith('#')) {
      let h = col.slice(1);
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const m = col.match(/rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(',').map(s => parseFloat(s)); return [p[0], p[1], p[2]]; }
    const h = col.match(/hsla?\(([^)]+)\)/);
    if (h) { const p = h[1].split(',').map(s => parseFloat(s)); return hslARGB(p[0], p[1], p[2]); }
    throw new Error('Color no reconocido: ' + col);
  }
  function hslARGB(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  VE.color = {
    a(col, alfa) { const [r, g, b] = aRGB(col); return `rgba(${r},${g},${b},${alfa})`; },
    aRGB,
    // Luminancia relativa WCAG: la usa el linter para exigir contraste de verdad.
    luminancia(col) {
      const [r, g, b] = aRGB(col);
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    },
    contraste(c1, c2) {
      const a = VE.color.luminancia(c1), b = VE.color.luminancia(c2);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    },
    aHSL(col) {
      const [r, g, b] = aRGB(col).map(v => v / 255);
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
      if (mx !== mn) {
        const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
      }
      return [h, s * 100, l * 100];
    },
    hsl(h, s, l, a = 1) { return `hsla(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%,${a})`; },
    /* Color de LUZ para un objeto: mismo tono que su color real, pero con la luminosidad y saturacion
       minimas para que brille sobre fondo oscuro. Un tronco marron se dibuja con luz ambar, no con gris. */
    luz(col, lMin = 62, sMin = 60) { const [h, s, l] = VE.color.aHSL(col); return VE.color.hsl(h, Math.max(s, sMin), Math.max(l, lMin)); },
    nucleo(col) { const [h, s, l] = VE.color.aHSL(col); return VE.color.hsl(h, Math.min(s, 70), Math.min(96, Math.max(l, 62) + 22)); },
    claro(col, p) { const [h, s, l] = VE.color.aHSL(col); return VE.color.hsl(h, s, Math.min(96, l + (100 - l) * p)); },
    oscuro(col, p) { const [h, s, l] = VE.color.aHSL(col); return VE.color.hsl(h, s, l * (1 - p)); },
    mezcla(c1, c2, p) {
      const a = aRGB(c1), b = aRGB(c2);
      return `rgb(${Math.round(a[0] + (b[0] - a[0]) * p)},${Math.round(a[1] + (b[1] - a[1]) * p)},${Math.round(a[2] + (b[2] - a[2]) * p)})`;
    }
  };

  VE.ruta = {
    redondeado(x, px, py, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      x.beginPath();
      x.moveTo(px + r, py);
      x.arcTo(px + w, py, px + w, py + h, r);
      x.arcTo(px + w, py + h, px, py + h, r);
      x.arcTo(px, py + h, px, py, r);
      x.arcTo(px, py, px + w, py, r);
      x.closePath();
    },
    estrella(x, cx, cy, puntas, rExt, rInt) {
      x.beginPath();
      for (let i = 0; i < puntas * 2; i++) {
        const r = i % 2 ? rInt : rExt;
        const a = (i / (puntas * 2)) * Math.PI * 2 - Math.PI / 2;
        i ? x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
          : x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      x.closePath();
    }
  };
})(window.VE = window.VE || {});
