const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');
const stateFilePath = path.join(dataDir, 'dashboard-state.json');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const DEFAULT_STATE = {
  stockReady: 120,
  stockTarget: 150,
  sales: [
    { id: 'STRK-001', customer: 'Bapak Rudi', amount: 280000, note: '10 box', time: '2026-07-14 09:30' },
    { id: 'STRK-002', customer: 'Keluarga Ana', amount: 160000, note: '5 box', time: '2026-07-13 16:10' }
  ],
  expenses: [
    { id: 'EXP-001', amount: 95000, note: 'Beli coklat premium', time: '2026-07-14 07:45' }
  ],
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(stateFilePath)) {
    fs.writeFileSync(stateFilePath, JSON.stringify(DEFAULT_STATE, null, 2));
  }
}

function readState() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(stateFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to read dashboard state file, using defaults.', error);
    return DEFAULT_STATE;
  }
}

function writeState(state) {
  ensureDataFile();
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
  return state;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[extension] || 'application/octet-stream';
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname === '/api/dashboard-state') {
    if (req.method === 'GET') {
      sendJson(res, 200, readState());
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = body ? JSON.parse(body) : DEFAULT_STATE;
          sendJson(res, 200, writeState(payload));
        } catch (error) {
          sendJson(res, 400, { error: 'Invalid JSON payload' });
        }
      });
      return;
    }
  }

  const relativePath = pathname === '/' ? '/index.html' : pathname;
  const requestedPath = path.normalize(relativePath).replace(/^\/+/, '');
  const absolutePath = path.join(rootDir, requestedPath);

  if (!absolutePath.startsWith(rootDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  serveStaticFile(res, absolutePath);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
