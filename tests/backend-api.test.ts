import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApiHandler } from "../apps/backend/src/api/http.js";
import { MemoryStore } from "../apps/backend/src/storage/memory-store.js";

describe("backend MVP API", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    const store = new MemoryStore(() => new Date("2026-05-12T12:00:00.000Z"));
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
      status: "uploaded"
    });
    expect(created.body.analysis.files[0]).toMatchObject({
      originalName: "blood.pdf",
      mimeType: "application/pdf",
      extension: "pdf"
    });
    expect(created.body.analysis.files[0].storageKey).toContain("s3://medical-analyses/");

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
    expect(reprocessed.body.analysis.status).toBe("ocr_pending");
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
