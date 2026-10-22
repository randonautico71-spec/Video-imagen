/* REVISION de un proyecto: pasa el linter por una rejilla de instantes y guarda fotogramas de control.
   Uso: node render/revisar.cjs --proyecto proyectos/x --lienzo vertical [--paso 0.5] [--stills 1,5,9] [--salida DIR] [--ss 1.5]
   Sale con codigo 1 si hay errores del linter (los avisos no fallan).                                  */
const fs = require('fs'), path = require('path');
const { iniciar, RAIZ } = require('./servidor.cjs');
const { abrirProyecto } = require('./navegador.cjs');
const A = {}; const v = process.argv.slice(2);
for (let i = 0; i < v.length; i++) if (v[i].startsWith('--')) A[v[i].slice(2)] = (v[i + 1] && !v[i + 1].startsWith('--')) ? v[++i] : true;

(async () => {
  const srv = await iniciar();
  const { page, navegador } = await abrirProyecto({ puerto: srv.puerto, proyecto: A.proyecto, lienzo: A.lienzo || 'yt', ss: parseFloat(A.ss || 1.5) });
  const dur = await page.evaluate(() => window.DURACION), paso = parseFloat(A.paso || 0.5);
  const informes = [];
  for (let t = 0; t < dur; t += paso)
    informes.push(await page.evaluate(tt => { window.renderAt(tt); return VE.lint(VE.__esc, tt); }, Math.round(t * 1000) / 1000));
  if (A.stills) {
    const dir = path.resolve(A.salida || path.join(RAIZ, A.proyecto, 'salida/stills')); fs.mkdirSync(dir, { recursive: true });
    for (const s of String(A.stills).split(',')) {
      const t = parseFloat(s); const b = await page.evaluate(tt => window.capturar(tt, 0.95), t);
      const f = path.join(dir, `t${String(t).replace('.', '_')}.jpg`); fs.writeFileSync(f, Buffer.from(b, 'base64')); console.log('still', f);
    }
  }
  await navegador.close(); srv.cerrar();
  const errs = [], avs = [];
  for (const inf of informes) for (const a of inf.avisos) (a.nivel === 'error' ? errs : avs).push(a);
  const agrupar = l => { const m = new Map(); for (const a of l) { const k = a.regla + '|' + a.msg; if (!m.has(k)) m.set(k, { ...a, veces: 0, hasta: a.t }); const g = m.get(k); g.veces++; g.hasta = a.t; } return [...m.values()]; };
  console.log(`\nQA ${A.proyecto} (${A.lienzo || 'yt'}): ${informes.length} fotogramas, 0 a ${dur.toFixed(1)} s, paso ${paso} s`);
  for (const g of agrupar(errs)) console.log(`  ERROR [${g.regla}] ${g.msg}  (${g.veces} fotogramas, ${g.t}s-${g.hasta}s)`);
  for (const g of agrupar(avs)) console.log(`  aviso [${g.regla}] ${g.msg}  (${g.veces} fotogramas, ${g.t}s-${g.hasta}s)`);
  if (!errs.length && !avs.length) console.log('  Sin incidencias.');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FALLO:', e.message); process.exit(2); });
