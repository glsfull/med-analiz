import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(rootDir, "docs/screenshots/store");

const groups = [
  {
    slug: "overview",
    title: "Мои Анализы",
    subtitle: "анализы, риски, лекарства и AI чат в одном приложении",
    mode: "overview",
    size: { width: 800, height: 800 },
    accent: "#20c997"
  },
  {
    slug: "risk-checkups",
    title: "Оценка риска",
    subtitle: "понятные приоритеты и план чекапов",
    mode: "risk",
    size: { width: 591, height: 1280 },
    accent: "#ff6b6b"
  },
  {
    slug: "medication-reminders",
    title: "Напоминания",
    subtitle: "прием лекарств по расписанию врача",
    mode: "meds",
    size: { width: 591, height: 1280 },
    accent: "#51cf66"
  },
  {
    slug: "analysis-interpretation",
    title: "Расшифровка",
    subtitle: "показатели, нормы и простое резюме",
    mode: "analysis",
    size: { width: 591, height: 1280 },
    accent: "#4dabf7"
  },
  {
    slug: "ai-assistant-agent-chat",
    title: "AI Ассистент",
    subtitle: "ответы и агентские действия в одном чате",
    mode: "chat",
    size: { width: 591, height: 1280 },
    accent: "#9775fa"
  }
];

