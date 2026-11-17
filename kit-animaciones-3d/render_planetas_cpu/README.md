# Trazador analítico de planetas por CPU (ejemplo: «Si la Luna fuera como Júpiter»)

Esferas trazadas analíticamente (no SDF), texturas procedurales reutilizadas de `temas/planeta/modelo.js`.
- `luna.js`: cuerpos (luna, Júpiter, Ío, Tierra con mar/lava), iluminación, estrellas.
- `scene.js`: escena de suelo (playa, mar, figura, libro), cámara con lens-shift, anillos de órbita, brillos.
- `shots.js`: plan de planos con disolvencias (`renderFrame(t,w,h)`).
- `still.cjs <w> <h> t1 t2…`: fotogramas de control. `rf2.cjs <dir> <w> <h> <ini> <fin> <fps> <hilos>`: render reanudable.
- `overlay/`: capa editorial 1080×1920 (subtítulos con clave, rótulos, tarjetas de dato) a .mov con alfa.
Sin dependencias externas salvo `kit-animaciones-3d/estilos/motor3d.js`. Medido: ~0,6 fotogramas/s a 540×960 con 2 hilos.
