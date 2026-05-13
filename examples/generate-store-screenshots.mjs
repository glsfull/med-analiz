import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(rootDir, "docs/screenshots/store");

const groups = [
  {
    slug: "overview",
    title: "Мои Анализы",
    subtitle: "Понятная расшифровка анализов и контроль здоровья",
    mode: "overview",
    size: { width: 800, height: 800 },
    highlights: ["AI-расшифровка", "Оценка риска", "Напоминания", "История"]
  },
  {
    slug: "risk-checkups",
    title: "Оценка риска",
    subtitle: "Чекапы и отклонения без постановки диагноза",
    mode: "risk",
    size: { width: 591, height: 1280 },
    highlights: ["Риск-профиль", "План чекапов", "Что обсудить с врачом"]
  },
  {
    slug: "medication-reminders",
    title: "Напоминания",
    subtitle: "Прием лекарств по назначению врача",
    mode: "meds",
    size: { width: 591, height: 1280 },
    highlights: ["Принято", "Ожидает", "Push включен"]
  },
  {
    slug: "analysis-interpretation",
    title: "Расшифровка анализов",
    subtitle: "Показатели, нормы и безопасное резюме",
    mode: "analysis",
    size: { width: 591, height: 1280 },
    highlights: ["Гемоглобин", "Лейкоциты", "Экспорт PDF"]
  },
  {
    slug: "ai-assistant-agent-chat",
    title: "ИИ Ассистент",
    subtitle: "Ответы и агентские действия в одном чате",
    mode: "chat",
    size: { width: 591, height: 1280 },
    highlights: ["Спросить AI", "Сравнить динамику", "Создать напоминание"]
  }
];

