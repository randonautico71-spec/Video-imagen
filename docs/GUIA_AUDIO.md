# Cómo se programa el audio: voz, música y mezcla (resumen con mediciones)

**Aviso:** el motor no puede *oír*. Todo lo de abajo se ha medido (niveles, duraciones, tono, espectro, alineado); la calidad percibida de voces y música solo la juzga el usuario.

## 1. Pipeline
`guion.md` → `vid.py voz` (locución + tiempos de palabra) → `musica` → `mezcla` (voz + música + ducking + loudnorm) → `render` (AAC pesado y ligero).
La voz manda: de ella salen `frases.json`, `palabras.json` y `timeline.json` (inicio y fin de cada escena); la música se compone **después**, a la duración exacta. Si cambia el guion, hay que repetir voz → música → mezcla → render.

## 2. Voces (todas locales salvo Carmen)
| Voz | Motor | Para | Medido |
|---|---|---|---|
| **Serena** `serena_largo` / `serena_meditacion` | Qwen3-TTS 0.6B CustomVoice (`.venv-qwen`) | largos | ≈138 palabras/min; **4,4 s de cálculo por s de voz** con lotes de 8 (5,4 sin lotes); 34 min de voz ≈ 1 h 50 min con 4 CPU |
| **Aiden** `aiden` / `aiden_meditacion` | Qwen, voz masculina | largos | tono medio ≈115–170 Hz según la generación; velocidad asumida igual que Serena |
| **Carmen** `carmen` | ElevenLabs `eleven_v4`, id `iHGx33VgO2KQ1Fdw6noG` (peninsular) | shorts | 171 palabras/min (1 frase real); ≈1 crédito por carácter (95 créditos = 1,7 céntimos) |
| MeloTTS ES `meditacion` | local | meditación antigua | 132 palabras/min |
| Piper `curiosos`/`aprender` | local | **sin ajustar** (pendiente del usuario) | 190 palabras/min asumido |
- Los perfiles viven en `config/perfiles_voz.json` y **no se tocan sin que el usuario lo pida**.

## 3. Cómo se sintetiza
- **Frase a frase** con caché en disco (`salida/voz_cache`): la clave incluye motor, modelo, hablante, parámetros y texto. Si se corta, se reanuda; cambiar una frase solo recalcula esa.
- **Qwen:** frases pendientes ordenadas por longitud y en lotes de 8 (≈30 % menos tiempo). Comprobación de cada frase: duración entre 0,55× y 1,9× de 0,42 s/palabra; si no, se repite (3 intentos). bf16 en CPU; fp32 no fue más rápido.
- **Qwen muestrea:** el mismo texto dio tonos medios de 118 y 170 Hz. Bajar la temperatura (0,5/0,3) no estabilizó y `instruct` en español no bajó el tono. En vídeos largos algunas frases pueden sonar distintas: **hay que oírlas**.
- **ElevenLabs** se genera *fuera* del motor con `creative_generate_speech` (siempre `estimate_only` primero y **`generations_count = 1`**; por defecto serían 2 y se cobran ambas) y se importa con `vid.py voz-importar <tema> <audio|URL>`. La URL del audio caduca en ≈2 h y está en `storage.googleapis.com` (dominio a permitir en la red).
- **Tiempos por palabra:** faster-whisper `small` sobre el audio ya decodificado (16 kHz; pasar la ruta falla con la PyAV instalada), casado con el guion y acotado por los límites de frase. Cobertura medida: 94–100 %. Con ElevenLabs no se conocen los límites de frase: se transcribe todo el audio y se casan (100 % en la prueba).
- MeloTTS necesita `HF_HUB_DISABLE_XET=1`, torch CPU y datos NLTK instalados a mano; Qwen y Piper bajan sus pesos de Hugging Face (`us.aws.cdn.hf.co` además de `huggingface.co`).

