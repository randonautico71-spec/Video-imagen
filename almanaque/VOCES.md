# Voces — medidas reales
- **Melo (`melo_es`)**: deja ~0,9 s de silencio al FINAL de cada frase (~0,09 s al inicio). Sin `recortar_silencio`, pausa real = perfil + 0,9 s (en `melo_es_dormir` eran ~1,9 s medidos, no 1,0). Articula ~183-189 palabras/min; tono medio ~193 Hz; desviacion de tono 2,5-2,75 st; centroide ~1900-2000 Hz.
- **Carmen (referencia ElevenLabs, solo metricas)**: 130,9 palabras/min totales, ~170 articulando, pausa fin de frase 0,66 s, coma 0,44 s, tono medio 225 Hz, desviacion 4,38 st, centroide 2207 Hz.
- **`melo_carmen_dormir`**: Melo + `recortar_silencio` + tempo 0,92 + pausas 0,66/0,44/1,4 s + `pausa_jitter` 0,18 + curva melodica suave. Medido: 131,7 palabras/min totales, pausa de frase 0,74 s, coma 0,32 s. No clona el timbre. No oido por el usuario.
- La medida de «articulacion» de `analizar_voz.py` oscila ±8 %: usar palabras totales / tiempo para ajustar ritmo.
- Cache de voz por frase/trozo (clave: motor, modelo, hablante, sintesis, texto): el tempo, las pausas y la entonacion se aplican DESPUES, asi que cambiarlos no obliga a re-sintetizar.
- Qwen (Serena, Aiden, Vivian, Carmelot) esta borrado de este contenedor; reinstalar con `pipeline/instalar.sh`.
- Duracion: ~131 palabras/min totales con el perfil Carmen → 3200 palabras ≈ 24 min.
- **`melo_u5`** (MeloTTS + prosodia WORLD, del Project): synthesis speed 1.2, noise_scale 0.45, noise_scale_w 0.6; pausas 0.2/0.45/0.75 s; prosodia `k_lento` 2.6, `k_rapido` 1.4 (amplia la melodia). Necesita `.venv-prosodia` (`python3 -m venv .venv-prosodia && .venv-prosodia/bin/pip install numpy scipy librosa pyworld "setuptools<81"`; pyworld pide `pkg_resources`). OJO: el parche original solo aplicaba la prosodia sobre trozos YA en cache (segunda pasada); `voz.py` ahora sintetiza antes los trozos que falten con motores sin lotes (Melo, Piper), asi sirve en una sola pasada. Prueba medida: 16,95 s (esperado ≈16,9), pico −1,5 dBFS, factor plano 0.

## Musica para dormir (estilos `mistico` y `natural`, en `pipeline/musica.py`)
- `mistico`: re dorico/eolico; coro lento ('aah' por formantes), bordon re-la-re, campanas de cristal con un motivo de 8 notas, cuencos graves, aire; reverb 5,5 s; todo con paso bajo a 5,2 kHz. Cuenco de cambio de capitulo con ataque de 3 s.
- `natural`: sol mayor / mi menor; cuerdas calidas, arpa espaciada (arpegio lento), flauta suave con soplo, viento, arroyo lejano y grillos lejanos muy bajos; reverb 2,8 s; paso bajo a 6,5 kHz.
- Ninguno lleva dings, risers ni booms. Medido (150-180 s): pico 0,47, sin picos > -6 dBFS, energia > 4 kHz ~ 0 %, salto maximo de volumen en 0,5 s: 4,5 dB (mistico) y 3,1 dB (natural), frente a 4,3 dB de `meditacion`.
- Mezcla (`meta.volumen_musica` y `meta.ducking {umbral, ratio, ataque, relajacion}`): con 0,55 y ratio 8 la musica quedaba ~13-18 dB por debajo de la voz (casi ausente). Con volumen 1,15 y ducking suave (ratio 2,5) queda ~8 dB por debajo, medido sobre una voz de prueba.
