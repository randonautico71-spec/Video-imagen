# TIPO SHORT — guía de diseño (se lee al hacer `vid.py nuevo <tema> --tipo short`)

**Ficha** (de `config/tipos.json`): vertical 1080×1920 · 30 fps · 60–180 s · voz **Carmen** (ElevenLabs, peninsular) · música `curiosos` · −14 LUFS · subtítulos con palabra resaltada · letrero final «SIGUE A @randonautico».
El límite de 3 min de YouTube Shorts está verificado en la ayuda oficial de YouTube; los de Instagram/TikTok **no** (comprobar en la app).

## Flujo de producción
1. `python3 pipeline/vid.py nuevo <tema> --tipo short`
2. Escribir `proyectos/<tema>/guion.md` (1 párrafo = 1 escena; frases cortas) y `datos.md` (cada cifra con su fuente primaria; sin fuente = no entra).
3. `python3 pipeline/vid.py estimar <tema>` → comprueba que la duración cae entre 1:00 y 3:00 (el motor avisa si no).
4. **Voz de Carmen** (ElevenLabs, gasta créditos; se hace con la herramienta del conector, no con el motor):
   - `salida/locucion.txt` ya contiene el texto limpio (se crea al lanzar `vid.py voz` la primera vez, o se genera con `parrafos_de`).
   - `creative_generate_speech` con `voice_id = iHGx33VgO2KQ1Fdw6noG` (Carmen - Bold and Magnetic), `model_id = eleven_v4`, **`generations_count = 1`** (por defecto serían 2 y se cobran las dos) y primero `estimate_only = true`.
   - Esperar con `creative_get_flow_run_status`, descargar el audio y guardarlo como `proyectos/<tema>/salida/locucion_eleven.mp3`.
   - `python3 pipeline/vid.py voz <tema>` (o `voz-importar <tema> <audio>`): transcribe con faster-whisper local, casa con el guion y saca los tiempos de frase y de palabra. No hace falta Scribe.
5. Escribir `escenas.js` (ver «Diseño visual»). `python3 pipeline/vid.py musica <tema>` y `mezcla <tema>`.
6. `python3 pipeline/vid.py qa <tema> --stills t1,t2,...` (uno por escena, en el momento en que aparece cada gráfico) y **mirar las imágenes**: el linter no ve todo.
7. `python3 pipeline/vid.py render <tema>` → pesado (1080×1920) + ligero (<10 MB). Si se corta, repetir el mismo comando: continúa por trozos.

## Estructura del guion (retención)
- **0–3 s: gancho.** Una pregunta o promesa concreta + decir qué va a pasar («Cuatro trucos para…»). Sin saludos ni presentaciones.
- **Bloques de 8–15 s**, uno por idea (truco, dato, paso). Cada bloque = una escena con su propio gráfico.
- Mezclar **datos curiosos** y una **pregunta abierta** a mitad. Cerrar con una pregunta para comentarios y «guarda este vídeo».
- Lenguaje viral: frases cortas, segunda persona, números («cuatro trucos»), «ojo», «dato loco». **Nada de cifras o afirmaciones sin fuente.**
- Últimos 3–4 s: **letrero** `VE.short.letrero(esc, t, tInicio)` (la palabra «sigue» marca cuándo entra).

## Diseño visual (herramientas del motor)
- **Fondo**: un paisaje real por escena con `VE.real.paisaje(...)` (hora del día acorde al tema) y objetos con `VE.real.objeto(...)`.
- **Encima**: rótulo grande arriba (`VE.short.rotulo`), gráfico explicativo en el centro, pastillas (`VE.short.pastilla`) para etiquetar, flechas. Todo aparece **al decir su palabra** (`VE.short.en(ctx, 'palabra', respaldo)`).
- **Subtítulos**: los pone el motor en la banda inferior de la zona segura; el contenido no debe invadirla (`ctx.zonas.cuerpo`).
- Zonas seguras verticales (estimación, no especificación): arriba 10 %, abajo 21 %, derecha 14 %.
- Un cambio visual como máximo cada ~5–8 s; movimiento constante (nubes, parpadeo, rebotes) para que nada esté quieto.
- Sin fuentes a pie de imagen, sin chips HOOK/PUPA/QUIZ, sin estilos Pollín ni pizarra.

## Recursos del contenedor (medido)
Cada proceso de render pica en **≈2,0 GB de RAM** (vertical, ss 1.5). El motor elige solo los procesos: 1 por CPU (máx. 4) y 1 por cada 2,5 GB de RAM libre (`workers_auto`). Un chat de 2 CPU / 7 GB usa **2 procesos** (~4 GB); forzar 4 agotaría la memoria. Estimación para un corto de ~105 s: unos 17–26 min con 2 procesos (no medido en 2 CPU).

## Tiempos medidos (4 CPU)
Render ~6 fotogramas/s (ss 1.5): un corto de 105 s ≈ 9–10 min. La primera escena de cada paisaje tarda unos segundos extra (se hornea). Ejemplo completo: `proyectos/orientacion/`.
