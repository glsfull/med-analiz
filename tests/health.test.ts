import { describe, expect, it } from "vitest";
import { getHealthStatus } from "../apps/backend/src/health.js";
import { renderShell } from "../apps/frontend/src/render.js";

describe("stage 1 scaffold", () => {
  it("returns a stable backend health payload", () => {
    expect(getHealthStatus(new Date("2026-05-12T00:00:00.000Z"))).toEqual({
      status: "ok",
      service: "med-analiz-backend",
      checkedAt: "2026-05-12T00:00:00.000Z"
    });
  });

  it("renders the Russian frontend shell", () => {
    expect(renderShell()).toContain("Мои Анализы");
    expect(renderShell()).toContain('data-service="med-analiz-frontend"');
  });
});
