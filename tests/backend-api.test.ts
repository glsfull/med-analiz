import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApiHandler } from "../apps/backend/src/api/http.js";
import { MemoryStore } from "../apps/backend/src/storage/memory-store.js";

describe("backend MVP API", () => {
  let server: Server;
  let baseUrl: string;
  let store: MemoryStore;

  beforeEach(async () => {
    store = new MemoryStore(() => new Date("2026-05-12T12:00:00.000Z"));
    server = createServer(
      createApiHandler({ store, now: () => new Date("2026-05-12T12:00:00.000Z") })
    );
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("server did not bind to a TCP port");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("registers a patient, updates profile and consents, and rotates refresh tokens", async () => {
    const registered = await jsonRequest("/auth/register", {
      method: "POST",
      body: { email: "patient@example.test", password: "secret-password" }
    });

    expect(registered.status).toBe(201);
    expect(registered.body.user).toMatchObject({
      email: "patient@example.test",
      role: "patient"
    });
    expect(registered.body.accessToken).toEqual(expect.any(String));
    expect(registered.body.user.twoFactorEnabled).toBe(false);

    const profile = await jsonRequest("/me/profile", {
      method: "PATCH",
      token: registered.body.accessToken,
      body: {
        fullName: "Анна Пациентова",
        birthDate: "1990-01-20",
        sex: "female",
        chronicConditions: ["гипотиреоз"],
        medications: ["левотироксин"]
      }
    });

    expect(profile.status).toBe(200);
    expect(profile.body.profile).toMatchObject({
      fullName: "Анна Пациентова",
      chronicConditions: ["гипотиреоз"]
    });

    const consents = await jsonRequest("/me/consents", {
      method: "PATCH",
      token: registered.body.accessToken,
      body: { personalData: true, medicalData: true }
    });

    expect(consents.status).toBe(200);
    expect(consents.body.consents).toMatchObject({
      personalData: true,
      medicalData: true,
      marketing: false
    });

    const refreshed = await jsonRequest("/auth/refresh", {
      method: "POST",
      body: { refreshToken: registered.body.refreshToken }
    });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).not.toBe(registered.body.accessToken);
  });

  it("adds secure response headers and rejects oversized JSON bodies", async () => {
    const health = await fetch(`${baseUrl}/health`);

    expect(health.headers.get("x-content-type-options")).toBe("nosniff");
    expect(health.headers.get("x-frame-options")).toBe("DENY");
    expect(health.headers.get("referrer-policy")).toBe("no-referrer");
    expect(health.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");

    const oversized = await jsonRequest("/auth/register", {
      method: "POST",
      body: { email: "large@example.test", password: "x".repeat(1_048_577) }
    });
    expect(oversized.status).toBe(422);
    expect(oversized.body.error).toBe("payload_too_large");
  });

  it("hashes passwords with salted PBKDF2 and rate-limits brute force logins", async () => {
    const registered = await jsonRequest("/auth/register", {
      method: "POST",
      body: { email: "rate-limit@example.test", password: "correct-password" }
    });
    expect(registered.status).toBe(201);

    const storedUser = [...store.users.values()].find(
      (user) => user.email === "rate-limit@example.test"
    );
    expect(storedUser?.passwordHash).toMatch(/^pbkdf2-sha512\$210000\$/);
    expect(storedUser?.passwordHash).not.toBe("correct-password");

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const failed = await jsonRequest("/auth/login", {
        method: "POST",
        body: { email: "rate-limit@example.test", password: "wrong-password" }
      });
      expect(failed.status).toBe(401);
    }

    const locked = await jsonRequest("/auth/login", {
      method: "POST",
      body: { email: "rate-limit@example.test", password: "wrong-password" }
    });
    expect(locked.status).toBe(429);
    expect(locked.body.error).toBe("too_many_login_attempts");
  });

  it("validates uploads, stores analysis metadata, supports history and reprocess flow", async () => {
    const registered = await registerPatient();

    const rejected = await jsonRequest("/analyses", {
      method: "POST",
      token: registered.accessToken,
      body: {
        title: "Too large",
        file: {
          originalName: "blood.pdf",
          mimeType: "application/pdf",
          sizeBytes: 21 * 1024 * 1024
        }
      }
    });
    expect(rejected.status).toBe(422);
    expect(rejected.body.error).toBe("unsupported_upload");

    const created = await jsonRequest("/analyses", {
      method: "POST",
      token: registered.accessToken,
      body: {
        title: "Общий анализ крови",
        file: {
          originalName: "blood.pdf",
          mimeType: "application/pdf",
          sizeBytes: 120_000
        }
      }
    });

    expect(created.status).toBe(201);
    expect(created.body.analysis).toMatchObject({
      title: "Общий анализ крови",
      status: "completed"
    });
    expect(created.body.analysis.files[0]).toMatchObject({
      originalName: "blood.pdf",
      mimeType: "application/pdf",
      extension: "pdf",
      encrypted: true,
      antivirusStatus: "clean"
    });
    expect(created.body.analysis.files[0].storageKey).toContain("s3+aes256://medical-analyses/");
    expect(created.body.analysis.files[0].storageKey).not.toContain("blood.pdf");
    expect(created.body.analysis.markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Гемоглобин",
          canonicalName: "hemoglobin",
          value: "118",
          status: "low",
          source: "ocr"
        }),
        expect.objectContaining({
          name: "Глюкоза",
          canonicalName: "glucose",
          value: "6.2",
          status: "high"
        })
      ])
    );
    expect(created.body.analysis.interpretation).toMatchObject({
      modelVersion: "rule-based-ai-adapter-v1",
      promptVersion: "stage-4-interpretation-v1",
      dictionaryVersion: "stage-4-rf-lab-v1",
      disclaimer: "Сервис не ставит диагноз и не заменяет консультацию врача."
    });

    const history = await jsonRequest("/analyses", {
      method: "GET",
      token: registered.accessToken
    });
    expect(history.status).toBe(200);
    expect(history.body.analyses).toHaveLength(1);

    const reprocessed = await jsonRequest(`/analyses/${created.body.analysis.id}/reprocess`, {
      method: "POST",
      token: registered.accessToken
    });
    expect(reprocessed.status).toBe(200);
    expect(reprocessed.body.analysis.status).toBe("completed");
  });

  it("accepts user marker corrections and recalculates interpretation", async () => {
    const registered = await registerPatient();
    const created = await createAnalysis(registered.accessToken);

    const corrected = await jsonRequest(`/analyses/${created.body.analysis.id}/corrections`, {
      method: "PATCH",
      token: registered.accessToken,
      body: {
        markers: [
          { name: "Гемоглобин", value: "132", unit: "г/л" },
          { name: "Глюкоза", value: "5.1", unit: "ммоль/л" }
        ]
      }
    });

    expect(corrected.status).toBe(200);
    expect(corrected.body.analysis.status).toBe("completed");
    expect(corrected.body.analysis.markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ canonicalName: "hemoglobin", status: "normal", source: "user" }),
        expect.objectContaining({ canonicalName: "glucose", status: "normal", source: "user" })
      ])
    );
    expect(corrected.body.analysis.interpretation.deviations).toEqual([]);
  });

  it("restricts admin APIs and exposes users, analyses, and audit log to admins", async () => {
    const patient = await registerPatient();
    const forbidden = await jsonRequest("/admin/users", {
      method: "GET",
      token: patient.accessToken
    });
    expect(forbidden.status).toBe(403);

    const adminRegistration = await jsonRequest("/auth/register", {
      method: "POST",
      body: { email: "admin@example.test", password: "admin-password", role: "admin" }
    });
    expect(adminRegistration.status).toBe(201);
    expect(adminRegistration.body.user.twoFactorEnabled).toBe(true);

    const users = await jsonRequest("/admin/users", {
      method: "GET",
      token: adminRegistration.body.accessToken
    });
    expect(users.status).toBe(200);
    expect(users.body.users.map((user: { email: string }) => user.email)).toEqual(
      expect.arrayContaining(["patient@example.test", "admin@example.test"])
    );

    const audit = await jsonRequest("/admin/audit-log", {
      method: "GET",
      token: adminRegistration.body.accessToken
    });
    expect(audit.status).toBe(200);
    expect(audit.body.auditLogs.map((entry: { action: string }) => entry.action)).toEqual(
      expect.arrayContaining(["user.registered"])
    );
  });

  async function registerPatient() {
    const response = await jsonRequest("/auth/register", {
      method: "POST",
      body: { email: "patient@example.test", password: "secret-password" }
    });
    return response.body as { accessToken: string; refreshToken: string };
  }

  async function createAnalysis(token: string) {
    return jsonRequest("/analyses", {
      method: "POST",
      token,
      body: {
        title: "Общий анализ крови",
        file: {
          originalName: "blood.pdf",
          mimeType: "application/pdf",
          sizeBytes: 120_000
        }
      }
    });
  }

  async function jsonRequest(
    path: string,
    options: { method: string; body?: unknown; token?: string }
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method,
      headers: {
        "content-type": "application/json",
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : {}
    };
  }
});
