import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const routes = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/axios.min.js': ['node_modules/axios/dist/axios.min.js', 'text/javascript; charset=utf-8']
};
const server = http.createServer(async (req, res) => {
  const route = routes[new URL(req.url, 'http://localhost').pathname];
  if (!route) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(path.join(root, route[0]));
    res.writeHead(200, { 'Content-Type': route[1], 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end('Missing file. Run npm install in frontend first.');
  }
});
server.on('error', error => { console.error(error.message); process.exit(1); });
server.listen(5500, '127.0.0.1', () => console.log('Frontend: http://localhost:5500'));
