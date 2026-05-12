import { createServer } from "node:http";
import { renderShell } from "./render.js";

const port = Number(process.env.FRONTEND_PORT ?? 3000);

const server = createServer((request, response) => {
  if (request.url === "/" || request.url === "/index.html") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(renderShell());
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("not found");
});

server.listen(port, () => {
  console.log(`Frontend shell listening on http://localhost:${port}`);
});
