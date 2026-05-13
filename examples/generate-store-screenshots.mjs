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
    subtitle: "Понятная расшифровка анализов и контроль здоровья",
    mode: "overview",
    size: { width: 800, height: 800 },
    highlights: ["AI-расшифровка", "Риски", "Напоминания"]
  },
  {
    slug: "risk-checkups",
    title: "Риски и чекапы",
    subtitle: "Видно, что важно обсудить с врачом",
    mode: "risk",
    size: { width: 591, height: 1280 },
    highlights: ["Отклонения", "План чекапов", "Вопросы врачу"]
  },
  {
    slug: "medication-reminders",
    title: "Лекарства",
    subtitle: "Напоминания по назначению врача",
    mode: "meds",
    size: { width: 591, height: 1280 },
    highlights: ["Принято", "Ожидает", "Push"]
  },
  {
    slug: "analysis-interpretation",
    title: "Расшифровка",
    subtitle: "Показатели, нормы и понятное резюме",
    mode: "analysis",
    size: { width: 591, height: 1280 },
    highlights: ["Нормы", "Отклонения", "PDF"]
  },
  {
    slug: "ai-assistant-agent-chat",
    title: "AI Ассистент",
    subtitle: "Ответы и действия агента в одном чате",
    mode: "chat",
    size: { width: 591, height: 1280 },
    highlights: ["Ответ AI", "Агент", "Действия"]
  }
];

const palette = {
  bgTop: "#07111f",
  bgBottom: "#102a3f",
  surface: "#ffffff",
  page: "#f8fafc",
  mint: "#22c55e",
  mintSoft: "#dcfce7",
  cyan: "#38bdf8",
  cyanSoft: "#e0f2fe",
  blue: "#2563eb",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  red: "#ef4444",
  redSoft: "#fee2e2",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0"
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrappedText(text, x, y, width, size, weight, color, lineHeight = 1.18) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  const maxChars = Math.max(8, Math.floor(width / (size * 0.54)));

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
    .slice(0, 4)
    .map(
      (part, index) =>
        `<text x="${x}" y="${y + index * size * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(part)}</text>`
    )
    .join("");
}

function pill(text, x, y, fill, color, width = 118) {
  return `<rect x="${x}" y="${y}" width="${width}" height="32" rx="16" fill="${fill}"/><text x="${x + 16}" y="${y + 21}" font-size="12" font-weight="800" fill="${color}">${esc(text)}</text>`;
}

function metricCard(label, value, status, x, y, fill, color) {
  return `<rect x="${x}" y="${y}" width="204" height="68" rx="18" fill="#fff" stroke="${palette.border}"/>
  <text x="${x + 16}" y="${y + 25}" font-size="13" font-weight="800" fill="${palette.text}">${esc(label)}</text>
  <text x="${x + 16}" y="${y + 49}" font-size="20" font-weight="900" fill="${palette.text}">${esc(value)}</text>
  <rect x="${x + 126}" y="${y + 20}" width="62" height="28" rx="14" fill="${fill}"/>
  <text x="${x + 139}" y="${y + 39}" font-size="10" font-weight="900" fill="${color}">${esc(status)}</text>`;
}

