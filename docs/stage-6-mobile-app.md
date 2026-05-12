# Этап 6. Мобильное приложение

Дата: 2026-05-12.
Issue: #21.
PR: https://github.com/glsfull/med-analiz/pull/22.

## Сделано

- Добавлен первый PWA-слой для кабинета пациента: `manifest.webmanifest`, `sw.js`, установка на домашний экран и offline shell для `/app`.
- Добавлена базовая поддержка push-уведомлений: frontend запрашивает разрешение, backend принимает и удаляет push subscription для авторизованного пользователя.
- Оптимизирован мобильный upload-flow: отдельные входы для камеры, медиатеки и файлового хранилища, `capture="environment"` для съемки бланков, общий лимит и список форматов вынесены в shared package.
- В shared package вынесены первые design tokens и upload policy, чтобы web/PWA и будущий native-клиент не расходились в базовых правилах.

## React Native

Отдельное React Native приложение пока не требуется. Первый мобильный этап закрывает PWA, потому что продукту нужно быстро проверить загрузку анализов с телефона, уведомления о статусе и offline shell без поддержки двух кодовых баз.

Вернуться к React Native стоит после beta, если появятся подтвержденные требования:

- стабильная фоновая загрузка больших файлов;
- надежные push-уведомления на iOS/Android с собственными deep links;
- native camera preprocessing или document scanner;
- App Store / Google Play как основной канал привлечения.

## Проверка

- `npm run check`.
- Автотесты проверяют PWA manifest/service worker, мобильные upload controls и API push subscriptions.
