import { serviceNames } from "@med-analiz/shared";

export function renderShell(): string {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Мои Анализы</title>
  </head>
  <body>
    <main>
      <h1>Мои Анализы</h1>
      <p data-service="${serviceNames.frontend}">Каркас frontend-приложения готов.</p>
    </main>
  </body>
</html>`;
}
