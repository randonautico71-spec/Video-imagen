# TIPO LARGO — guía de diseño (se lee al hacer `vid.py nuevo <tema> --tipo largo`)

**Ficha** (de `config/tipos.json`): YouTube 16:9 · 30–60 min · 24 fps · voz **Serena** (Qwen3-TTS local) · música ambiental · −16 LUFS (meditación −19) · sin subtítulos por defecto · MP4 pesado + ligero.

## Flujo de producción
1. `python3 pipeline/vid.py nuevo <tema> --tipo largo` (para meditación, poner `"voz": "serena_meditacion"` en `meta.json`: pausas más largas).
2. `guion.md` por capítulos (ver abajo) y `datos.md` (cada cifra con fuente primaria; lo no verificable no entra).
3. `vid.py estimar <tema>`: tiempos y RAM. **Medido (4 CPU)**: voz ≈ 4,4 s de cálculo por segundo de voz con lotes de 8 (34 min de voz ≈ 1 h 50 min), alineado ≈ 6 min, música ≈ 1,5 min (pico de RAM alto: **nunca a la vez que voz o render**), render ≈ 1 min por minuto de vídeo en calidad baja (`ss 0.5`).
4. `vid.py voz <tema>` — reanudable: cada frase se guarda en `salida/voz_cache`; si se corta, se relanza igual. La salida del comando no se ve hasta el final: seguir el progreso contando ficheros nuevos en `voz_cache`.
5. Escribir `escenas.js` con `capitulos` (un entorno persistente por capítulo + piezas por párrafo con `ctx.palabra`), `musica`, `mezcla`, `qa` con stills, `render`.
6. Entrega: `*_pesado.mp4` y `*_ligero.mp4` (el ligero lleva 64 kbps de audio y limitador; con 40 kbps el AAC distorsionaba).

## Estructura (retención en vídeos largos)
- **Apertura (0–60 s):** promesa clara y qué se va a recorrer; un primer gancho visual fuerte.
- **Capítulos de 3–5 min** (`meta.capitulos` = nº de párrafos de cada uno, y `VE.proyecto({capitulos:[...]})`): cada uno con su entorno visual y su pequeño arco (pregunta → explicación → imagen final). La música solo marca los cambios de capítulo.
- Variar el ritmo: preguntas al espectador, datos con fuente, pausas largas de respiración. Resumen y despedida al final.
- Texto pensado para el oído: frases cortas, comas donde se respira. Evitar siglas y palabras raras sin explicar (Qwen puede pronunciarlas mal: oírlo antes de publicar).

## Diseño visual
- **Realista:** `VE.real.paisaje` + `VE.real.objeto` (hora del día acorde). **Meditación:** estilo luz (`VE.trazo`, `VE.med`, `VE.paisaje`), contornos sin relleno sobre fondos oníricos.
- Cada párrafo hace aparecer su elemento al decir su palabra clave; el paisaje del capítulo persiste.
- Calidad baja para pruebas/entrega ligera: `ss 0.5` y `salida_escala 0.5` (960×540). Calidad alta: `ss 1.0`, `salida_escala 1.0` (1920×1080), el render tarda ~3-4× más.

## Viabilidad
En **Code (4 CPU)**: sí, en horas. En un **chat de Project (≈2 CPU, procesos que se cortan)**: no; allí se prepara guion + escenas + brief y se produce en Code.
Ejemplo completo: `proyectos/meditacion_viaje/` (9 actos de ~4 min).
