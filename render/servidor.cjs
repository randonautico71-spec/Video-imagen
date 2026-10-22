/* Servidor estatico minimo sobre la raiz del motor. Hace falta porque la pagina carga JSON del proyecto
   con fetch(), que file:// no permite. Solo sirve ficheros dentro de la raiz (sin salirse con ../). */
const http = require('http'), fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.svg': 'image/svg+xml' };
function iniciar(puerto = 0) {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      if (u === '/favicon.ico') { res.writeHead(204); return res.end(); }
      const f = path.resolve(RAIZ, '.' + u);
      if (!f.startsWith(RAIZ + path.sep) && f !== RAIZ) { res.writeHead(403); return res.end('fuera de la raiz'); }
      fs.readFile(f, (e, d) => {
        if (e) { res.writeHead(404); return res.end('no encontrado: ' + u); }
        res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(d);
      });
    });
    s.listen(puerto, '127.0.0.1', () => ok({ puerto: s.address().port, cerrar: () => s.close() }));
  });
}
module.exports = { iniciar, RAIZ };