const palette = {
  ink: "#07111f",
  text: "#0f172a",
  muted: "#64748b",
  page: "#f6f8fb",
  surface: "#ffffff",
  border: "#dbe3ee",
  green: "#12b886",
  greenSoft: "#d3f9d8",
  blue: "#228be6",
  blueSoft: "#d0ebff",
  red: "#fa5252",
  redSoft: "#ffe3e3",
  amber: "#f08c00",
  amberSoft: "#fff3bf",
  violet: "#7950f2",
  violetSoft: "#e5dbff"
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function textBlock(text, x, y, width, size, weight, color, lineHeight = 1.16, limit = 4) {
  const words = String(text).split(" ");
  const maxChars = Math.max(8, Math.floor(width / (size * 0.52)));
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  return lines
    .slice(0, limit)
    .map(
      (part, index) =>
        `<text x="${x}" y="${y + index * size * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(part)}</text>`
    )
    .join("");
}

function capsule(label, x, y, width, fill, color) {
  return `<rect x="${x}" y="${y}" width="${width}" height="34" rx="17" fill="${fill}"/>
  <text x="${x + 16}" y="${y + 23}" font-size="13" font-weight="800" fill="${color}">${esc(label)}</text>`;
}

function row(label, value, status, x, y, width, fill, color, compact = false) {
  const height = compact ? 66 : 78;
  const icon = compact ? 15 : 18;
  const labelSize = compact ? 14 : 16;
  const valueSize = compact ? 11 : 13;
  const badgeWidth = compact ? 62 : 70;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" fill="${palette.surface}" stroke="${palette.border}"/>
  <circle cx="${x + 32}" cy="${y + height / 2}" r="${icon}" fill="${fill}"/>
  <text x="${x + 58}" y="${y + (compact ? 27 : 32)}" font-size="${labelSize}" font-weight="900" fill="${palette.text}">${esc(label)}</text>
  <text x="${x + 58}" y="${y + (compact ? 48 : 55)}" font-size="${valueSize}" font-weight="700" fill="${palette.muted}">${esc(value)}</text>
  <rect x="${x + width - badgeWidth - 20}" y="${y + (compact ? 18 : 24)}" width="${badgeWidth}" height="28" rx="14" fill="${fill}"/>
  <text x="${x + width - badgeWidth - 2}" y="${y + (compact ? 37 : 43)}" font-size="10" font-weight="900" fill="${color}">${esc(status)}</text>`;
}

function screenData(mode, variant) {
  const common = {
    overview: {
      label: "Главная",
      headline: variant % 2 === 0 ? "Все под контролем" : "Здоровье на экране",
      metric: "4 раздела",
      note: "последнее обновление сегодня",
      rows: [
        ["Расшифровка", "ОАК готов к просмотру", "AI", palette.blueSoft, palette.blue],
        ["Риски", "2 важных пункта", "план", palette.redSoft, palette.red],
        ["Лекарства", "следующий прием 14:00", "push", palette.greenSoft, palette.green]
      ]
    },
    risk: {
      label: "Чекапы",
      headline: variant % 2 === 0 ? "Средний риск" : "Нужен контроль",
      metric: "3 задачи",
      note: "обсудите с врачом",
      rows: [
        ["Лейкоциты", "показатель выше нормы", "важно", palette.redSoft, palette.red],
        ["Повторить ОАК", "через 7 дней", "чекап", palette.blueSoft, palette.blue],
        ["Вопросы врачу", "сформированы автоматически", "готово", palette.amberSoft, palette.amber]
      ]
    },
    meds: {
      label: "Лекарства",
      headline: variant % 2 === 0 ? "Прием сегодня" : "Не пропустите",
      metric: "2 из 3",
      note: "по назначению врача",
      rows: [
        ["08:00", "препарат принят", "ок", palette.greenSoft, palette.green],
        ["14:00", "напоминание включено", "push", palette.blueSoft, palette.blue],
        ["21:00", "ожидает приема", "план", palette.amberSoft, palette.amber]
      ]
    },
    analysis: {
      label: "Анализы",
      headline: variant % 2 === 0 ? "ОАК расшифрован" : "Понятное резюме",
      metric: "12 показ.",
      note: "информационная справка",
      rows: [
        ["Гемоглобин", "165 г/л", "выше", palette.amberSoft, palette.amber],
        ["Лейкоциты", "15.2 x10^9/л", "важно", palette.redSoft, palette.red],
        ["Тромбоциты", "246 x10^9/л", "норма", palette.greenSoft, palette.green]
      ]
    },
    chat: {
      label: "AI чат",
      headline: variant % 2 === 0 ? "Ассистент + агент" : "Один диалог",
      metric: "5 действий",
      note: "ответы и подготовка задач",
      rows: [
        ["AI ответ", "объяснил показатели", "чат", palette.blueSoft, palette.blue],
        ["Агент", "собрал вопросы врачу", "done", palette.greenSoft, palette.green],
        ["Действие", "создать напоминание", "план", palette.violetSoft, palette.violet]
      ]
    }
  };
  return common[mode];
}

function appPanel(x, y, width, height, mode, variant, accent) {
  const data = screenData(mode, variant);
  const rowWidth = width - 48;
  const compact = height < 500;
  const headerHeight = compact ? 118 : 154;
  const metricY = compact ? y + 154 : y + 200;
  const metricHeight = compact ? 72 : 118;
  const rowGap = compact ? 58 : 94;
  const rowStart = compact ? y + 236 : y + height - 290;
  const titleSize = compact ? 27 : 34;

  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${compact ? 30 : 36}" fill="${palette.page}" stroke="rgba(255,255,255,0.72)" stroke-width="2"/>
    <rect x="${x + 22}" y="${y + 22}" width="${width - 44}" height="${headerHeight}" rx="28" fill="${palette.ink}"/>
    <circle cx="${x + width - 72}" cy="${y + 68}" r="${compact ? 30 : 36}" fill="${accent}" opacity="0.2"/>
    <text x="${x + 46}" y="${y + 60}" font-size="${compact ? 16 : 18}" font-weight="900" fill="#b2f2bb">${esc(data.label)}</text>
    <text x="${x + 46}" y="${y + (compact ? 96 : 105)}" font-size="${titleSize}" font-weight="900" fill="#ffffff">${esc(data.headline)}</text>
    <text x="${x + 46}" y="${y + (compact ? 120 : 136)}" font-size="${compact ? 13 : 15}" font-weight="800" fill="#cbd5e1">${esc(data.note)}</text>
    <rect x="${x + 26}" y="${metricY}" width="${width - 52}" height="${metricHeight}" rx="${compact ? 24 : 30}" fill="${palette.surface}" stroke="${palette.border}"/>
  <text x="${x + 52}" y="${metricY + (compact ? 27 : 42)}" font-size="${compact ? 12 : 15}" font-weight="900" fill="${palette.muted}">Ключевой статус</text>
    <text x="${x + 52}" y="${metricY + (compact ? 58 : 92)}" font-size="${compact ? 29 : 44}" font-weight="900" fill="${palette.text}">${esc(data.metric)}</text>
    <path d="M ${x + width - 104} ${metricY + metricHeight - 32} C ${x + width - 78} ${metricY + 34}, ${x + width - 48} ${metricY + 54}, ${x + width - 30} ${metricY + 18}" fill="none" stroke="${accent}" stroke-width="${compact ? 6 : 8}" stroke-linecap="round"/>
    ${data.rows.map(([label, value, status, fill, color], index) => row(label, value, status, x + 24, rowStart + index * rowGap, rowWidth, fill, color, compact)).join("")}
    <rect x="${x + 64}" y="${y + height - 34}" width="${width - 128}" height="7" rx="4" fill="#cbd5e1"/>
  </g>`;
}

function renderSvg(group, variant) {
  const { width, height } = group.size;
  const tall = height > 900;
  const headlineSize = tall ? 48 : 42;
  const panelWidth = tall ? 470 : 590;
  const panelHeight = tall ? 610 : 380;
  const panelX = tall ? 60 : 105;
  const panelY = tall ? 410 : 260;
  const badgeY = tall ? 290 : 205;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#06141f"/>
        <stop offset="0.48" stop-color="#0b2a32"/>
        <stop offset="1" stop-color="#10251f"/>
      </linearGradient>
      <radialGradient id="wash" cx="30%" cy="10%" r="80%">
        <stop offset="0" stop-color="${group.accent}" stop-opacity="0.42"/>
        <stop offset="1" stop-color="${group.accent}" stop-opacity="0"/>
      </radialGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#020617" flood-opacity="0.34"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${height}" fill="url(#wash)"/>
    <circle cx="${width - 72}" cy="${tall ? 118 : 86}" r="${tall ? 70 : 56}" fill="#ffffff" opacity="0.08"/>
    <text x="${tall ? 44 : 54}" y="${tall ? 114 : 82}" font-size="17" font-weight="900" fill="#b2f2bb">Мои Анализы</text>
    ${textBlock(group.title, tall ? 44 : 54, tall ? 184 : 138, width - (tall ? 86 : 108), headlineSize, 900, "#ffffff", 1.08, 3)}
    ${textBlock(group.subtitle, tall ? 44 : 54, tall ? 258 : 190, width - (tall ? 86 : 108), tall ? 23 : 19, 800, "#d8f3dc", 1.24, 3)}
    ${capsule("современный интерфейс", tall ? 44 : 54, badgeY, tall ? 194 : 188, "rgba(255,255,255,0.14)", "#ffffff")}
    ${capsule("без лишних рамок", tall ? 254 : 260, badgeY, tall ? 162 : 164, "#d8f3dc", "#087f5b")}
    <g filter="url(#softShadow)">
      ${appPanel(panelX, panelY, panelWidth, panelHeight, group.mode, variant, group.accent)}
    </g>
    <rect x="${tall ? 44 : 54}" y="${height - (tall ? 80 : 54)}" width="${width - (tall ? 88 : 108)}" height="${tall ? 48 : 38}" rx="19" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.22)"/>
    <text x="${tall ? 68 : 78}" y="${height - (tall ? 50 : 30)}" font-size="${tall ? 14 : 12}" font-weight="900" fill="#ffffff">Информационно, не диагноз. Лечение назначает врач.</text>
  </svg>`;
}

function chromePath() {
  const candidates = ["google-chrome", "chromium", "chromium-browser"];
  for (const candidate of candidates) {
    const result = spawnSync("which", [candidate], { encoding: "utf8" });
    if (result.status === 0) return result.stdout.trim();
  }
  throw new Error("Chrome/Chromium is required to render screenshots.");
}

mkdirSync(outputDir, { recursive: true });
const chrome = chromePath();
const created = [];

for (const group of groups) {
  for (let variant = 1; variant <= 5; variant += 1) {
    const basename = `${group.slug}-${String(variant).padStart(2, "0")}`;
    const svgPath = resolve(outputDir, `${basename}.svg`);
    const pngPath = resolve(outputDir, `${basename}.png`);
    writeFileSync(svgPath, renderSvg(group, variant));
    const result = spawnSync(
      chrome,
      [
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        `--screenshot=${pngPath}`,
        `--window-size=${group.size.width},${group.size.height}`,
        `file://${svgPath}`
      ],
      { encoding: "utf8" }
    );
    if (result.status !== 0) {
      throw new Error(`Failed to render ${basename}: ${result.stderr || result.stdout}`);
    }
    created.push(pngPath);
  }
}

console.log(`Generated ${created.length} PNG screenshots in ${outputDir}`);
