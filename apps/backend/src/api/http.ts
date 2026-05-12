import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getHealthStatus } from "../health.js";
import type {
  Analysis,
  AnalysisFile,
  ExtractedMarker,
  Interpretation,
  UserAccount
} from "../domain/types.js";
import type { MemoryStore } from "../storage/memory-store.js";

const jsonType = { "content-type": "application/json; charset=utf-8" };
const maxUploadBytes = 20 * 1024 * 1024;
const allowedUploads = new Map([
  ["pdf", "application/pdf"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["heic", "image/heic"]
]);

export interface ApiContext {
  store: MemoryStore;
  now?: () => Date;
}

export function createApiHandler(context: ApiContext) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const method = request.method ?? "GET";

    try {
      if (method === "GET" && url.pathname === "/health") {
        return send(response, 200, getHealthStatus(context.now?.() ?? new Date()));
      }

      if (method === "POST" && url.pathname === "/auth/register") {
        const body = await readJson(request);
        const email = requireString(body.email, "email").toLowerCase();
        const password = requireString(body.password, "password");
        const role = body.role === "admin" ? "admin" : "patient";
        const user = context.store.createUser(email, password, role);
        const session = context.store.issueSession(user.id);
        return send(response, 201, { user: publicUser(user), ...session });
      }

      if (method === "POST" && url.pathname === "/auth/login") {
        const body = await readJson(request);
        const session = context.store.authenticate(
          requireString(body.email, "email").toLowerCase(),
          requireString(body.password, "password")
        );
        return session
          ? send(response, 200, session)
          : send(response, 401, { error: "invalid_credentials" });
      }

      if (method === "POST" && url.pathname === "/auth/refresh") {
        const body = await readJson(request);
        const session = context.store.rotateRefreshToken(
          requireString(body.refreshToken, "refreshToken")
        );
        return session
          ? send(response, 200, session)
          : send(response, 401, { error: "invalid_refresh_token" });
      }

      if (method === "GET" && url.pathname === "/me") {
        const user = requireAuth(request, context.store);
        return send(response, 200, { user: publicUser(user) });
      }

      if (method === "PATCH" && url.pathname === "/me/profile") {
        const user = requireAuth(request, context.store);
        const profile = context.store.updateProfile(user.id, await readJson(request));
        return send(response, 200, { profile });
      }

      if (method === "PATCH" && url.pathname === "/me/consents") {
        const user = requireAuth(request, context.store);
        const consents = context.store.updateConsents(user.id, await readJson(request));
        return send(response, 200, { consents });
      }

      if (method === "DELETE" && url.pathname === "/me") {
        const user = requireAuth(request, context.store);
        context.store.deleteAccount(user.id);
        return send(response, 204, {});
      }

      if (method === "POST" && url.pathname === "/analyses") {
        const user = requireAuth(request, context.store);
        const analysis = createAnalysis(
          user.id,
          await readJson(request),
          context.now?.() ?? new Date()
        );
        context.store.addAnalysis(analysis);
        return send(response, 201, { analysis });
      }

      if (method === "GET" && url.pathname === "/analyses") {
        const user = requireAuth(request, context.store);
        const analyses = [...context.store.analyses.values()].filter(
          (analysis) => analysis.ownerId === user.id && !analysis.deletedAt
        );
        return send(response, 200, { analyses });
      }

      const analysisMatch = url.pathname.match(/^\/analyses\/([^/]+)$/);
      if (analysisMatch) {
        const user = requireAuth(request, context.store);
        const analysis = context.store.analyses.get(analysisMatch[1] ?? "");
        if (!analysis || analysis.deletedAt || analysis.ownerId !== user.id) {
          return send(response, 404, { error: "analysis_not_found" });
        }
        if (method === "GET") {
          return send(response, 200, { analysis });
        }
        if (method === "DELETE") {
          analysis.deletedAt = (context.now?.() ?? new Date()).toISOString();
          context.store.writeAudit(user.id, "analysis.deleted", "analysis", analysis.id, {});
          return send(response, 204, {});
        }
      }

      const reprocessMatch = url.pathname.match(/^\/analyses\/([^/]+)\/reprocess$/);
      if (method === "POST" && reprocessMatch) {
        const user = requireAuth(request, context.store);
        const analysis = context.store.analyses.get(reprocessMatch[1] ?? "");
        if (!analysis || analysis.deletedAt || analysis.ownerId !== user.id) {
          return send(response, 404, { error: "analysis_not_found" });
        }
        analysis.status = "ocr_pending";
        analysis.updatedAt = (context.now?.() ?? new Date()).toISOString();
        context.store.writeAudit(
          user.id,
          "analysis.reprocess_requested",
          "analysis",
          analysis.id,
          {}
        );
        return send(response, 200, { analysis });
      }

      if (url.pathname.startsWith("/admin/")) {
        const user = requireAuth(request, context.store);
        if (user.role !== "admin") {
          return send(response, 403, { error: "admin_required" });
        }
        if (method === "GET" && url.pathname === "/admin/users") {
          return send(response, 200, { users: [...context.store.users.values()].map(publicUser) });
        }
        if (method === "GET" && url.pathname === "/admin/analyses") {
          return send(response, 200, { analyses: [...context.store.analyses.values()] });
        }
        if (method === "GET" && url.pathname === "/admin/audit-log") {
          return send(response, 200, { auditLogs: context.store.auditLogs });
        }
      }

      return send(response, 404, { error: "not_found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "internal_error";
      const status = message === "unauthorized" ? 401 : message === "invalid_payload" ? 400 : 422;
      return send(response, status, { error: message });
    }
  };
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return {};
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("invalid_payload");
  }
  return parsed as Record<string, unknown>;
}

