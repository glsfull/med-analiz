# Этап 5: безопасность и шифрование

Дата: 2026-05-12
Issue: https://github.com/glsfull/med-analiz/issues/17
PR: https://github.com/glsfull/med-analiz/pull/18

## Реализованный MVP-контур

- API выставляет базовые secure headers: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` и HSTS при HTTPS или dev.
- JSON body ограничен 1 МБ, загрузки анализов ограничены 20 МБ и проверяются по MIME + расширению.
- Пароли хэшируются через salted PBKDF2-SHA512 вместо простого SHA-256.
- Refresh token rotation уже используется, а неуспешные логины блокируются после 5 попыток на 15 минут.
- Админские API требуют роль `admin` и включенный флаг `twoFactorEnabled`.
- Метаданные файлов помечаются как зашифрованные, storage key больше не раскрывает оригинальное имя файла.
- Загрузки проходят через антивирусный статус. В текущем MVP это `stub-clean`, staging должен заменить его
  на ClamAV или managed scanner.
- Audit log фиксирует регистрацию, логины, refresh, действия с анализами и срабатывание brute-force защиты.

## Threat model

| Угроза                       | Риск                                     | Контроль                                                                  |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Перехват медицинских данных  | Раскрытие ПДн и медицинской тайны        | TLS termination, HSTS, запрет mixed deployment без HTTPS                  |
| Кража паролей из БД          | Массовый захват аккаунтов                | Salted PBKDF2-SHA512, secret manager для будущих pepper/JWT secrets       |
| Brute force админского входа | Захват админки                           | Login lockout, audit event, обязательный 2FA-флаг для admin API           |
| XSS/clickjacking             | Выполнение действий от лица пользователя | CSP `default-src 'none'`, `X-Frame-Options: DENY`, no-sniff               |
| Загрузка вредоносного файла  | Компрометация OCR/worker-инфраструктуры  | MIME/extension/size validation, antivirus status, изолированная обработка |
| Утечка имен файлов           | Раскрытие диагноза или ФИО из имени      | Randomized encrypted storage key                                          |
| IDOR доступа к анализам      | Чтение чужих результатов                 | Проверка ownerId на каждом endpoint анализа                               |
| Избыточный доступ админов    | Нецелевой просмотр медицинских данных    | RBAC, audit log, дальнейшее разделение ролей support/medical-editor       |

## Production gap list

- Завершить реальную TOTP/WebAuthn 2FA enrollment-flow для администраторов.
- Подключить persistent rate limiter в Redis, чтобы блокировки переживали рестарт процесса.
- Подключить managed TLS на ingress/load balancer и запретить прямой HTTP к backend.
- Реализовать envelope encryption для файлов и managed encryption для PostgreSQL/S3.
- Заменить `stub-clean` на ClamAV или managed malware scanning до приема реальных файлов.
- Добавить security review: dependency audit, OWASP ASVS checklist, ручной pentest auth/upload/admin API.
- Провести юридическую проверку 152-ФЗ/GDPR/HIPAA scope до production-запуска.
