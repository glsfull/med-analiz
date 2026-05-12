import { randomUUID } from "node:crypto";
import type { Analysis, ExtractedMarker, Interpretation, UserProfile } from "../domain/types.js";
import { findReference, referenceDictionaryVersion, type MarkerReference } from "./references.js";

export interface OcrProvider {
  readonly name: string;
  extractText(analysis: Analysis): Promise<{ text: string; confidence: number }>;
}

export interface AiProvider {
  readonly modelVersion: string;
  readonly promptVersion: string;
  interpret(input: {
    analysis: Analysis;
    markers: ExtractedMarker[];
    profile: UserProfile;
  }): Promise<unknown>;
}

export class FixtureOcrProvider implements OcrProvider {
  readonly name = "fixture-ocr-v1";

  async extractText(analysis: Analysis): Promise<{ text: string; confidence: number }> {
    const fileName = analysis.files[0]?.originalName.toLowerCase() ?? "";
    if (fileName.includes("empty")) {
      return { text: "", confidence: 0.1 };
    }
    return {
      text: [
        "Гемоглобин 118 г/л 120-160 L",
        "Глюкоза 6.2 ммоль/л 3.9-5.5 H",
        "Лейкоциты 7.1 10^9/л 4-9"
      ].join("\n"),
      confidence: 0.94
    };
  }
}

export class RuleBasedAiProvider implements AiProvider {
  readonly modelVersion = "rule-based-ai-adapter-v1";
  readonly promptVersion = "stage-4-interpretation-v1";

  async interpret(input: {
    analysis: Analysis;
    markers: ExtractedMarker[];
    profile: UserProfile;
  }): Promise<unknown> {
    const deviations = input.markers
      .filter((marker) => marker.status !== "normal")
      .map((marker) => `${marker.name}: ${marker.value}${marker.unit ? ` ${marker.unit}` : ""}`);
    return {
      summary:
        deviations.length > 0
          ? "Обнаружены отклонения в распознанных лабораторных показателях."
          : "Распознанные показатели находятся в пределах справочных значений.",
      deviations,
      recommendations: [
        "Проверьте результат с лечащим врачом с учетом симптомов, анамнеза и лекарств."
      ],
      confidence: averageConfidence(input.markers),
      disclaimer: "Сервис не ставит диагноз и не заменяет консультацию врача."
    };
  }
}

export async function runAnalysisPipeline(
  analysis: Analysis,
  profile: UserProfile,
  ocrProvider: OcrProvider,
  aiProvider: AiProvider,
  now: Date
): Promise<Analysis> {
  analysis.status = "ocr_pending";
  analysis.updatedAt = now.toISOString();
  const ocr = await ocrProvider.extractText(analysis);
  const markers = extractMarkers(analysis.id, ocr.text, ocr.confidence);
  analysis.markers = markers;
  analysis.status = markers.some((marker) => marker.confidence < 0.75)
    ? "needs_review"
    : "ai_pending";
  analysis.updatedAt = now.toISOString();

  const aiResponse = await aiProvider.interpret({ analysis, markers, profile });
  analysis.interpretation = validateAiResponse(aiResponse, analysis.id, aiProvider, now);
  analysis.status = analysis.status === "needs_review" ? "needs_review" : "completed";
  analysis.updatedAt = now.toISOString();
  return analysis;
}

export async function recalculateInterpretation(
  analysis: Analysis,
  profile: UserProfile,
  aiProvider: AiProvider,
  now: Date
): Promise<Analysis> {
  const aiResponse = await aiProvider.interpret({ analysis, markers: analysis.markers, profile });
  analysis.interpretation = validateAiResponse(aiResponse, analysis.id, aiProvider, now);
  analysis.status = "completed";
  analysis.updatedAt = now.toISOString();
  return analysis;
}

export function applyMarkerCorrections(
  analysis: Analysis,
  corrections: Array<{ name: string; value: string; unit?: string }>,
  now: Date
): void {
  analysis.markers = corrections.map((correction) =>
    createMarker(analysis.id, correction.name, correction.value, correction.unit, 1, "user")
  );
  analysis.status = "ai_pending";
  analysis.updatedAt = now.toISOString();
}

function extractMarkers(analysisId: string, text: string, confidence: number): ExtractedMarker[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s+(-?\d+(?:[.,]\d+)?)\s+(.+?)(?:\s+\d|$)/);
      if (!match) {
        return createMarker(analysisId, line, "", undefined, 0.4, "ocr");
      }
      return createMarker(
        analysisId,
        match[1] ?? line,
        (match[2] ?? "").replace(",", "."),
        normalizeUnit(match[3] ?? undefined),
        confidence,
        "ocr"
      );
    });
}

function createMarker(
  analysisId: string,
  name: string,
  value: string,
  unit: string | undefined,
  confidence: number,
  source: ExtractedMarker["source"]
): ExtractedMarker {
  const reference = findReference(name);
  const numericValue = Number(value);
  return {
    id: randomUUID(),
    analysisId,
    name: name.trim(),
    canonicalName: reference?.canonicalName ?? name.trim().toLowerCase(),
    value,
    unit: unit ?? reference?.unit,
    referenceRange: reference ? `${reference.min}-${reference.max} ${reference.unit}` : undefined,
    status:
      reference && Number.isFinite(numericValue) ? classify(numericValue, reference) : "unknown",
    confidence,
    source
  };
}

function classify(value: number, reference: MarkerReference): ExtractedMarker["status"] {
  if (
    (reference.criticalLow !== undefined && value <= reference.criticalLow) ||
    (reference.criticalHigh !== undefined && value >= reference.criticalHigh)
  ) {
    return "critical";
  }
  if (value < reference.min) {
    return "low";
  }
  if (value > reference.max) {
    return "high";
  }
  return "normal";
}

function validateAiResponse(
  value: unknown,
  analysisId: string,
  provider: AiProvider,
  now: Date
): Interpretation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid_ai_response");
  }
  const body = value as Record<string, unknown>;
  if (
    typeof body.summary !== "string" ||
    !Array.isArray(body.deviations) ||
    !Array.isArray(body.recommendations) ||
    typeof body.confidence !== "number" ||
    typeof body.disclaimer !== "string"
  ) {
    throw new Error("invalid_ai_response");
  }
  return {
    id: randomUUID(),
    analysisId,
    summary: body.summary,
    deviations: body.deviations.map(String),
    recommendations: body.recommendations.map(String),
    confidence: body.confidence,
    disclaimer: body.disclaimer,
    modelVersion: provider.modelVersion,
    promptVersion: provider.promptVersion,
    dictionaryVersion: referenceDictionaryVersion,
    createdAt: now.toISOString()
  };
}

function normalizeUnit(unit: string | undefined): string | undefined {
  return unit?.replace(/\s+/g, " ").trim();
}

function averageConfidence(markers: ExtractedMarker[]): number {
  if (markers.length === 0) {
    return 0;
  }
  return Number(
    (markers.reduce((sum, marker) => sum + marker.confidence, 0) / markers.length).toFixed(2)
  );
}