function phone(x, y, variant, mode, scale = 1) {
  const data = {
    risk: {
      title: "Риски",
      hero: "Средний",
      note: "3 пункта обсудить",
      rows: [
        ["Отклонения", "WBC", "важно", palette.redSoft, palette.red],
        ["Чекап", "30 дней", "план", palette.cyanSoft, palette.blue],
        ["Врач", "вопросы", "готово", palette.amberSoft, palette.amber]
      ]
    },
    meds: {
      title: "Лекарства",
      hero: "Сегодня",
      note: "по назначению врача",
      rows: [
        ["08:00", "принято", "ок", palette.mintSoft, palette.mint],
        ["14:00", "ожидает", "push", palette.cyanSoft, palette.blue],
        ["21:00", "напомнить", "план", palette.amberSoft, palette.amber]
      ]
    },
    analysis: {
      title: "ОАК",
      hero: "Готово",
      note: "информационная расшифровка",
      rows: [
        ["Гемоглобин", "165", "выше", palette.amberSoft, palette.amber],
        ["Лейкоциты", "15.2", "важно", palette.redSoft, palette.red],
        ["Тромбоциты", "246", "норма", palette.mintSoft, palette.mint]
      ]
    },
    chat: {
      title: "AI чат",
      hero: "Ассистент",
      note: "и агентские действия",
      rows: [
        ["Ответ", "справка", "AI", palette.cyanSoft, palette.blue],
        ["Агент", "вопросы", "готово", palette.mintSoft, palette.mint],
        ["Действие", "напомин.", "план", palette.amberSoft, palette.amber]
      ]
    },
    overview: {
      title: "Главная",
      hero: "Здоровье",
      note: "анализы под рукой",
      rows: [
        ["Загрузка", "PDF/фото", "20 МБ", palette.cyanSoft, palette.blue],
        ["AI-отчет", "готов", "ок", palette.mintSoft, palette.mint],
        ["Риск", "чекап", "план", palette.amberSoft, palette.amber]
      ]
    }
  }[mode];
  const chip = variant % 2 === 0 ? "Новый отчет" : "Профиль";

  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="-10" y="18" width="284" height="560" rx="46" fill="#020617" opacity="0.26"/>
    <rect width="264" height="548" rx="44" fill="#08111f"/>
    <rect x="13" y="15" width="238" height="518" rx="34" fill="${palette.page}"/>
    <rect x="91" y="29" width="82" height="8" rx="4" fill="#111827" opacity="0.18"/>
    <circle cx="44" cy="72" r="18" fill="${palette.mintSoft}"/>
    <text x="39" y="79" font-size="18" font-weight="900" fill="${palette.mint}">+</text>
    <text x="72" y="68" font-size="18" font-weight="900" fill="${palette.text}">${esc(data.title)}</text>
    <text x="72" y="88" font-size="11" font-weight="700" fill="${palette.muted}">${esc(chip)}</text>
    <rect x="26" y="116" width="212" height="118" rx="24" fill="#0f766e"/>
    <circle cx="204" cy="150" r="42" fill="#ffffff" opacity="0.12"/>
    <text x="46" y="158" font-size="16" font-weight="800" fill="#ccfbf1">${esc(data.note)}</text>
    <text x="46" y="195" font-size="32" font-weight="900" fill="#ffffff">${esc(data.hero)}</text>
    ${pill("без диагноза", 46, 212, "rgba(255,255,255,0.18)", "#ffffff", 120)}
    ${data.rows.map(([name, value, status, fill, color], index) => metricCard(name, value, status, 30, 260 + index * 82, fill, color)).join("")}
    <rect x="30" y="503" width="204" height="24" rx="12" fill="${palette.mint}"/>
  </g>`;
}

function renderSvg(group, variant) {
  const { width, height } = group.size;
  const isTall = height > 900;
  const offset = (variant - 3) * 8;
  const topPad = isTall ? 92 : 58;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${variant % 2 === 0 ? "#052e2b" : palette.bgTop}"/>
        <stop offset="0.56" stop-color="${palette.bgBottom}"/>
        <stop offset="1" stop-color="#0f172a"/>
      </linearGradient>
      <radialGradient id="glow" cx="35%" cy="20%" r="70%">
        <stop offset="0" stop-color="#34d399" stop-opacity="0.42"/>
        <stop offset="1" stop-color="#34d399" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#020617" flood-opacity="0.35"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)"/>
    <rect x="${width - 178}" y="${isTall ? 42 : 28}" width="116" height="116" rx="34" fill="#ffffff" opacity="0.10"/>
    <text x="40" y="${topPad}" font-size="${isTall ? 42 : 38}" font-weight="900" fill="#ffffff">${esc(group.title)}</text>
    ${wrappedText(group.subtitle, 40, topPad + (isTall ? 46 : 42), width - 92, isTall ? 24 : 21, 800, "#dbeafe", 1.24)}
    <g opacity="0.96">${group.highlights
      .map((item, index) =>
        pill(
          item,
          40 + (isTall ? 0 : index * 178),
          isTall ? 222 + index * 42 : 156,
          index === 1 ? "#dbeafe" : "rgba(255,255,255,0.14)",
          index === 1 ? palette.blue : "#ffffff",
          isTall ? 178 : 154
        )
      )
      .join("")}</g>
    <g filter="url(#shadow)">
    ${
      group.mode === "overview"
        ? `${phone(48 + offset, 250, variant, "analysis", 0.86)} ${phone(274 - offset, 286, variant, "risk", 0.86)} ${phone(500 + offset, 250, variant, "chat", 0.86)}`
        : phone(164 + offset, 360, variant, group.mode, 1)
    }
    </g>
    <rect x="40" y="${height - 118}" width="${width - 80}" height="76" rx="24" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.22)"/>
    <text x="64" y="${height - 84}" font-size="16" font-weight="900" fill="#ffffff">Информационно, не диагноз</text>
    <text x="64" y="${height - 58}" font-size="14" font-weight="700" fill="#cbd5e1">Решения по лечению принимает врач.</text>
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
