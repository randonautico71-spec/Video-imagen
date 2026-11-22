# SDF con persona (vídeo «sordera súbita»)

Código reutilizable en `kit-animaciones-3d/sdf/persona/` y runners en `kit-animaciones-3d/bin/sdf_botones.cjs` y `sdf_still.cjs`.

- `motor_sordera.js`: renderFrame con alabeo de cámara (roll), desplazamiento de lente, capas alfa, hook de vidrio analítico y normales tetraédricas.
- `sordera_sdf.js`: persona (esqueleto con IK, torso, cabeza con orejas, manos de 5 dedos), habitación, oído interno (cóclea, canales, huesecillos) y sombras analíticas.
- `render_chunks.sh`: render reanudable por bloques (15 fps, 540×960). Después: concatenar, `minterpolate` a 30 fps y mezclar con `drawbox` + `format=gbrp` + `blend=screen` sobre el `mudo.mp4` del motor (el `drawbox` va ANTES del `format=gbrp`, si no sale tinte magenta).
- Las rutas de `render_chunks.sh` y `still.js` apuntan a `proyectos/sordera`: cámbialas por tu tema.

Lecciones:
- No uses parches de luz con borde duro sobre la piel o la ropa (sol de ventana): parten la cara. Sobre personas, luz uniforme y suave.
- Los tintes por zona (oreja, mejilla) con caja de coordenadas locales dejan bordes rectos sobre mano y mejilla: usa caída radial suave.
- Coste medido con 2 CPU: ~5,4 s por fotograma a 540×960 en escenas de habitación; planos del oído más baratos. Un vídeo de 48 s a 15 fps tarda ~65 min.
- Un render en segundo plano se corta si el shell termina: lánzalo con `setsid nohup` y comprueba los bloques con ffprobe (un bloque truncado se ve al concatenar).
- Pendiente: el pitido de acúfeno (`efectos_sordera.py`) no está aprobado por el usuario y no se ha añadido a `pipeline/efectos.py`.
