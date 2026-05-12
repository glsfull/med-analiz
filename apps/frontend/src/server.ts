import { createServer } from "node:http";
import { renderAdminShell, renderLandingShell, renderShell } from "./render.js";

const port = Number(process.env.FRONTEND_PORT ?? 3000);

const server = createServer((request, response) => {
  const path = request.url?.split("?")[0] ?? "/";

  if (path === "/" || path === "/index.html") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(renderLandingShell());
    return;
  }

  if (path === "/app" || path === "/app/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(renderShell());
    return;
  }

  if (path === "/admin" || path === "/admin/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(renderAdminShell());
    return;
  }

  if (path === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("not found");
});

server.listen(port, () => {
  console.log(`Frontend shell listening on http://localhost:${port}`);
});
