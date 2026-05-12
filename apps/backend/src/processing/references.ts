export interface MarkerReference {
  canonicalName: string;
  synonyms: string[];
  unit: string;
  min: number;
  max: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export const referenceDictionaryVersion = "stage-4-rf-lab-v1";

export const markerReferences: MarkerReference[] = [
  {
    canonicalName: "hemoglobin",
    synonyms: ["гемоглобин", "hemoglobin", "hgb", "hb"],
    unit: "г/л",
    min: 120,
    max: 160,
    criticalLow: 70,
    criticalHigh: 190
  },
  {
    canonicalName: "glucose",
    synonyms: ["глюкоза", "glucose"],
    unit: "ммоль/л",
    min: 3.9,
    max: 5.5,
    criticalLow: 2.8,
    criticalHigh: 13.9
  },
  {
    canonicalName: "leukocytes",
    synonyms: ["лейкоциты", "wbc", "leukocytes"],
    unit: "10^9/л",
    min: 4,
    max: 9,
    criticalLow: 1,
    criticalHigh: 30
  }
];

export function findReference(name: string): MarkerReference | undefined {
  const normalized = normalizeName(name);
  return markerReferences.find((reference) =>
    reference.synonyms.some((synonym) => normalizeName(synonym) === normalized)
  );
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
