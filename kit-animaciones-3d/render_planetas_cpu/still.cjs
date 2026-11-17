const { renderFrame } = require('./shots.js'), fs = require('fs'), { spawnSync } = require('child_process');
const [w, h, ...ts] = process.argv.slice(2); fs.mkdirSync('stills', { recursive: true });
for (const t of ts) { const t0 = Date.now(), b = renderFrame(+t, +w, +h); spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', `stills/s${t}.png`], { input: Buffer.from(b) }); console.log(t, ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
