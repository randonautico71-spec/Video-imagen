# Voces — medidas reales
- **Melo (`melo_es`)**: deja ~0,9 s de silencio al FINAL de cada frase (~0,09 s al inicio). Sin `recortar_silencio`, pausa real = perfil + 0,9 s (en `melo_es_dormir` eran ~1,9 s medidos, no 1,0). Articula ~183-189 palabras/min; tono medio ~193 Hz; desviacion de tono 2,5-2,75 st; centroide ~1900-2000 Hz.
- **Carmen (referencia ElevenLabs, solo metricas)**: 130,9 palabras/min totales, ~170 articulando, pausa fin de frase 0,66 s, coma 0,44 s, tono medio 225 Hz, desviacion 4,38 st, centroide 2207 Hz.
- **`melo_carmen_dormir`**: Melo + `recortar_silencio` + tempo 0,92 + pausas 0,66/0,44/1,4 s + `pausa_jitter` 0,18 + curva melodica suave. Medido: 131,7 palabras/min totales, pausa de frase 0,74 s, coma 0,32 s. No clona el timbre. No oido por el usuario.
- La medida de «articulacion» de `analizar_voz.py` oscila ±8 %: usar palabras totales / tiempo para ajustar ritmo.
- Cache de voz por frase/trozo (clave: motor, modelo, hablante, sintesis, texto): el tempo, las pausas y la entonacion se aplican DESPUES, asi que cambiarlos no obliga a re-sintetizar.
- Qwen (Serena, Aiden, Vivian, Carmelot) esta borrado de este contenedor; reinstalar con `pipeline/instalar.sh`.
- Duracion: ~131 palabras/min totales con el perfil Carmen → 3200 palabras ≈ 24 min.
