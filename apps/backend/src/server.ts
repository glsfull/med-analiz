import { createServer } from "node:http";
import { getHealthStatus } from "./health.js";

const port = Number(process.env.BACKEND_PORT ?? 4000);

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(getHealthStatus()));
    return;
  }

  response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, () => {
  console.log(`Backend health server listening on http://localhost:${port}`);
});
