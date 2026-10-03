import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.env.SERVE_DIST === '1' ? path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist') : path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4190);
const mime = {
  ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".webp":"image/webp", ".svg":"image/svg+xml", ".ogg":"audio/ogg", ".mp3":"audio/mpeg", ".ttf":"font/ttf", ".woff2":"font/woff2"
};

const server = http.createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, {"Content-Type":"text/plain; charset=utf-8", "Allow":"GET, HEAD"});
    res.end("Method not allowed");
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname); }
  catch { res.writeHead(400); res.end("Bad request"); return; }
  if (pathname === "/") pathname = "/index.html";
  const filename = path.resolve(root, `.${pathname}`);
  if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403); res.end("Forbidden"); return; }
  try {
    const info = await stat(filename);
    if (!info.isFile()) throw new Error("not a file");
    const data = await readFile(filename);
    res.writeHead(200, {
      "Content-Type":mime[path.extname(filename).toLowerCase()] || "application/octet-stream",
      "Content-Length":data.length,
      "Cache-Control":"no-cache",
      "X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"no-referrer",
      "Content-Security-Policy":"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8", "X-Content-Type-Options":"nosniff"});
    res.end("Not found");
  }
});

server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`포트 ${port}가 사용 중입니다. PORT 환경변수로 다른 포트를 지정해 주세요.`:'게임 서버를 시작하지 못했습니다: '+error.message);process.exitCode=1;});
server.listen(port, "127.0.0.1", () => {
  console.log(`강호 첫걸음 실행 중: http://127.0.0.1:${port}/`);
});