const palette = {
  bg: "#f8fafc",
  surface: "#ffffff",
  soft: "#f1f5f9",
  primary: "#059669",
  primarySoft: "#dcfce7",
  accent: "#2563eb",
  accentSoft: "#dbeafe",
  warn: "#b45309",
  warnSoft: "#fef3c7",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0"
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function badge(text, x, y, fill = palette.primarySoft, color = palette.primary) {
  const width = Math.max(86, text.length * 8 + 26);
  return `<rect x="${x}" y="${y}" width="${width}" height="34" rx="17" fill="${fill}"/><text x="${x + 13}" y="${y + 23}" font-size="14" font-weight="800" fill="${color}">${esc(text)}</text>`;
}

function phone(x, y, variant, mode) {
  const rows = {
    risk: [
      ["Общий риск", "требует внимания", palette.warnSoft, palette.warn],
      ["Чекап", "через 30 дней", palette.accentSoft, palette.accent],
      ["Врач", "обсудить WBC", palette.dangerSoft, palette.danger]
    ],
    meds: [
      ["Утро", "принято", palette.primarySoft, palette.primary],
      ["День", "ожидает", palette.accentSoft, palette.accent],
      ["Вечер", "напомнить", palette.warnSoft, palette.warn]
    ],
    analysis: [
      ["Гемоглобин", "165 выше", palette.warnSoft, palette.warn],
      ["Лейкоциты", "15.2 критично", palette.dangerSoft, palette.danger],
      ["Тромбоциты", "246 норма", palette.primarySoft, palette.primary]
    ],
    chat: [
      ["Ассистент", "объяснил отклонения", palette.accentSoft, palette.accent],
      ["Агент", "создал вопросы врачу", palette.primarySoft, palette.primary],
      ["Агент", "сравнил динамику", palette.warnSoft, palette.warn]
    ],
    overview: [
      ["Загрузка", "20 МБ", palette.accentSoft, palette.accent],
      ["AI-отчет", "готов", palette.primarySoft, palette.primary],
      ["Риск", "чекап", palette.warnSoft, palette.warn]
    ]
  }[mode];

  return `
    <g transform="translate(${x} ${y})">
      <rect width="236" height="486" rx="34" fill="#0f172a"/>
      <rect x="12" y="14" width="212" height="458" rx="24" fill="${palette.bg}"/>
      <rect x="76" y="27" width="84" height="7" rx="4" fill="#cbd5e1"/>
      <circle cx="42" cy="64" r="18" fill="${palette.primarySoft}"/>
      <text x="37" y="71" font-size="18" font-weight="900" fill="${palette.primary}">+</text>
      <text x="68" y="61" font-size="16" font-weight="800" fill="${palette.text}">Мои Анализы</text>
      <text x="68" y="81" font-size="11" fill="${palette.muted}">вариант ${variant}</text>
      <rect x="28" y="108" width="180" height="82" rx="14" fill="${palette.surface}" stroke="${palette.border}"/>
      <text x="44" y="137" font-size="18" font-weight="900" fill="${palette.text}">${mode === "chat" ? "Чат" : mode === "meds" ? "Сегодня" : "ОАК"}</text>
      <text x="44" y="163" font-size="12" fill="${palette.muted}">Предварительная информация</text>
      ${rows
        .map(
          ([name, value, fill, color], index) => `
        <rect x="28" y="${214 + index * 72}" width="180" height="56" rx="12" fill="${palette.surface}" stroke="${palette.border}"/>
        <text x="44" y="${241 + index * 72}" font-size="14" font-weight="800" fill="${palette.text}">${esc(name)}</text>
        <rect x="120" y="${226 + index * 72}" width="74" height="28" rx="14" fill="${fill}"/>
        <text x="131" y="${245 + index * 72}" font-size="10" font-weight="800" fill="${color}">${esc(value)}</text>`
        )
        .join("")}
      <rect x="28" y="438" width="180" height="20" rx="10" fill="${palette.primary}"/>
    </g>`;
}

function renderSvg(group, variant) {
  const { width, height } = group.size;
  const headlineY = height > 900 ? 98 : 70;
  const phoneY = height > 900 ? 330 : 210;
  const disclaimerY = height - 104;
  const offset = (variant - 3) * 7;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${palette.bg}"/>
    <rect x="0" y="0" width="${width}" height="${Math.round(height * 0.33)}" fill="${variant % 2 === 0 ? palette.primarySoft : palette.accentSoft}"/>
    <circle cx="${width - 72}" cy="88" r="42" fill="${palette.surface}" opacity="0.82"/>
    <circle cx="68" cy="${height - 78}" r="44" fill="${palette.primarySoft}" opacity="0.75"/>
    <text x="40" y="${headlineY}" font-size="${height > 900 ? 44 : 36}" font-weight="900" fill="${palette.text}">${esc(group.title)}</text>
    <foreignObject x="40" y="${headlineY + 22}" width="${width - 80}" height="104">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:${height > 900 ? 25 : 20}px;line-height:1.28;color:${palette.muted};font-weight:700">${esc(group.subtitle)}</div>
    </foreignObject>
    ${group.highlights.map((item, index) => badge(item, 40 + index * (height > 900 ? 0 : 178), height > 900 ? 238 + index * 45 : 164, index === 1 ? palette.accentSoft : palette.surface, index === 1 ? palette.accent : palette.primary)).join("")}
    ${
      group.mode === "overview"
        ? `${phone(66 + offset, phoneY, variant, "analysis")} ${phone(282 - offset, phoneY + 42, variant, "risk")} ${phone(498 + offset, phoneY, variant, "chat")}`
        : phone(178 + offset, phoneY, variant, group.mode)
    }
    <rect x="40" y="${disclaimerY}" width="${width - 80}" height="64" rx="18" fill="${palette.surface}" stroke="${palette.border}"/>
    <text x="64" y="${disclaimerY + 27}" font-size="15" font-weight="800" fill="${palette.text}">Не является диагнозом</text>
    <text x="64" y="${disclaimerY + 49}" font-size="13" fill="${palette.muted}">Обсудите результаты и лечение с врачом.</text>
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
