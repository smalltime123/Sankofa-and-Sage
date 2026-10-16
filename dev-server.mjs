import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}
const port = Number(option('port', process.env.PORT || '5173'));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Choose a port from 1 to 65535.');
const rootDirectory = path.resolve(projectRoot, option('directory', '.'));
const base = `/${option('base', '/').split('/').filter(Boolean).join('/')}`.replace(/\/$/, '') + '/';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    if (base !== '/' && (pathname === '/' || pathname === base.slice(0, -1))) {
      response.writeHead(302, { Location: base });
      response.end();
      return;
    }
    if (!pathname.startsWith(base)) throw Object.assign(new Error(), { code: 'ENOENT' });
    const relative = pathname.slice(base.length);
    let filename = path.resolve(rootDirectory, relative || 'index.html');
    if (filename !== rootDirectory && !filename.startsWith(rootDirectory + path.sep)) throw Object.assign(new Error(), { code: 'ENOENT' });
    if (relative.split('/').some(part => part.startsWith('.'))) throw Object.assign(new Error(), { code: 'ENOENT' });
    const details = await stat(filename);
    if (details.isDirectory()) {
      if (!pathname.endsWith('/')) {
        response.writeHead(302, { Location: pathname + '/' + url.search });
        response.end();
        return;
      }
      filename = path.join(filename, 'index.html');
    }
    const body = await readFile(filename);
    response.writeHead(200, {
      'Content-Type': mime[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const status = error.code === 'ENOENT' || error.code === 'ENOTDIR' || error instanceof URIError ? 404 : 500;
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(status === 404 ? 'File not found' : 'Unable to serve this file');
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Try: npm start -- --port 5174` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Sankofa & Sage: http://localhost:${port}${base}`);
  console.log('Edit the source files and refresh your browser. Press Ctrl+C to stop.');
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
