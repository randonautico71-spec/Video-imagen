/* Pasa el linter por una rejilla de instantes y falla si hay errores.
   Uso: node render/qa.cjs <pagina.html> <duracion> [paso] [formato] [estilo] [ss] */
const path = require('path');
const { abrir } = require('./navegador.cjs');

(async () => {
  const [pagina, dur, paso = '0.5', formato = 'yt', estilo = 'DARK', ss = '1.5'] = process.argv.slice(2);
  if (!pagina || !dur) { console.error('Uso: node render/qa.cjs <pagina.html> <duracion> [paso] [formato] [estilo] [ss]'); process.exit(1); }
  const { navegador, page } = await abrir({ formato, estilo, ss: parseFloat(ss), pagina: path.resolve(pagina) });
  const D = parseFloat(dur), P = parseFloat(paso);
  const informes = [];
  for (let t = 0; t <= D + 1e-9; t += P) {
    informes.push(await page.evaluate((tt) => {
      VE.limpiarRegistro();
      window.renderAt(tt);
      return VE.lint(window.__esc || VE.__esc, tt);
    }, Math.round(t * 1000) / 1000));
  }
  await navegador.close();

  const errores = [], avisos = [];
  for (const inf of informes) for (const a of inf.avisos) (a.nivel === 'error' ? errores : avisos).push(a);

  // Se agrupan por regla: 40 fotogramas con el mismo fallo son un fallo, no cuarenta.
  const agrupar = (lista) => {
    const m = new Map();
    for (const a of lista) {
      const k = a.regla + '|' + a.msg;
      if (!m.has(k)) m.set(k, { regla: a.regla, msg: a.msg, veces: 0, desde: a.t, hasta: a.t });
      const g = m.get(k); g.veces++; g.hasta = a.t;
    }
    return [...m.values()].sort((x, y) => y.veces - x.veces);
  };

  console.log(`\nQA ${formato}/${estilo}  ${informes.length} fotogramas revisados (0 a ${D}s, paso ${P}s)\n`);
  const ge = agrupar(errores), ga = agrupar(avisos);
  for (const g of ge) console.log(`  ERROR  [${g.regla}] ${g.msg}\n         ${g.veces} fotogramas, de ${g.desde}s a ${g.hasta}s`);
  for (const g of ga) console.log(`  aviso  [${g.regla}] ${g.msg}\n         ${g.veces} fotogramas, de ${g.desde}s a ${g.hasta}s`);
  if (!ge.length && !ga.length) console.log('  Sin incidencias.');
  console.log(`\n  ${ge.length} tipos de error, ${ga.length} tipos de aviso\n`);
  process.exit(ge.length ? 1 : 0);
})().catch(e => { console.error('FALLO:', e.message); process.exit(2); });
