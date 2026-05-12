import { describe, expect, it } from "vitest";
import { getHealthStatus } from "../apps/backend/src/health.js";
import { renderAdminShell, renderLandingShell, renderShell } from "../apps/frontend/src/render.js";

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
    expect(shell).not.toContain('href="/admin"');
    expect(shell).not.toContain("Админ-кабинет");
    expect(shell).toContain("Свернуть меню");
    expect(shell).toContain("sidebar-collapsed");
    expect(shell).toContain("Поиск анализов, статусов, показателей");
    expect(shell).toContain("nav-icon");
    expect(shell).toContain("Перетащите PDF, JPEG, PNG, WebP или HEIC");
    expect(shell).toContain("Общий анализ крови");
    expect(shell).toContain("История анализов");
    expect(shell).not.toContain("Админ-панель");
    expect(shell).toContain("Согласие на обработку персональных данных");
    expect(shell).toContain("20 МБ");
  });

  it("renders the pre-registration landing page", () => {
    const shell = renderLandingShell();

    expect(shell).toContain("Главная страница до регистрации");
    expect(shell).toContain("Кабинет пациента");
    expect(shell).toContain("Кабинет администратора");
    expect(shell).toContain('href="/app"');
    expect(shell).toContain('href="/admin/site.ru"');
    expect(shell).toContain("Nuxt UI dashboard style");
  });

  it("renders a separate admin cabinet shell", () => {
    const shell = renderAdminShell();

    expect(shell).toContain("Кабинет администратора");
    expect(shell).toContain("Навигация администратора");
    expect(shell).toContain("закрытый кабинет");
    expect(shell).toContain("/admin/site.ru");
    expect(shell).toContain("Очередь проверки");
    expect(shell).toContain("Справочник показателей");
    expect(shell).toContain('href="/app"');
  });
});
