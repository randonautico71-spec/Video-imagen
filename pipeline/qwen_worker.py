#!/usr/bin/env python3
"""Proceso auxiliar de voz Qwen3-TTS (se ejecuta con .venv-qwen, Python 3.11, porque qwen-tts fija transformers==4.57.3
y eso choca con las versiones que usa MeloTTS). Carga el modelo UNA vez y atiende peticiones por stdin.
Protocolo: una linea JSON por peticion {"texto","salida","speaker","idioma","instruct"} -> una linea JSON {"ok":true,"sr":N} o {"ok":false,"error":...}.
El audio se guarda como .npy float32 mono; el sr es el que devuelve el modelo."""
import json, os, sys
os.environ.setdefault('HF_HUB_DISABLE_XET', '1')
import numpy as np, torch
from qwen_tts import Qwen3TTSModel

modelo = sys.argv[1] if len(sys.argv) > 1 else 'Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice'
torch.set_num_threads(int(os.environ.get('QWEN_HILOS', '4')))
dt = {'bf16': torch.bfloat16, 'fp32': torch.float32}[os.environ.get('QWEN_DTYPE', 'bf16')]
m = Qwen3TTSModel.from_pretrained(modelo, device_map='cpu', dtype=dt, attn_implementation='sdpa')
print(json.dumps({'listo': True}), flush=True)
for linea in sys.stdin:
    try:
        p = json.loads(linea)
        if 'lote' in p:                                           # varias frases a la vez: ~30% menos tiempo de calculo por segundo de voz
            n = len(p['lote']); kw = dict(text=[q['texto'] for q in p['lote']], language=[p.get('idioma', 'Spanish')] * n, speaker=[p.get('speaker', 'Serena')] * n)
            if p.get('instruct'): kw['instruct'] = [p['instruct']] * n
            wavs, sr = m.generate_custom_voice(**kw)
            for q, w in zip(p['lote'], wavs): np.save(q['salida'], np.asarray(w, dtype=np.float32))
            print(json.dumps({'ok': True, 'sr': int(sr)}), flush=True); continue
        kw = dict(text=p['texto'], language=p.get('idioma', 'Spanish'), speaker=p.get('speaker', 'Serena'))
        if p.get('instruct'): kw['instruct'] = p['instruct']
        wavs, sr = m.generate_custom_voice(**kw)
        np.save(p['salida'], np.asarray(wavs[0], dtype=np.float32))
        print(json.dumps({'ok': True, 'sr': int(sr)}), flush=True)
    except Exception as e:
        print(json.dumps({'ok': False, 'error': repr(e)[:400]}), flush=True)
