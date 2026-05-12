import { describe, expect, it } from "vitest";
import { getHealthStatus } from "../apps/backend/src/health.js";
import {
  renderAdminShell,
  renderLandingShell,
  renderManifest,
  renderSeoPageShell,
  renderServiceWorker,
  renderShell
} from "../apps/frontend/src/render.js";

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
    expect(shell).toContain("Переключить тему");
    expect(shell).toContain("сильно выше");
    expect(shell).toContain("Я всего лишь искусственный интеллект");
    expect(shell).toContain('rel="manifest"');
    expect(shell).toContain("serviceWorker");
    expect(shell).toContain("Включить уведомления");
    expect(shell).toContain('capture="environment"');
    expect(shell).toContain("Мобильные способы загрузки");
  });

  it("renders PWA manifest and service worker assets", () => {
    const manifest = JSON.parse(renderManifest()) as { start_url: string; display: string };
    const serviceWorker = renderServiceWorker();

    expect(manifest).toMatchObject({ start_url: "/app", display: "standalone" });
    expect(serviceWorker).toContain("CACHE_NAME");
    expect(serviceWorker).toContain("showNotification");
  });

  it("renders the pre-registration landing page", () => {
    const shell = renderLandingShell();

    expect(shell).toContain("Расшифровка медицинских анализов");
    expect(shell).toContain("Кабинет пациента");
    expect(shell).toContain("Кабинет администратора");
    expect(shell).toContain('href="/app"');
    expect(shell).toContain('href="/admin/site.ru"');
    expect(shell).toContain('href="/analizy-krovi"');
    expect(shell).toContain("application/ld+json");
  });

  it("renders a separate admin cabinet shell", () => {
    const shell = renderAdminShell();

    expect(shell).toContain("Кабинет администратора");
    expect(shell).toContain("Навигация администратора");
    expect(shell).toContain("закрытый кабинет");
    expect(shell).toContain("/admin/site.ru");
    expect(shell).toContain("Очередь проверки");
    expect(shell).toContain("Справочник показателей");
    expect(shell).toContain("AI советник");
    expect(shell).toContain("DeepSeek");
    expect(shell).toContain('href="/app"');
  });

  it("renders SEO medical analysis pages with breadcrumbs and schema markup", () => {
    const shell = renderSeoPageShell("blood");

    expect(shell).toContain("Расшифровка медицинских анализов крови");
    expect(shell).toContain("Хлебные крошки");
    expect(shell).toContain("MedicalWebPage");
    expect(shell).toContain("Лейкоциты");
  });
});
