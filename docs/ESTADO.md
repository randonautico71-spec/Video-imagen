# Estado: qué está probado y qué no (actualizar al verificar)

## Probado de punta a punta (con vídeo real)
- **Largo:** `meditacion_viaje` — 9 actos, ~34 min. Voz MeloTTS (versión B) y voz Serena (Qwen) con lotes; música; mezcla; render a 960×540; ligero con 64 kbps y limitador.
- **Short:** `orientacion` — 1:44, vertical, voz Serena (Qwen), subtítulos, letrero final, pesado + ligero (9,3 MB).
- Voz Serena en el motor (Qwen3-TTS 0.6B CustomVoice, `.venv-qwen`, lotes de 8 frases, comprobación de duración).

## Voz Carmen (ElevenLabs) — probado con UNA frase real
Una frase de 95 caracteres (6,32 s, 95 créditos ≈ 1,7 céntimos de dólar, `eleven_v4`, 1 versión): generada con `creative_generate_speech`, leída con `creative_get_flow_run_status`, descargada de `storage.googleapis.com` (dominio a permitir en la red) e importada con `vid.py voz-importar`: **100 % de palabras casadas**, frases y párrafos bien delimitados, timeline correcto, 171 palabras/min. **No probado**: un short entero con Carmen (música, mezcla y render con su audio).

## Calidad de vídeo (medida)
- Color: el pipeline anterior desviaba el color (BT.601→reproductor BT.709: rojo 191,0,0 → 207,17,0; error medio de verde 13 niveles). Ahora convierte a BT.709 y etiqueta: error ~1 nivel, PSNR 31 → 41 dB en la carta de pruebas. Aplicado en `render/render.cjs` (los vídeos ya entregados NO lo llevan).
- `aq-mode=3` y preset `medium`: sin pérdida de velocidad medida (1,9 fotogramas/s por proceso en el short).
- Audio del ligero: 64 kbps + limitador (volumen −4 dB, límite 0,6) → pico real ≈ −2 dBFS.

## Implementado pero NO probado de punta a punta
- Entrega doble (YouTube 3–5 min → + Instagram) · render de Instagram.
- `chat/bootstrap.sh` en el contenedor real de un chat de Project (solo probado en el contenedor de Code).
- `pipeline/instalar.sh` desde cero.

## Sin verificar (externo)
- Límites de duración de Instagram/Reels/TikTok (YouTube Shorts: 3 min, fuente oficial).
- Safe areas verticales (estimación).
- Calidad percibida de las voces y de la música: solo la juzga el usuario.
- Coordenadas RA/Dec de las estrellas del short «orientación» (escritas de memoria).
