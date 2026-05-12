# Этап 1: базовая архитектура и окружение

Дата: 2026-05-12
Issue: https://github.com/glsfull/med-analiz/issues/9
PR: https://github.com/glsfull/med-analiz/pull/10

## Структура

- `apps/frontend` - минимальный frontend shell для будущего web dashboard.
- `apps/backend` - минимальный backend health server и место для stateless API.
- `packages/shared` - общие типы и константы TypeScript.
- `infra` - инструкции и шаблоны переменных окружения для dev/staging.
- `.github/workflows/ci.yml` - базовая CI-проверка качества.

## Локальный запуск

1. Установить Node.js 22 и Docker.
2. Установить зависимости:

```bash
npm install
```

3. Скопировать `.env.example` в `.env` и при необходимости поменять порты/секреты.
4. Поднять PostgreSQL, Redis и S3-compatible storage:

```bash
docker compose up -d
```

5. Запустить приложения:

```bash
npm run dev
```

Backend health endpoint: `http://localhost:4000/health`.
Frontend shell: `http://localhost:3000`.

## Проверки

```bash
npm run lint
npm run format
npm run typecheck
npm run test
```

Или единая команда:

```bash
npm run check
```

## CI/CD baseline

GitHub Actions запускает установку зависимостей, lint, форматирование, typecheck и тесты для
pull request и push в `main` или `issue-9-f73d4b8a7aa7`.

Деплой dev/staging намеренно зафиксирован как следующий шаг: в репозитории пока нет целевого
провайдера и секретов. Для stage 1 подготовлены шаблоны переменных окружения, чтобы подключить
деплой без хранения секретов в git.