function requireAuth(request: IncomingMessage, store: MemoryStore): UserAccount {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  const user = token ? store.getUserByAccessToken(token) : undefined;
  if (!user || user.deletedAt) {
    throw new Error("unauthorized");
  }
  return user;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`invalid_${field}`);
  }
  return value.trim();
}

function createAnalysis(ownerId: string, body: Record<string, unknown>, now: Date): Analysis {
  const fileBody = body.file;
  if (!fileBody || typeof fileBody !== "object" || Array.isArray(fileBody)) {
    throw new Error("invalid_file");
  }
  const file = fileBody as Record<string, unknown>;
  const originalName = requireString(file.originalName, "originalName");
  const mimeType = requireString(file.mimeType, "mimeType");
  const sizeBytes = Number(file.sizeBytes);
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (
    !allowedUploads.has(extension) ||
    allowedUploads.get(extension) !== mimeType ||
    !Number.isFinite(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > maxUploadBytes
  ) {
    throw new Error("unsupported_upload");
  }

  const timestamp = now.toISOString();
  const analysisId = randomUUID();
  const analysisFile: AnalysisFile = {
    id: randomUUID(),
    analysisId,
    ownerId,
    originalName,
    mimeType,
    extension,
    sizeBytes,
    storageKey: `s3://medical-analyses/${ownerId}/${analysisId}/${originalName}`,
    uploadedAt: timestamp
  };
  const markers: ExtractedMarker[] = [];
  const interpretation: Interpretation = {
    id: randomUUID(),
    analysisId,
    summary:
      "Файл принят. OCR и AI-интерпретация будут выполнены асинхронным pipeline на следующем этапе.",
    disclaimer: "Сервис не ставит диагноз и не заменяет консультацию врача.",
    modelVersion: "pending-stage-4",
    createdAt: timestamp
  };

  return {
    id: analysisId,
    ownerId,
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : originalName,
    status: "uploaded",
    createdAt: timestamp,
    updatedAt: timestamp,
    files: [analysisFile],
    markers,
    interpretation
  };
}

function publicUser(user: UserAccount) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    consents: user.consents,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt
  };
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, jsonType);
  response.end(status === 204 ? undefined : JSON.stringify(body));
}
