export interface MarkerReference {
  canonicalName: string;
  synonyms: string[];
  unit: string;
  min: number;
  max: number;
  criticalLow?: number;
  criticalHigh?: number;
  description: string;
  lowHint: string;
  highHint: string;
  criticalHint: string;
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
    criticalHigh: 190,
    description: "Гемоглобин переносит кислород от легких к тканям.",
    lowHint: "Снижение может встречаться при анемии, кровопотере или дефиците железа.",
    highHint: "Повышение иногда связано с обезвоживанием, нагрузкой или особенностями крови.",
    criticalHint: "Критическое отклонение гемоглобина требует срочной медицинской оценки."
  },
  {
    canonicalName: "glucose",
    synonyms: ["глюкоза", "glucose"],
    unit: "ммоль/л",
    min: 3.9,
    max: 5.5,
    criticalLow: 2.8,
    criticalHigh: 13.9,
    description: "Глюкоза отражает уровень сахара крови и обмен углеводов.",
    lowHint: "Снижение может быть связано с питанием, лекарствами или нарушением обмена.",
    highHint:
      "Повышение может встречаться после еды, при стрессе или нарушении углеводного обмена.",
    criticalHint: "Критическое значение глюкозы требует срочного обращения за медицинской помощью."
  },
  {
    canonicalName: "leukocytes",
    synonyms: ["лейкоциты", "wbc", "leukocytes"],
    unit: "10^9/л",
    min: 4,
    max: 9,
    criticalLow: 1,
    criticalHigh: 30,
    description: "Лейкоциты участвуют в иммунной защите организма.",
    lowHint:
      "Снижение может сопровождать вирусные инфекции, действие лекарств или нарушения кроветворения.",
    highHint:
      "Повышение часто бывает при воспалительном процессе, инфекции или выраженном стрессе.",
    criticalHint: "Критическое отклонение лейкоцитов требует срочной консультации врача."
  },
  {
    canonicalName: "platelets",
    synonyms: ["тромбоциты", "plt", "platelets"],
    unit: "10^9/л",
    min: 150,
    max: 400,
    criticalLow: 50,
    criticalHigh: 1000,
    description: "Тромбоциты помогают крови сворачиваться и участвуют в восстановлении сосудов.",
    lowHint: "Снижение может повышать риск кровоточивости и требует оценки врачом.",
    highHint:
      "Повышение может сопровождать воспаление, дефицит железа или восстановление после кровопотери.",
    criticalHint: "Критическое отклонение тромбоцитов требует срочной медицинской оценки."
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
