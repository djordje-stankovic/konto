// Lokalni pregled: node pregled.js → http://localhost:8092
const http = require('http'), fs = require('fs'), path = require('path');
const tipovi = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(__dirname, p);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end('nema'); } r.writeHead(200, { 'Content-Type': tipovi[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(8092, () => console.log('http://localhost:8091'));
