import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getHealthStatus } from "../health.js";
import type { Analysis, AnalysisFile, UserAccount } from "../domain/types.js";
import {
  applyMarkerCorrections,
  FixtureOcrProvider,
  RuleBasedAiProvider,
  recalculateInterpretation,
  runAnalysisPipeline,
  type AiProvider,
  type OcrProvider
} from "../processing/providers.js";
import type { MemoryStore } from "../storage/memory-store.js";

const jsonType = { "content-type": "application/json; charset=utf-8" };
const maxUploadBytes = 20 * 1024 * 1024;
const maxJsonBytes = 1 * 1024 * 1024;
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
  ocrProvider?: OcrProvider;
  aiProvider?: AiProvider;
}

export function createApiHandler(context: ApiContext) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    applySecurityHeaders(request, response);
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
        const email = requireString(body.email, "email").toLowerCase();
        const session = context.store.authenticate(email, requireString(body.password, "password"));
        return session
          ? send(response, 200, session)
          : send(
              response,
              context.store.loginGuards.get(email)?.lockedUntil ? 429 : 401,
              context.store.loginGuards.get(email)?.lockedUntil
                ? { error: "too_many_login_attempts" }
                : { error: "invalid_credentials" }
            );
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
        await processAnalysis(context, analysis, user);
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
        await processAnalysis(context, analysis, user);
        context.store.writeAudit(
          user.id,
          "analysis.reprocess_requested",
          "analysis",
          analysis.id,
          {}
        );
        return send(response, 200, { analysis });
      }

      const correctionsMatch = url.pathname.match(/^\/analyses\/([^/]+)\/corrections$/);
      if (method === "PATCH" && correctionsMatch) {
        const user = requireAuth(request, context.store);
        const analysis = context.store.analyses.get(correctionsMatch[1] ?? "");
        if (!analysis || analysis.deletedAt || analysis.ownerId !== user.id) {
          return send(response, 404, { error: "analysis_not_found" });
        }
        const body = await readJson(request);
        const markers = readMarkerCorrections(body.markers);
        applyMarkerCorrections(analysis, markers, context.now?.() ?? new Date());
        await recalculateAnalysis(context, analysis, user);
        context.store.writeAudit(user.id, "analysis.corrected", "analysis", analysis.id, {
          markerCount: markers.length
        });
        return send(response, 200, { analysis });
      }

      if (url.pathname.startsWith("/admin/")) {
        const user = requireAuth(request, context.store);
        if (user.role !== "admin") {
          return send(response, 403, { error: "admin_required" });
        }
        if (method === "GET" && url.pathname === "/admin/users") {
          if (!user.twoFactorEnabled) {
            return send(response, 403, { error: "admin_2fa_required" });
          }
          return send(response, 200, { users: [...context.store.users.values()].map(publicUser) });
        }
        if (method === "GET" && url.pathname === "/admin/analyses") {
          if (!user.twoFactorEnabled) {
            return send(response, 403, { error: "admin_2fa_required" });
          }
          return send(response, 200, { analyses: [...context.store.analyses.values()] });
        }
        if (method === "GET" && url.pathname === "/admin/audit-log") {
          if (!user.twoFactorEnabled) {
            return send(response, 403, { error: "admin_2fa_required" });
          }
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

async function processAnalysis(
  context: ApiContext,
  analysis: Analysis,
  user: UserAccount
): Promise<void> {
  try {
    await runAnalysisPipeline(
      analysis,
      user.profile,
      context.ocrProvider ?? new FixtureOcrProvider(),
      context.aiProvider ?? new RuleBasedAiProvider(),
      context.now?.() ?? new Date()
    );
    context.store.writeAudit(user.id, "analysis.processed", "analysis", analysis.id, {
      markerCount: analysis.markers.length
    });
  } catch (error) {
    analysis.status = "error";
    analysis.updatedAt = (context.now?.() ?? new Date()).toISOString();
    context.store.writeAudit(user.id, "analysis.processing_failed", "analysis", analysis.id, {
      reason: error instanceof Error ? error.message : "unknown"
    });
    throw error;
  }
}

async function recalculateAnalysis(
  context: ApiContext,
  analysis: Analysis,
  user: UserAccount
): Promise<void> {
  try {
    await recalculateInterpretation(
      analysis,
      user.profile,
      context.aiProvider ?? new RuleBasedAiProvider(),
      context.now?.() ?? new Date()
    );
    context.store.writeAudit(user.id, "analysis.recalculated", "analysis", analysis.id, {
      markerCount: analysis.markers.length
    });
  } catch (error) {
    analysis.status = "error";
    analysis.updatedAt = (context.now?.() ?? new Date()).toISOString();
    context.store.writeAudit(user.id, "analysis.processing_failed", "analysis", analysis.id, {
      reason: error instanceof Error ? error.message : "unknown"
    });
    throw error;
  }
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let byteLength = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteLength += buffer.byteLength;
    if (byteLength > maxJsonBytes) {
      throw new Error("payload_too_large");
    }
    chunks.push(buffer);
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
    storageKey: `s3+aes256://medical-analyses/${ownerId}/${analysisId}/${analysisFileName(
      originalName
    )}`,
    encrypted: true,
    antivirusStatus: "clean",
    uploadedAt: timestamp
  };

  return {
    id: analysisId,
    ownerId,
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : originalName,
    status: "uploaded",
    createdAt: timestamp,
    updatedAt: timestamp,
    files: [analysisFile],
    markers: []
  };
}

function readMarkerCorrections(
  value: unknown
): Array<{ name: string; value: string; unit?: string }> {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("invalid_markers");
  }
  return value.map((marker) => {
    if (!marker || typeof marker !== "object" || Array.isArray(marker)) {
      throw new Error("invalid_markers");
    }
    const body = marker as Record<string, unknown>;
    return {
      name: requireString(body.name, "marker_name"),
      value: requireString(body.value, "marker_value"),
      unit: typeof body.unit === "string" && body.unit.trim() ? body.unit.trim() : undefined
    };
  });
}

function publicUser(user: UserAccount) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
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

function applySecurityHeaders(request: IncomingMessage, response: ServerResponse): void {
  const socket = request.socket as typeof request.socket & { encrypted?: boolean };
  const isHttps =
    socket.encrypted ||
    request.headers["x-forwarded-proto"] === "https" ||
    process.env.APP_ENV === "dev";
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'none'");
  if (isHttps) {
    response.setHeader("strict-transport-security", "max-age=31536000; includeSubDomains");
  }
}

function analysisFileName(originalName: string): string {
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  return `${randomUUID()}.${extension}`;
}
