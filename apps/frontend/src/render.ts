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
        --bg: #f6f8fb;
        --surface: #ffffff;
        --surface-soft: #eef4f2;
        --text: #17211f;
        --muted: #65726f;
        --border: #d9e1de;
        --brand: #147c72;
        --brand-dark: #0b504a;
        --accent: #c64b32;
        --warn: #b57900;
        --danger: #bd2d2d;
        --ok: #28724f;
        --info: #2f63a4;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
      }

      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--text); }
      button, input, select { font: inherit; }
      button { cursor: pointer; }
      a { color: inherit; }
      .app { min-height: 100vh; display: grid; grid-template-columns: 260px minmax(0, 1fr); }
      .sidebar { background: #132321; color: #edf7f5; padding: 24px 18px; display: flex; flex-direction: column; gap: 24px; }
      .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 21px; }
      .brand-mark { width: 38px; height: 38px; border-radius: 8px; display: grid; place-items: center; background: #dff1ed; color: var(--brand-dark); }
      .nav { display: grid; gap: 8px; }
      .nav button { border: 0; border-radius: 8px; background: transparent; color: #cce0dc; padding: 11px 12px; text-align: left; display: flex; gap: 10px; align-items: center; }
      .nav button[aria-current="page"], .nav button:hover { background: #24413d; color: #fff; }
      .side-note { margin-top: auto; padding: 14px; border: 1px solid #34534e; border-radius: 8px; color: #cce0dc; font-size: 13px; line-height: 1.45; }
      .main { min-width: 0; }
      .topbar { min-height: 76px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 28px; }
      .topbar h1 { margin: 0; font-size: 24px; }
      .topbar p { margin: 4px 0 0; color: var(--muted); }
      .profile { display: flex; align-items: center; gap: 12px; }
      .avatar { width: 42px; height: 42px; border-radius: 50%; background: #dceae7; display: grid; place-items: center; font-weight: 800; color: var(--brand-dark); }
      .content { padding: 28px; display: grid; gap: 28px; }
      .view { display: none; }
      .view.active { display: grid; gap: 22px; }
      .grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, .85fr); gap: 22px; align-items: start; }
      .panel, .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
      .panel { padding: 22px; }
      .panel h2, .panel h3 { margin: 0 0 14px; }
      .muted { color: var(--muted); }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 14px; }
      .metric { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
      .metric strong { display: block; font-size: 26px; margin-bottom: 4px; }
      .dropzone { border: 2px dashed #8ab7b0; background: var(--surface-soft); border-radius: 8px; padding: 28px; display: grid; gap: 14px; text-align: center; min-height: 230px; place-items: center; }
      .dropzone.dragover { border-color: var(--brand); background: #e0f3ef; }
      .actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      .btn { border: 1px solid var(--border); border-radius: 8px; background: #fff; color: var(--text); padding: 10px 14px; font-weight: 700; }
      .btn.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
      .btn.danger { border-color: #e1b3b3; color: var(--danger); }
      .upload-feedback { min-height: 24px; font-weight: 700; }
      .upload-feedback.error { color: var(--danger); }
      .upload-feedback.ok { color: var(--ok); }
      .timeline { display: grid; gap: 12px; }
      .step { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 13px; border: 1px solid var(--border); border-radius: 8px; }
      .dot { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: #e7eceb; color: var(--muted); font-weight: 800; }
      .step.done .dot { background: #d9efe6; color: var(--ok); }
      .step.current .dot { background: #dce8fa; color: var(--info); }
      .badge { display: inline-flex; align-items: center; min-height: 26px; border-radius: 999px; padding: 4px 9px; font-size: 12px; font-weight: 800; white-space: nowrap; }
      .badge.ok { color: var(--ok); background: #dff0e7; }
      .badge.warn { color: var(--warn); background: #fff0cf; }
      .badge.danger { color: var(--danger); background: #ffe0e0; }
      .badge.info { color: var(--info); background: #e2ecfb; }
      .status-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
      .status-tabs button { border: 1px solid var(--border); border-radius: 999px; background: #fff; padding: 7px 10px; }
      .status-tabs button[aria-pressed="true"] { border-color: var(--brand); color: var(--brand-dark); background: #dff1ed; }
      .report-head { display: flex; justify-content: space-between; gap: 14px; align-items: start; }
      .disclaimer { border-left: 4px solid var(--accent); background: #fff4ef; padding: 13px 14px; border-radius: 6px; line-height: 1.5; }
      .summary-list { display: grid; gap: 10px; padding-left: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 12px 10px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
      th { color: var(--muted); font-size: 13px; }
      .history { display: grid; gap: 12px; }
      .analysis-card { padding: 16px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; }
      .filters { display: flex; flex-wrap: wrap; gap: 10px; }
      .filters select, .filters input { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; background: #fff; min-width: 150px; }
      .auth-grid, .admin-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
      .field { display: grid; gap: 7px; margin-bottom: 12px; }
      .field input, .field select { border: 1px solid var(--border); border-radius: 8px; padding: 11px 12px; background: #fff; }
      .checkbox { display: flex; gap: 9px; align-items: flex-start; line-height: 1.4; }
      .admin-table { overflow-x: auto; }
      .mobile-menu { display: none; }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

      @media (max-width: 980px) {
        .app { grid-template-columns: 1fr; }
        .sidebar { position: sticky; top: 0; z-index: 2; padding: 14px 16px; }
        .nav { grid-template-columns: repeat(3, 1fr); }
        .side-note { display: none; }
        .grid, .auth-grid, .admin-grid { grid-template-columns: 1fr; }
        .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }

      @media (max-width: 640px) {
        .topbar { align-items: flex-start; padding: 16px; }
        .profile { display: none; }
        .content { padding: 16px; }
        .metrics { grid-template-columns: 1fr; }
        .nav { display: flex; overflow-x: auto; padding-bottom: 2px; }
        .nav button { white-space: nowrap; }
        .analysis-card, .step, .report-head { grid-template-columns: 1fr; display: grid; }
        th:nth-child(4), td:nth-child(4) { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="app" data-service="${serviceNames.frontend}">
      <aside class="sidebar" aria-label="Основная навигация">
        <div class="brand"><span class="brand-mark" aria-hidden="true">+</span><span>Мои Анализы</span></div>
        <nav class="nav">
          <button type="button" data-view-target="dashboard" aria-current="page">Новый анализ</button>
          <button type="button" data-view-target="report">Результат</button>
          <button type="button" data-view-target="history">История</button>
          <button type="button" data-view-target="auth">Профиль</button>
          <button type="button" data-view-target="admin">Админ</button>
        </nav>
        <div class="side-note">Прототип работает на mock-данных. Интерпретация не является диагнозом и требует консультации врача.</div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1>Кабинет пациента</h1>
            <p>Загрузка, расшифровка и история лабораторных анализов</p>
          </div>
          <div class="profile" aria-label="Текущий профиль"><span class="avatar">АП</span><span>Анна Петрова<br /><small class="muted">beta, 2 из 5 анализов</small></span></div>
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
    </script>
  </body>
</html>`;
}
