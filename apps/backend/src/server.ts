import { createServer } from "node:http";
import { createApiHandler } from "./api/http.js";
import { MemoryStore } from "./storage/memory-store.js";

const port = Number(process.env.BACKEND_PORT ?? 4000);
const store = new MemoryStore();

const server = createServer(createApiHandler({ store }));

server.listen(port, () => {
  console.log(`Backend API server listening on http://localhost:${port}`);
});
