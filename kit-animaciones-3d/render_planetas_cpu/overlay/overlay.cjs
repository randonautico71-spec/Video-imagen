const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { EXE, PW, FLAGS } = require('/home/claude/randonautico71-spec/video-imagen/render/navegador.cjs');
(async () => {
  const arg = process.argv.slice(2), { chromium } = require(PW);
  const b = await chromium.launch({ executablePath: EXE, args: FLAGS }), pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => { console.error('Error:', e.message); process.exit(1); });
  await pg.goto('file://' + path.join(__dirname, 'overlay.html')); await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(() => Promise.all([document.fonts.load('800 40px Poppins'), document.fonts.load('700 40px Poppins'), document.fonts.load('600 40px Poppins')]));
  await pg.evaluate(([m, w]) => window.init(m, w), [JSON.parse(fs.readFileSync(path.join(__dirname, 'marks.json'))), JSON.parse(fs.readFileSync(path.join(__dirname, 'palabras.json')))]);
  const frame = async t => Buffer.from((await pg.evaluate(t => { window.capa(t); return document.getElementById('c').toDataURL('image/png'); }, t)).split(',')[1], 'base64');
  if (arg[0] === '--stills') { fs.mkdirSync(arg[2], { recursive: true }); for (const t of arg[1].split(',').map(Number)) fs.writeFileSync(path.join(arg[2], `ov_${t}.png`), await frame(t)); await b.close(); return; }
  const [sal, t1s, fpsS = '30'] = arg, fps = +fpsS, N = Math.round(+t1s * fps);
  const enc = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'png', '-r', String(fps), '-i', '-', '-c:v', 'qtrle', '-pix_fmt', 'argb', sal], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fin = new Promise(r => enc.on('close', r));
  for (let i = 0; i < N; i++) { const buf = await frame(i / fps); if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r)); }
  enc.stdin.end(); await fin; await b.close(); console.log('ok', sal);
})().catch(e => { console.error('FALLO', e.message); process.exit(1); });
