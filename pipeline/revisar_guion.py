"""Revisa un guion contra la formula de retencion de docs/GUION_RETENCION.md (heuristicas, no sustituye a leerlo).
Uso: python3 pipeline/revisar_guion.py proyectos/<tema>/guion.md [--wpm 180] [--rango 60,90]
Si hay un datos.md al lado, comprueba que lo de nivel S (suposicion, mito, creencia) se aclara en la narracion.
Sale con codigo 1 si hay fallos graves (gancho, frases demasiado largas, sin cierre). Los avisos no bloquean."""
import re, sys, json, os, argparse

TU = r"\b(tú|tu|tus|te|ti|contigo|tuyo|tuya|tuyos|tuyas)\b"
SALUDO = r"\b(hola|hoy vamos|en este v[ií]deo|bienvenid|os voy a|te voy a contar)\b"
GIRO = r"\b(pero|en realidad|y no te libras|int[ée]ntalo|resulta|lo has o[ií]do|aunque|sin embargo)\b"
REENG = r"(\bpero\b|y lo peor|resulta que|hace algo m[aá]s|\?|¡|ahora\b|y adem[aá]s|lo m[aá]s raro|de hecho|o sea|as[ií] que|no era|^t[uú],|y ah[ií]|en realidad|y no )"
ACLARA = r"(se dice|dicen que|se cree|es un mito|mito|nadie (lo )?ha (medido|demostrado|visto)|no se sabe|probablemente|quiz[aá]s?|seg[uú]n la leyenda|se supone|lo has o[ií]do|suponiendo|supongamos|ser[ií]a[n]? (unos|unas|aproximadamente|m[aá]s o menos)|aproximadamente|estimaci[oó]n|calcul|qu[eé] pasar[ií]a si)"
CTA = r"(env[ií]a(selo|lo)|comp[aá]rte|comenta|s[ií]gueme|sigue a)"


def frases(t):
    return [f.strip() for f in re.split(r'(?<=[.?!…])\s+', t) if f.strip()]


def palabras(t):
    return re.findall(r"[\wáéíóúüñÁÉÍÓÚÜÑ0-9.,%-]+", t)


