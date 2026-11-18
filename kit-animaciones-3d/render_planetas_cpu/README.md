# Trazador analítico de planetas por CPU (ejemplo: «Si la Luna fuera como Júpiter»)

Esferas trazadas analíticamente (no SDF), texturas procedurales reutilizadas de `temas/planeta/modelo.js`.
- `luna.js`: cuerpos (luna, Júpiter, Ío, Tierra con mar/lava), iluminación, estrellas.
- `scene.js`: escena de suelo (playa, mar, figura, libro), cámara con lens-shift, anillos de órbita, brillos.
- `shots.js`: plan de planos con disolvencias (`renderFrame(t,w,h)`).
- `still.cjs <w> <h> t1 t2…`: fotogramas de control. `rf2.cjs <dir> <w> <h> <ini> <fin> <fps> <hilos>`: render reanudable.
- `overlay/`: capa editorial 1080×1920 (subtítulos con clave, rótulos, tarjetas de dato) a .mov con alfa.
Sin dependencias externas salvo `kit-animaciones-3d/estilos/motor3d.js`. Medido: ~0,6 fotogramas/s a 540×960 con 2 hilos.

## dos_lunas/ (Si la Tierra tuviera dos Lunas)
Variante del trazador con cielo desde la playa y dos Lunas: halo (`glow`) que escala con el campo de visión, Sol con limbo y cielo de día (`S.day`), eclipses (Luna sobre el Sol), noche con fases distintas por cuerpo y vuelta al gancho con la segunda Luna apareciendo.
- `node still.cjs <w> <h> t1 t2 …` → fotogramas de control en `stills/`.
- `node rf2.cjs <carpeta> <w> <h> <ini> <fin> <fps> <hilos>` → secuencia PNG reanudable (≈50 fotogramas/min a 540×960 con 4 hilos en 2 CPU).
- `overlay/`: subtítulos editoriales con palabras clave, chips de hipótesis/estimación y tarjetas de dato (`node overlay.cjs ov.mov <dur> 30`; necesita `marks.json` y `palabras.json` al lado).
Montaje usado: planos del motor (VE.vol) + planos del trazador con fundidos de 0,2 s, overlay y letrero encima.
