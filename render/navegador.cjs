/* Lanzamiento de Chromium con la configuracion que este contenedor necesita.
   Los flags de red no son decorativos: sin ellos Chromium intenta hablar con
   google.com y gvt1.com, el proxy los rechaza y cada arranque pierde segundos. */
const fs = require('fs'), path = require('path'), cp = require('child_process');

/* Localiza Playwright y Chromium en CUALQUIER contenedor (Code, chat de un Project, otro). Orden: variables de entorno PW_MODULE / CHROME_PATH,
   rutas conocidas, busqueda en PLAYWRIGHT_BROWSERS_PATH / ~/.cache/ms-playwright, y binarios del sistema. Si no hay nada, falla con instrucciones. */
function primero(cands) { for (const c of cands) { if (c && fs.existsSync(c)) return c; } return null; }
function glob1(dir, re, sub) { try { for (const d of fs.readdirSync(dir).filter(n => re.test(n)).sort().reverse()) { const p = path.join(dir, d, sub); if (fs.existsSync(p)) return p; } } catch (e) {} return null; }
function resolverPW() {
  const g = (() => { try { return cp.execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } })();
  return primero([process.env.PW_MODULE, '/opt/node-tools/node_modules/playwright', path.join(__dirname, '../node_modules/playwright'), g && path.join(g, 'playwright'), g && path.join(g, 'playwright-core')]);
}
function resolverChrome() {
  const home = process.env.HOME || '/root', base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const bin = (n) => { try { return cp.execSync('command -v ' + n, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
  return primero([process.env.CHROME_PATH, glob1(base, /^chromium-\d+$/, 'chrome-linux/chrome'), glob1(path.join(home, '.cache/ms-playwright'), /^chromium-\d+$/, 'chrome-linux/chrome'),
                  bin('chromium'), bin('chromium-browser'), bin('google-chrome'), bin('google-chrome-stable')]);
}
const PW = resolverPW(), EXE = resolverChrome();
if (!PW || !EXE) {
  console.error('No se encuentra ' + (!PW ? 'Playwright' : 'Chromium') + '. Prueba: bash chat/bootstrap.sh  (o define PW_MODULE y CHROME_PATH).');
  if (require.main !== module) throw new Error('Playwright/Chromium no encontrados');
}

const FLAGS = [
  '--no-sandbox', '--disable-dev-shm-usage',
  '--disable-lcd-text',                 // subpixel AA estropea el downscale
  '--force-color-profile=srgb',         // color estable entre trozos
  '--font-render-hinting=none',         // tipografia identica en todos los procesos
  '--disable-background-networking', '--disable-component-update',
  '--disable-sync', '--no-first-run', '--disable-default-apps',
  '--metrics-recording-only', '--hide-scrollbars', '--mute-audio'
];

async function abrir({ formato = 'yt', estilo = 'DARK', ss = 1.5, pagina, demo } = {}) {
  const { chromium } = require(PW);
  const F = { yt: [1920, 1080], vertical: [1080, 1920], cuadrado: [1080, 1080] }[formato];
  if (!F) throw new Error('Formato desconocido: ' + formato);
  const navegador = await chromium.launch({ executablePath: EXE, args: FLAGS });
  const page = await navegador.newPage({ viewport: { width: F[0], height: F[1] }, deviceScaleFactor: 1 });
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  const url = 'file://' + (pagina || demo) + `?formato=${formato}&estilo=${estilo}&ss=${ss}`;
  await page.goto(url, { waitUntil: 'load' });
  if (await page.evaluate(() => !!window.ready)) await page.evaluate(() => window.ready);
  if (errores.length) throw new Error('Errores en la pagina:\n' + errores.join('\n'));
  return { navegador, page, W: F[0], H: F[1], errores };
}

/* Captura un fotograma. Medido en este contenedor (escena optimizada, 1080p):
   toDataURL 36 ms · CDP 52 ms · page.screenshot jpeg 66-79 ms · PNG 393 ms.
   Por eso aqui se usa toDataURL y no screenshot. */
async function capturar(page, t, calidad = 0.92) {
  const b64 = await page.evaluate(([tt, q]) => {
    window.renderAt(tt);
    return document.getElementById('c').toDataURL('image/jpeg', q).slice(23);
  }, [t, calidad]);
  return Buffer.from(b64, 'base64');
}

const LIENZOS = { yt: [1920, 1080], vertical: [1080, 1920], cuadrado: [1080, 1080] };

/* Abre un proyecto en el motor. 'puerto' es el del servidor estatico. */
async function abrirProyecto({ puerto, proyecto, lienzo = 'yt', ss = 1.5, so = 1 }) {
  const { chromium } = require(PW);
  const F = LIENZOS[lienzo];
  if (!F) throw new Error('Lienzo desconocido: ' + lienzo);
  const navegador = await chromium.launch({ executablePath: EXE, args: FLAGS });
  const page = await navegador.newPage({ viewport: { width: F[0], height: F[1] }, deviceScaleFactor: 1 });
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text() + (m.location().url ? '  <- ' + m.location().url : '')); });
  page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errores.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.goto(`http://127.0.0.1:${puerto}/engine/video/index.html?p=${proyecto}&lienzo=${lienzo}&ss=${ss}&so=${so}`, { waitUntil: 'load' });
  try { await page.evaluate(() => window.ready); }
  catch (e) { await navegador.close(); throw new Error('El proyecto no cargo: ' + e.message.split('\n')[0] + (errores.length ? '\n' + errores.join('\n') : '')); }
  if (errores.length) { await navegador.close(); throw new Error('Errores en la pagina:\n' + errores.join('\n')); }
  return { navegador, page, W: F[0], H: F[1] };
}

module.exports = { abrir, abrirProyecto, capturar, FLAGS, EXE, PW, LIENZOS };
