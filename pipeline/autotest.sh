#!/usr/bin/env bash
# PRUEBAS AUTOMATICAS del repositorio (rapidas, sin render de video ni voz). Uso: bash pipeline/autotest.sh
cd "$(dirname "$0")/.." || exit 2; fallos=0
ok(){ printf "  [ok]    %s\n" "$1"; }; mal(){ printf "  [FALLO] %s\n" "$1"; fallos=$((fallos+1)); }

echo "== Sintaxis"
python3 -m py_compile pipeline/*.py 2>/dev/null && ok "python (pipeline/*.py)" || mal "python"
bad=0; for f in render/*.cjs $(find engine -name '*.js') ; do node --check "$f" 2>/dev/null || { mal "js: $f"; bad=1; }; done; [ $bad = 0 ] && ok "javascript (render/ y engine/)"
bash -n pipeline/instalar.sh && bash -n chat/bootstrap.sh && ok "shell (instalar.sh, bootstrap.sh)" || mal "shell"

echo "== Configuracion"
python3 - <<'PY' && ok "tipos.json / perfiles_voz.json / calibracion.json coherentes" || mal "configuracion"
import json,sys
t=json.load(open('config/tipos.json')); p=json.load(open('config/perfiles_voz.json')); c=json.load(open('config/calibracion.json')); f=json.load(open('config/formatos.json'))
for n in ('largo','short'):
    x=t[n]; assert x['voz'] in p, (n,'voz sin perfil'); assert x['formato'] in f, (n,'formato'); assert x['musica'] in ('curiosos','aprender','meditacion')
    assert x['voz'] in c['voz']['palabras_por_min_habla'], (n,'sin wpm en calibracion'); m=p[x['voz']]['motor']
    assert m in c['voz']['carga_modelo_s'] and m in c['voz']['calculo_s_por_s_de_habla'], (n,'motor sin calibrar')
    assert x['duracion_s'][0]<x['duracion_s'][1] and x['guia'] and __import__('os').path.exists(x['guia']), (n,'guia')
assert t['short']['voz']=='carmen' and p['carmen']['voice_id'] and t['largo']['voz'].startswith('serena')
PY
python3 pipeline/entrega.py >/dev/null && ok "entrega.py (plan de versiones)" || mal "entrega.py"

echo "== Proyecto de prueba (crear, estimar, avisos de rango)"
python3 pipeline/vid.py nuevo _autotest --tipo short >/dev/null 2>&1 && printf "Hola.\n\nAdios.\n" > proyectos/_autotest/guion.md && \
  python3 pipeline/vid.py estimar _autotest 2>&1 | grep -q "fuera del rango" && ok "nuevo --tipo short + aviso de duracion fuera de rango" || mal "nuevo/estimar"
rm -rf proyectos/_autotest

echo "== Navegador y motor visual (sin errores en pagina)"
if node -e "const n=require('./render/navegador.cjs');process.exit(n.EXE&&n.PW?0:1)" 2>/dev/null; then
  ok "Playwright + Chromium localizados"
  mkdir -p /tmp/autotest_img && for m in "paisaje" "objetos" "rayo"; do
    node -e "
const n=require('./render/navegador.cjs'),fs=require('fs');(async()=>{const {chromium}=require(n.PW);const b=await chromium.launch({executablePath:n.EXE,args:n.FLAGS});const pg=await b.newPage({viewport:{width:960,height:540}});const er=[];pg.on('pageerror',e=>er.push(String(e)));pg.on('console',m=>{if(m.type()==='error')er.push(m.text())});
await pg.goto('file://'+process.cwd()+'/demo/realismo.html?modo=$m&ss=0.5');await pg.evaluate(()=>window.renderAt(0));const d=await pg.evaluate(()=>document.getElementById('c').toDataURL('image/jpeg',0.8).length);await b.close();if(er.length||d<5000){console.error(er.join('|')||'imagen vacia');process.exit(1)}})()" 2>/dev/null && ok "demo/realismo.html?modo=$m" || mal "demo realismo $m"
  done
else mal "no hay Playwright/Chromium (ver chat/bootstrap.sh)"; fi
echo; [ $fallos = 0 ] && echo "TODO BIEN" || { echo "$fallos FALLO(S)"; exit 1; }