## 4. Escribir para el oído
- Frases cortas; comas donde se respira; números y fechas en palabras («mil novecientos ochenta y nueve»); evitar siglas y nombres raros (Qwen puede pronunciarlos mal: *anahata*, *Hitachi*, *prides*).
- Las etiquetas entre corchetes **no se pronuncian** (se quitan del guion de alineado).
- **El ritmo lo ponen las pausas, no la velocidad.** MeloTTS a 0,82 sonaba artificial; la «versión B» (0,92, sin cambio de tono ni compresión, frases partidas por comas con 0,28 s de respiración) fue la elegida. Pausas por perfil: meditación 0,65 s entre frases y 1,5 s entre párrafos; largo 0,5/1,1; short 0,3/0,55; Carmen 0 (las trae el audio).
- Para meditación: tono místico y de ilusión con frases-metáfora añadidas **sin datos nuevos**; las cifras y estudios van con fuente primaria en `datos.md`.

## 5. Música (`pipeline/musica.py`)
- **Síntesis propia con numpy/scipy**, sin ficheros ni copyright, **determinista** (misma semilla → mismo audio), estéreo 44,1 kHz. Tres estilos, uno por perfil:
  - `meditacion`: pads lentos, cuencos tibetanos, destellos agudos, oleaje, mucha reverb, sin pulso.
  - `curiosos`: marimba pentatónica menor, bajo grave, tic-tac sutil, risers y booms en los cortes.
  - `aprender`: xilófono pentatónico mayor, bajo saltarín, campanitas, fanfarria en los aciertos.
- **No se cambia la música sin que el usuario lo pida** (una vez se tocó y hubo que restaurarla).
- Entradas (`cues.json`): inicio de cada escena (los cortes), *dings* en palabras concretas (`dings_en_palabras` en `meta.json`) y duración. En vídeos largos `meta.capitulos` hace que la música solo marque los cambios de **capítulo**.
- **Recursos:** 45 min de meditación = 221 s de cálculo y **pico de 8 GB de RAM** (medido una vez): nunca a la vez que la voz o el render.

## 6. Mezcla y masterización (`vid.py mezcla`)
`voz (mono→estéreo) + música×0,55` con **ducking** (`sidechaincompress` umbral 0,03, ratio 8, ataque 20 ms, relajación 400 ms: la música baja cuando habla la voz) → `loudnorm` → recorte a la duración del vídeo.
- Objetivos (`meta.lufs`): **shorts −14 LUFS**, largos −16, meditación −19; pico real −1,5 dBTP. `cola_s` deja sonar la música tras la última palabra (meditación 3,5 s, short 2 s).
- **Medidos en entregas reales:** meditación −16,0 LUFS / pico −1,3 dBTP (pesado); short −16,0 / −3,0.

## 7. Codificación de entrega
- **Pesado:** AAC 192 kbps. **Ligero:** AAC **64 kbps** mono con `volume=-4dB` + `alimiter limit=0,6`. A 40 kbps el audio sonaba a códec y el pico real se disparaba (+5,2 dBFS); con −3 dB/0,7 quedó en −0,9 dBFS; con −4 dB/0,6 en −1,8 dBFS. Regla: dejar ≥ 1,5 dB de margen antes de codificar a poca tasa.

## 8. Control de calidad (sin oír)
- `ffmpeg … ebur128=peak=true` (integrado y pico real), `astats` (factor plano = recortes), duración de cada frase frente a las palabras, cobertura del alineado, y para identidad de voz: tono (autocorrelación) y similitud espectral (Aiden vs su muestra: 0,96; Serena como control: 0,74).
- Siempre entregar con aviso: «no he oído el audio; solo he medido niveles y recortes».

## 9. Límites honestos
Piper sin ajustar · velocidad de Aiden y de Carmen sin medir en un vídeo entero · variación de tono de Qwen sin solución · música medida en RAM solo para meditación · un short entero con Carmen aún no probado de punta a punta.
