const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'catalog.json');
const FILES_FILE = path.join(ROOT, 'data', '_files.json');
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf','.doc':'application/msword','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.txt':'text/plain; charset=utf-8'};
// 初始化默认数据
if (!fs.existsSync(DATA_FILE)) { try { const d = JSON.parse(fs.readFileSync(path.join(ROOT,'data','catalog.json'), 'utf8')); } catch(e) {} }
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const q = new URLSearchParams(req.url.split('?')[1]||'');
  if (url === '/api/load' && req.method === 'GET') {
    try {
      const cat = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      let files = {}; try { if (fs.existsSync(FILES_FILE)) files = JSON.parse(fs.readFileSync(FILES_FILE, 'utf8')); } catch(e) {}
      res.writeHead(200, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      res.end(JSON.stringify({catalog:cat,files}));
    } catch(e) { res.writeHead(500); res.end(JSON.stringify({error:e.message})); }
    return;
  }
  if (url === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (d.catalog) { fs.writeFileSync(DATA_FILE, JSON.stringify(d.catalog, null, 2), 'utf8'); if (d.files) fs.writeFileSync(FILES_FILE, JSON.stringify(d.files), 'utf8'); res.writeHead(200, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}); res.end(JSON.stringify({success:true})); }
        else { res.writeHead(400); res.end(JSON.stringify({error:'no catalog'})); }
      } catch(e) { res.writeHead(500); res.end(JSON.stringify({error:e.message})); }
    });
    return;
  }
  if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST','Access-Control-Allow-Headers':'Content-Type'}); res.end(); return; }
  let up = decodeURIComponent(url);
  if (up === '/') up = '/index.html';
  const fp = path.normalize(path.join(ROOT, up));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, {'Content-Type':MIME[ext]||'application/octet-stream'});
    res.end(fs.readFileSync(fp));
  } else { res.writeHead(404); res.end('Not Found'); }
}).listen(PORT, '0.0.0.0', () => { console.log('✓ Server running on port '+PORT); });
