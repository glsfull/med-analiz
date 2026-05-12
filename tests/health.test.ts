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
    const shell = renderShell();

    expect(shell).toContain("Мои Анализы");
    expect(shell).toContain('data-service="med-analiz-frontend"');
    expect(shell).toContain("Кабинет пациента");
    expect(shell).toContain("Перетащите PDF, JPEG, PNG, WebP или HEIC");
    expect(shell).toContain("Общий анализ крови");
    expect(shell).toContain("История анализов");
    expect(shell).toContain("Админ-панель");
    expect(shell).toContain("Согласие на обработку персональных данных");
    expect(shell).toContain("20 МБ");
  });
});
