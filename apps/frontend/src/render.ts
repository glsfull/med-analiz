import { serviceNames } from "@med-analiz/shared";

const statuses = ["uploaded", "OCR", "AI", "needs_review", "completed", "error"];

export function renderShell(): string {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Мои Анализы</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --surface: #ffffff;
        --surface-muted: #f1f5f9;
        --surface-soft: #f8fafc;
        --text: #0f172a;
        --muted: #64748b;
        --border: #e2e8f0;
        --border-strong: #cbd5e1;
        --primary: #059669;
        --primary-dark: #047857;
        --accent: #2563eb;
        --warn: #b45309;
        --danger: #dc2626;
        --ok: #15803d;
        --shadow: 0 1px 2px rgba(15, 23, 42, .06), 0 1px 3px rgba(15, 23, 42, .08);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      }

      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--text); font-size: 14px; }
      button, input, select { font: inherit; }
      button { cursor: pointer; }
      a { color: inherit; }
      .app { min-height: 100vh; display: grid; grid-template-columns: 280px minmax(0, 1fr); transition: grid-template-columns .2s ease; }
      .app.sidebar-collapsed { grid-template-columns: 76px minmax(0, 1fr); }
      .sidebar { position: sticky; top: 0; height: 100vh; background: var(--surface); border-right: 1px solid var(--border); padding: 12px; display: grid; grid-template-rows: auto 1fr auto; gap: 12px; overflow: hidden; }
      .sidebar-top { display: flex; align-items: center; gap: 10px; min-height: 44px; }
      .brand { display: flex; align-items: center; gap: 10px; min-width: 0; font-weight: 700; }
      .brand-mark { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; background: #dcfce7; color: var(--primary-dark); font-weight: 900; flex: 0 0 auto; }
      .brand span:last-child, .nav-label, .side-note, .workspace-meta, .user-details { transition: opacity .15s ease; }
      .sidebar-collapsed .brand span:last-child, .sidebar-collapsed .nav-label, .sidebar-collapsed .side-note, .sidebar-collapsed .workspace-meta, .sidebar-collapsed .user-details { opacity: 0; pointer-events: none; width: 0; overflow: hidden; }
      .collapse-toggle, .icon-btn { width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 8px; background: #fff; color: var(--muted); display: grid; place-items: center; flex: 0 0 auto; }
      .collapse-toggle:hover, .icon-btn:hover { color: var(--text); border-color: var(--border-strong); background: var(--surface-soft); }
      .nav { display: grid; align-content: start; gap: 4px; padding-top: 8px; }
      .nav button { min-height: 40px; border: 0; border-radius: 8px; background: transparent; color: #334155; padding: 9px 10px; text-align: left; display: flex; gap: 10px; align-items: center; font-weight: 600; }
      .nav button[aria-current="page"], .nav button:hover { background: var(--surface-muted); color: var(--text); }
      .nav-icon { width: 20px; text-align: center; color: var(--muted); flex: 0 0 auto; }
      .workspace { border-top: 1px solid var(--border); padding-top: 12px; display: grid; gap: 12px; }
      .workspace-card { display: flex; align-items: center; gap: 10px; min-height: 44px; }
      .side-note { color: var(--muted); font-size: 12px; line-height: 1.45; }
      .main { min-width: 0; display: grid; grid-template-rows: auto 1fr; }
      .topbar { min-height: 64px; background: rgba(255,255,255,.86); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 24px; position: sticky; top: 0; z-index: 2; }
      .topbar-title h1 { margin: 0; font-size: 18px; line-height: 1.2; }
      .topbar-title p { margin: 3px 0 0; color: var(--muted); font-size: 13px; }
      .command { min-width: 260px; max-width: 420px; flex: 1; border: 1px solid var(--border); background: var(--surface-soft); border-radius: 8px; height: 38px; display: flex; align-items: center; gap: 8px; padding: 0 12px; color: var(--muted); }
      .command input { border: 0; outline: 0; background: transparent; width: 100%; color: var(--text); }
      .top-actions { display: flex; align-items: center; gap: 8px; }
      .profile { display: flex; align-items: center; gap: 10px; border-left: 1px solid var(--border); padding-left: 12px; }
      .avatar { width: 34px; height: 34px; border-radius: 50%; background: #dcfce7; display: grid; place-items: center; font-weight: 800; color: var(--primary-dark); }
      .content { padding: 24px; display: grid; gap: 24px; }
      .view { display: none; }
      .view.active { display: grid; gap: 18px; }
      .grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, .85fr); gap: 18px; align-items: start; }
      .panel, .card, .metric { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow); }
      .panel { padding: 18px; }
      .panel h2, .panel h3 { margin: 0 0 12px; letter-spacing: 0; }
      .panel h2 { font-size: 17px; }
      .panel h3 { font-size: 15px; }
      .muted { color: var(--muted); }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 14px; }
      .metric { padding: 14px; }
      .metric strong { display: block; font-size: 24px; margin-bottom: 4px; }
      .dropzone { border: 1px dashed var(--border-strong); background: var(--surface-soft); border-radius: 8px; padding: 26px; display: grid; gap: 14px; text-align: center; min-height: 230px; place-items: center; }
      .dropzone.dragover { border-color: var(--primary); background: #ecfdf5; }
      .actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      .btn { border: 1px solid var(--border); border-radius: 8px; background: #fff; color: var(--text); padding: 9px 12px; font-weight: 700; min-height: 38px; }
      .btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
      .btn.danger { border-color: #fecaca; color: var(--danger); }
      .upload-feedback { min-height: 24px; font-weight: 700; }
      .upload-feedback.error { color: var(--danger); }
      .upload-feedback.ok { color: var(--ok); }
      .timeline { display: grid; gap: 10px; }
      .step { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: 8px; }
      .dot { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-muted); color: var(--muted); font-weight: 800; font-size: 12px; }
      .step.done .dot { background: #dcfce7; color: var(--ok); }
      .step.current .dot { background: #dbeafe; color: var(--accent); }
      .badge { display: inline-flex; align-items: center; min-height: 24px; border-radius: 999px; padding: 3px 9px; font-size: 12px; font-weight: 800; white-space: nowrap; }
      .badge.ok { color: var(--ok); background: #dcfce7; }
      .badge.warn { color: var(--warn); background: #fef3c7; }
      .badge.danger { color: var(--danger); background: #fee2e2; }
      .badge.info { color: var(--accent); background: #dbeafe; }
      .status-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
      .status-tabs button { border: 1px solid var(--border); border-radius: 999px; background: #fff; padding: 7px 10px; }
      .status-tabs button[aria-pressed="true"] { border-color: var(--primary); color: var(--primary-dark); background: #ecfdf5; }
      .report-head { display: flex; justify-content: space-between; gap: 14px; align-items: start; }
      .disclaimer { border-left: 3px solid var(--primary); background: #ecfdf5; padding: 12px 14px; border-radius: 6px; line-height: 1.5; }
      .summary-list { display: grid; gap: 10px; padding-left: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 11px 10px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
      th { color: var(--muted); font-size: 12px; font-weight: 800; }
      .history { display: grid; gap: 12px; margin-top: 14px; }
      .analysis-card { padding: 14px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; box-shadow: none; }
      .filters { display: flex; flex-wrap: wrap; gap: 10px; }
      .filters select, .filters input { border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; background: #fff; min-width: 150px; min-height: 38px; }
      .auth-grid, .admin-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
      .field { display: grid; gap: 7px; margin-bottom: 12px; }
      .field input, .field select { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; background: #fff; min-height: 38px; }
      .checkbox { display: flex; gap: 9px; align-items: flex-start; line-height: 1.4; }
      .admin-table { overflow-x: auto; }
      .mobile-menu { display: none; }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

      @media (max-width: 980px) {
        .app, .app.sidebar-collapsed { grid-template-columns: 1fr; }
        .sidebar { position: sticky; top: 0; z-index: 3; height: auto; grid-template-rows: auto auto; padding: 10px 16px; }
        .sidebar-top { justify-content: space-between; }
        .collapse-toggle { display: none; }
        .nav { display: flex; overflow-x: auto; padding: 4px 0 2px; }
        .nav button { white-space: nowrap; }
        .workspace { display: none; }
        .grid, .auth-grid, .admin-grid { grid-template-columns: 1fr; }
        .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .topbar { position: static; flex-wrap: wrap; padding: 14px 16px; }
        .command { order: 3; min-width: 100%; }
      }

      @media (max-width: 640px) {
        .profile { display: none; }
        .content { padding: 16px; }
        .metrics { grid-template-columns: 1fr; }
        .analysis-card, .step, .report-head { grid-template-columns: 1fr; display: grid; }
        th:nth-child(4), td:nth-child(4) { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="app" data-service="${serviceNames.frontend}">
      <aside class="sidebar" aria-label="Основная навигация">
        <div class="sidebar-top">
          <div class="brand"><span class="brand-mark" aria-hidden="true">+</span><span>Мои Анализы</span></div>
          <button class="collapse-toggle" id="sidebar-toggle" type="button" aria-label="Свернуть меню" aria-expanded="true">‹</button>
        </div>
        <nav class="nav">
          <button type="button" data-view-target="dashboard" aria-current="page"><span class="nav-icon" aria-hidden="true">□</span><span class="nav-label">Новый анализ</span></button>
          <button type="button" data-view-target="report"><span class="nav-icon" aria-hidden="true">▤</span><span class="nav-label">Результат</span></button>
          <button type="button" data-view-target="history"><span class="nav-icon" aria-hidden="true">◷</span><span class="nav-label">История</span></button>
          <button type="button" data-view-target="auth"><span class="nav-icon" aria-hidden="true">○</span><span class="nav-label">Профиль</span></button>
          <button type="button" data-view-target="admin"><span class="nav-icon" aria-hidden="true">⚙</span><span class="nav-label">Админ</span></button>
        </nav>
        <div class="workspace">
          <div class="workspace-card"><span class="avatar">АП</span><span class="workspace-meta">Анна Петрова<br /><small class="muted">beta, 2 из 5 анализов</small></span></div>
          <div class="side-note">Прототип работает на mock-данных. Интерпретация не является диагнозом и требует консультации врача.</div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="topbar-title">
            <h1>Кабинет пациента</h1>
            <p>Загрузка, расшифровка и история лабораторных анализов</p>
          </div>
          <label class="command" aria-label="Командная строка"><span aria-hidden="true">⌕</span><input type="search" placeholder="Поиск анализов, статусов, показателей" /></label>
          <div class="top-actions">
            <button class="icon-btn" type="button" aria-label="Уведомления">○</button>
            <button class="icon-btn" type="button" aria-label="Настройки">⚙</button>
            <div class="profile" aria-label="Текущий профиль"><span class="avatar">АП</span><span class="user-details">Анна Петрова<br /><small class="muted">пациент</small></span></div>
          </div>
        </header>
        <div class="content">
          <section id="dashboard" class="view active" aria-labelledby="dashboard-title">
            <div class="metrics" aria-label="Ключевые показатели">
              <div class="metric"><strong>3</strong><span class="muted">готовых отчета</span></div>
              <div class="metric"><strong>1</strong><span class="muted">требует проверки</span></div>
              <div class="metric"><strong>2 мин</strong><span class="muted">ожидаемая обработка</span></div>
              <div class="metric"><strong>20 МБ</strong><span class="muted">лимит файла</span></div>
            </div>
            <div class="grid">
              <section class="panel" aria-labelledby="dashboard-title">
                <h2 id="dashboard-title">Новый анализ</h2>
                <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Загрузить анализ перетаскиванием или выбором файла">
                  <div>
                    <h3>Перетащите PDF, JPEG, PNG, WebP или HEIC</h3>
                    <p class="muted">Файл до 20 МБ. Перед обработкой требуется согласие на работу с медицинскими данными.</p>
                    <div class="actions" style="justify-content:center">
                      <label class="btn primary" for="analysis-file">Выбрать файл</label>
                      <input class="sr-only" id="analysis-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic" />
                    </div>
                    <p id="upload-feedback" class="upload-feedback" aria-live="polite"></p>
                  </div>
                </div>
              </section>
              <section class="panel" aria-labelledby="processing-title">
                <div class="report-head"><h2 id="processing-title">Статус обработки</h2><span id="status-badge" class="badge info">OCR</span></div>
                <div class="status-tabs" aria-label="Mock статусы обработки">
                  ${statuses.map((status) => `<button type="button" data-status="${status}" aria-pressed="${status === "OCR" ? "true" : "false"}">${status}</button>`).join("")}
                </div>
                <div class="timeline" id="timeline">
                  <div class="step done" data-step="uploaded"><span class="dot">✓</span><div><strong>Файл принят</strong><br /><span class="muted">Проверены тип и размер</span></div><span class="badge ok">готово</span></div>
                  <div class="step current" data-step="OCR"><span class="dot">2</span><div><strong>OCR распознавание</strong><br /><span class="muted">Извлекаем показатели и референсы</span></div><span class="badge info">идет</span></div>
                  <div class="step" data-step="AI"><span class="dot">3</span><div><strong>AI-интерпретация</strong><br /><span class="muted">Готовим безопасное резюме</span></div><span class="badge">ожидает</span></div>
                  <div class="step" data-step="completed"><span class="dot">4</span><div><strong>Отчет</strong><br /><span class="muted">Таблица, отклонения и рекомендации</span></div><span class="badge">ожидает</span></div>
                </div>
              </section>
            </div>
          </section>

          <section id="report" class="view" aria-labelledby="report-title">
            <section class="panel">
              <div class="report-head"><div><h2 id="report-title">Общий анализ крови</h2><p class="muted">12.05.2026 · Лаборатория mock · confidence 91%</p></div><span class="badge ok">готов</span></div>
              <p class="disclaimer">Предварительная интерпретация помогает подготовиться к разговору с врачом, но не является диагнозом и не заменяет очную медицинскую консультацию.</p>
              <div class="grid">
                <div>
                  <h3>Резюме</h3>
                  <ul class="summary-list">
                    <li>2 показателя выше референса и 1 показатель ниже референса.</li>
                    <li>Критических значений на mock-данных не обнаружено.</li>
                    <li>Рекомендуется обсудить отклонения с терапевтом и учитывать симптомы.</li>
                  </ul>
                </div>
                <div class="panel" style="background:#f9fbfb">
                  <h3>Отклонения</h3>
                  <p><strong>Гемоглобин</strong> 165 г/л <span class="badge warn">выше нормы</span></p>
                  <p><strong>Лейкоциты</strong> 3.6 10^9/л <span class="badge warn">ниже нормы</span></p>
                </div>
              </div>
              <div class="admin-table" role="region" aria-label="Таблица показателей" tabindex="0">
                <table>
                  <thead><tr><th>Показатель</th><th>Значение</th><th>Ед.</th><th>Норма</th><th>Статус</th><th>Комментарий</th></tr></thead>
                  <tbody>
                    <tr><td>Гемоглобин</td><td>165</td><td>г/л</td><td>120-150</td><td><span class="badge warn">выше</span></td><td>Возможна связь с обезвоживанием или нагрузкой.</td></tr>
                    <tr><td>Лейкоциты</td><td>3.6</td><td>10^9/л</td><td>4.0-9.0</td><td><span class="badge warn">ниже</span></td><td>Требует сопоставления с симптомами и лекарствами.</td></tr>
                    <tr><td>Тромбоциты</td><td>246</td><td>10^9/л</td><td>150-400</td><td><span class="badge ok">норма</span></td><td>Без отклонений.</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="actions"><button class="btn primary" type="button">Исправить значения</button><button class="btn" type="button">Экспорт PDF</button></div>
            </section>
          </section>

          <section id="history" class="view" aria-labelledby="history-title">
            <section class="panel">
              <h2 id="history-title">История анализов</h2>
              <div class="filters" aria-label="Фильтры истории">
                <input type="search" placeholder="Поиск по названию" aria-label="Поиск по названию анализа" />
                <select aria-label="Тип анализа"><option>Все типы</option><option>ОАК</option><option>Биохимия</option></select>
                <select aria-label="Статус"><option>Все статусы</option><option>Готов</option><option>Ошибка</option><option>Проверка</option></select>
              </div>
              <div class="history">
                <article class="card analysis-card"><div><strong>Общий анализ крови</strong><br /><span class="muted">12.05.2026 · 3 отклонения · файл blood.pdf</span></div><button class="btn" data-view-target="report" type="button">Открыть</button></article>
                <article class="card analysis-card"><div><strong>Биохимия крови</strong><br /><span class="muted">02.04.2026 · ошибка OCR · можно повторить</span></div><button class="btn danger" type="button">Повторить</button></article>
                <article class="card analysis-card"><div><strong>Общий анализ крови</strong><br /><span class="muted">15.03.2026 · динамика гемоглобина доступна</span></div><button class="btn" type="button">Сравнить</button></article>
              </div>
            </section>
          </section>

          <section id="auth" class="view" aria-labelledby="auth-title">
            <div class="auth-grid">
              <section class="panel"><h2 id="auth-title">Вход</h2><label class="field">Email<input type="email" value="anna@example.test" /></label><label class="field">Пароль<input type="password" value="mock-password" /></label><button class="btn primary" type="button">Войти</button></section>
              <section class="panel"><h2>Профиль и согласия</h2><label class="field">Пол<select><option>Женский</option><option>Мужской</option></select></label><label class="field">Дата рождения<input type="date" value="1991-04-18" /></label><label class="checkbox"><input type="checkbox" checked /> Согласие на обработку персональных данных</label><label class="checkbox"><input type="checkbox" checked /> Отдельное согласие на обработку медицинских данных</label></section>
            </div>
          </section>

          <section id="admin" class="view" aria-labelledby="admin-title">
            <div class="admin-grid">
              <section class="panel"><h2 id="admin-title">Админ-панель</h2><div class="metrics"><div class="metric"><strong>42</strong><span class="muted">загрузки сегодня</span></div><div class="metric"><strong>4</strong><span class="muted">ошибки OCR</span></div></div></section>
              <section class="panel"><h2>Очередь проверки</h2><p><span class="badge warn">needs_review</span> Низкая уверенность по 2 показателям.</p><p><span class="badge danger">error</span> Не удалось прочитать скан PDF.</p></section>
            </div>
            <section class="panel admin-table"><h2>Справочник показателей</h2><table><thead><tr><th>Показатель</th><th>Синонимы</th><th>Единица</th><th>Версия</th></tr></thead><tbody><tr><td>Гемоглобин</td><td>Hb, HGB</td><td>г/л</td><td>2026.05</td></tr><tr><td>Лейкоциты</td><td>WBC</td><td>10^9/л</td><td>2026.05</td></tr></tbody></table></section>
          </section>
        </div>
      </main>
    </div>
    <script>
      const navButtons = document.querySelectorAll('[data-view-target]');
      const views = document.querySelectorAll('.view');
      navButtons.forEach((button) => button.addEventListener('click', () => {
        const target = button.getAttribute('data-view-target');
        views.forEach((view) => view.classList.toggle('active', view.id === target));
        document.querySelectorAll('.nav [data-view-target]').forEach((item) => item.removeAttribute('aria-current'));
        const navItem = document.querySelector('.nav [data-view-target="' + target + '"]');
        if (navItem) navItem.setAttribute('aria-current', 'page');
      }));

      const fileInput = document.getElementById('analysis-file');
      const feedback = document.getElementById('upload-feedback');
      const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic'];
      function validateFile(file) {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        const tooLarge = file.size > 20 * 1024 * 1024;
        feedback.className = 'upload-feedback ' + (!allowed.includes(ext) || tooLarge ? 'error' : 'ok');
        feedback.textContent = !allowed.includes(ext) ? 'Формат не поддерживается.' : tooLarge ? 'Файл больше 20 МБ.' : 'Файл принят: ' + file.name;
      }
      fileInput.addEventListener('change', () => validateFile(fileInput.files[0]));
      const dropzone = document.getElementById('dropzone');
      ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('dragover'); }));
      ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); }));
      dropzone.addEventListener('drop', (event) => validateFile(event.dataTransfer.files[0]));

      document.querySelectorAll('[data-status]').forEach((button) => button.addEventListener('click', () => {
        document.querySelectorAll('[data-status]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        document.getElementById('status-badge').textContent = button.dataset.status;
      }));

      const app = document.querySelector('.app');
      const sidebarToggle = document.getElementById('sidebar-toggle');
      sidebarToggle.addEventListener('click', () => {
        const collapsed = app.classList.toggle('sidebar-collapsed');
        sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
        sidebarToggle.setAttribute('aria-label', collapsed ? 'Развернуть меню' : 'Свернуть меню');
        sidebarToggle.textContent = collapsed ? '›' : '‹';
      });
    </script>
  </body>
</html>`;
}
