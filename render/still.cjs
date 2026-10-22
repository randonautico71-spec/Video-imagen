/* Guarda fotogramas sueltos para revisar una escena sin renderizar el video entero.
   Uso: node render/still.cjs <pagina.html> <segundos,coma,separados> <carpeta> [formato] [estilo] [ss] */
const fs = require('fs'), path = require('path');
const { abrir, capturar } = require('./navegador.cjs');

(async () => {
  const [pagina, tiempos, carpeta, formato = 'yt', estilo = 'DARK', ss = '1.5'] = process.argv.slice(2);
  if (!pagina || !tiempos || !carpeta) {
    console.error('Uso: node render/still.cjs <pagina.html> <t1,t2,t3> <carpeta> [formato] [estilo] [ss]');
    process.exit(1);
  }
  fs.mkdirSync(carpeta, { recursive: true });
  const { navegador, page } = await abrir({ formato, estilo, ss: parseFloat(ss), pagina: path.resolve(pagina) });
  for (const s of tiempos.split(',')) {
    const t = parseFloat(s);
    const buf = await capturar(page, t, 0.95);
    const f = path.join(carpeta, `t${String(t).replace('.', '_')}.jpg`);
    fs.writeFileSync(f, buf);
    console.log(`${f}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
  await navegador.close();
})().catch(e => { console.error('FALLO:', e.message); process.exit(1); });