def revisar(texto, wpm=180, rango=(60, 90), datos=None):
    pars = [p.strip() for p in re.split(r'\n\s*\n', texto) if p.strip() and not p.strip().startswith('#')]
    todo = ' '.join(pars); F = frases(todo); P = palabras(todo); n = len(P)
    seg = n / wpm * 60; fallos, avisos, ok = [], [], []
    f0 = F[0] if F else ''
    # gancho
    if len(palabras(f0)) > 20: fallos.append(f'Gancho largo: la primera frase tiene {len(palabras(f0))} palabras (max 20; mejor <= 16).')
    elif len(palabras(f0)) > 16: avisos.append(f'Gancho algo largo: {len(palabras(f0))} palabras (mejor <= 16).')
    else: ok.append(f'Gancho corto ({len(palabras(f0))} palabras).')
    if re.search(SALUDO, f0, re.I): fallos.append('El gancho saluda o anuncia el video: empezar directamente por la afirmacion.')
    if not re.search(TU, ' '.join(F[:2]), re.I): avisos.append('El gancho no habla de "tu" (tu cuerpo, tu casa, tu vida).')
    # giro antes de 8 s
    acum, giro_t = 0, None
    for f in F:
        if re.search(GIRO, f, re.I) and giro_t is None: giro_t = acum / wpm * 60
        acum += len(palabras(f))
    if giro_t is None or giro_t > 8: avisos.append('No hay giro antes de los 8 s ("pero...", "en realidad...", "intentalo ahora").')
    else: ok.append(f'Giro a los {giro_t:.0f} s.')
    # frases
    L = [len(palabras(f)) for f in F]
    if L:
        media = sum(L) / len(L)
        largas = [f for f in F if len(palabras(f)) > 24]
        (fallos if largas else ok).append(f'{len(largas)} frase(s) de mas de 24 palabras: ' + ' | '.join(x[:60] + '…' for x in largas[:3]) if largas else f'Ninguna frase > 24 palabras.')
        (avisos if media > 14 else ok).append(f'Frase media {media:.1f} palabras (objetivo <= 14).')
    # segunda persona
    tu = len(re.findall(TU, todo, re.I)); pct = tu / max(1, n) * 100
    (avisos if pct < 4 else ok).append(f'2.a persona: {pct:.1f} % de las palabras (objetivo >= 4 %).')
    # reenganches cada ~15 s
    acum, ultimo, huecos = 0, 0, []
    for f in F:
        t = acum / wpm * 60
        if re.search(REENG, f, re.I):
            if t - ultimo > 22: huecos.append((ultimo, t))
            ultimo = t
        acum += len(palabras(f))
    if seg - ultimo > 25: huecos.append((ultimo, seg))
    (avisos if huecos else ok).append('Tramos de mas de 22 s sin reenganche: ' + ', '.join(f'{a:.0f}-{b:.0f} s' for a, b in huecos) if huecos else 'Reenganches al menos cada ~20 s.')
    # cierre que vuelve al gancho
    cola = ' '.join(F[-4:]).lower(); clave0 = {w.lower().strip('.,¿?¡!') for w in palabras(f0) if len(w) > 4}
    vuelve = len(F) > 5 and (re.search(r'\bas[ií] que\b', cola) or len(clave0 & {w.lower().strip('.,¿?¡!') for w in palabras(cola)}) >= 2)
    (ok if vuelve else avisos).append('El cierre vuelve al gancho.' if vuelve else 'El cierre no vuelve al gancho (usar "Asi que..." y repetir palabras de la primera frase).')
    if not re.search(CTA, cola, re.I): fallos.append('Falta llamada a la accion al final ("Envíaselo a alguien que...", "Comenta...").')
    else: ok.append('Llamada a la accion al final.')
    # duracion del tipo (SHORT 60-90 s)
    if rango and not (rango[0] <= seg <= rango[1]): avisos.append(f'Duracion estimada {seg:.0f} s fuera de {rango[0]}-{rango[1]} s ({rango[0] * wpm / 60:.0f}-{rango[1] * wpm / 60:.0f} palabras a {wpm:.0f} pal/min).')
    elif rango: ok.append(f'Duracion estimada {seg:.0f} s (rango {rango[0]}-{rango[1]} s).')
    # regla NO ALUCINES aclarada: lo de nivel S (suposicion, mito, creencia) solo entra si la narracion lo dice
    if datos is not None:
        S = [l for l in datos.splitlines() if re.search(r'\|\s*[SE]\s*\|', l) or re.match(r'\s*[-*]?\s*\[?[SE]\]?\s*[:|-]', l)]
        if S and not re.search(ACLARA, todo, re.I): fallos.append(f'datos.md tiene {len(S)} afirmacion(es) de nivel S/E (suposicion, creencia o estimacion) y la narracion no lo aclara en ningun momento ("se dice que", "es un mito", "suponiendo que", "seria aproximadamente"...).')
        elif S: ok.append(f'{len(S)} afirmacion(es) de nivel S y la narracion avisa de que son suposicion o creencia (revisar a mano que cada una lo diga).')
    return {'palabras': n, 'segundos_estimados': round(seg), 'frases': len(F), 'ok': ok, 'avisos': avisos, 'fallos': fallos}


if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('guion'); a.add_argument('--wpm', type=float, default=180); a.add_argument('--json', action='store_true'); a.add_argument('--rango', default='60,90', help='duracion objetivo en s (SHORT: 60,90)')
    o = a.parse_args(); dp = os.path.join(os.path.dirname(os.path.abspath(o.guion)), 'datos.md')
    r = revisar(open(o.guion, encoding='utf-8').read(), o.wpm, tuple(float(v) for v in o.rango.split(',')) if o.rango else None, open(dp, encoding='utf-8').read() if os.path.exists(dp) else None)
    if o.json: print(json.dumps(r, ensure_ascii=False, indent=1))
    else:
        print(f"{r['palabras']} palabras · {r['frases']} frases · ~{r['segundos_estimados']} s a {o.wpm:.0f} pal/min")
        for k, s in (('ok', '  [ok]    '), ('avisos', '  [aviso] '), ('fallos', '  [FALLO] ')):
            for m in r[k]: print(s + m)
    sys.exit(1 if r['fallos'] else 0)
