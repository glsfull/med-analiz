export type UserRole = "patient" | "admin";

export interface UserProfile {
  fullName: string;
  birthDate: string;
  sex: "female" | "male" | "other" | "unknown";
  heightCm?: number;
  weightKg?: number;
  chronicConditions: string[];
  medications: string[];
}

export interface ConsentState {
  personalData: boolean;
  medicalData: boolean;
  marketing: boolean;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  profile: UserProfile;
  consents: ConsentState;
  createdAt: string;
  deletedAt?: string;
}

export interface AiSettings {
  provider: "rule-based" | "deepseek";
  apiKeyConfigured: boolean;
  apiKeyLast4?: string;
  model: string;
  updatedAt: string;
  updatedBy?: string;
}

export type AnalysisStatus =
  | "uploaded"
  | "ocr_pending"
  | "ai_pending"
  | "needs_review"
  | "completed"
  | "error";

export interface AnalysisFile {
  id: string;
  analysisId: string;
  ownerId: string;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  storageKey: string;
  encrypted: boolean;
  antivirusStatus: "pending" | "clean" | "infected";
  uploadedAt: string;
}

export interface ExtractedMarker {
  id: string;
  analysisId: string;
  name: string;
  canonicalName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status: "low" | "normal" | "high" | "critical" | "unknown";
  severity: "normal" | "attention" | "danger" | "critical" | "unknown";
  description: string;
  patientComment: string;
  confidence: number;
  source: "ocr" | "user";
}

export interface Interpretation {
  id: string;
  analysisId: string;
  summary: string;
  deviations: string[];
  normalMarkers: string[];
  possibleReasons: string[];
  recommendations: string[];
  urgentWarnings: string[];
  confidence: number;
  disclaimer: string;
  modelVersion: string;
  promptVersion: string;
  dictionaryVersion: string;
  createdAt: string;
}

export interface Analysis {
  id: string;
  ownerId: string;
  title: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  files: AnalysisFile[];
  markers: ExtractedMarker[];
  interpretation?: Interpretation;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  subjectType: "user" | "analysis" | "file" | "session";
  subjectId: string;
  createdAt: string;
  metadata: Record<string, string | number | boolean>;
}
