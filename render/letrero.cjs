/* Genera la capa del LETRERO FINAL («SIGUE A @randonautico», VE.short.letrero) como PNG con alfa, fotograma a fotograma.
   Uso: node render/letrero.cjs <carpeta> <t_entrada> <t_fin> [fps=30] [handle]
   Escribe <carpeta>/l_0000.png ... desde t_entrada hasta t_fin; se superpone con ffmpeg (overlay). */
const fs = require('fs'), path = require('path');
const { iniciar } = require('./servidor.cjs');
const { EXE, PW, FLAGS } = require('./navegador.cjs');
(async () => {
  const [carpeta, t0s, t1s, fpsS = '30', handle] = process.argv.slice(2);
  if (!carpeta || !t0s || !t1s) { console.error('Uso: node render/letrero.cjs <carpeta> <t_entrada> <t_fin> [fps] [handle]'); process.exit(1); }
  const t0 = parseFloat(t0s), t1 = parseFloat(t1s), fps = parseFloat(fpsS);
  fs.mkdirSync(carpeta, { recursive: true });
  const srv = await iniciar(); const { chromium } = require(PW);
  const b = await chromium.launch({ executablePath: EXE, args: FLAGS });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } }); const err = [];
  pg.on('pageerror', e => err.push(String(e))); pg.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
  await pg.goto(`http://127.0.0.1:${srv.puerto}/engine/sdf/letrero.html`); await pg.evaluate(() => window.ready);
  if (err.length) throw new Error(err.join('\n'));
  const n = Math.round((t1 - t0) * fps);
  for (let i = 0; i < n; i++) {
    const u = await pg.evaluate(([t, a, h]) => window.capa(t, a, h), [t0 + i / fps, t0, handle || null]);
    fs.writeFileSync(path.join(carpeta, `l_${String(i).padStart(4, '0')}.png`), Buffer.from(u.split(',')[1], 'base64'));
  }
  await b.close(); srv.cerrar(); console.log(`letrero: ${n} capas en ${carpeta}`);
})().catch(e => { console.error('FALLO:', e.message); process.exit(1); });
