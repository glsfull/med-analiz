export const serviceNames = {
  backend: "med-analiz-backend",
  frontend: "med-analiz-frontend"
} as const;

export type ServiceName = (typeof serviceNames)[keyof typeof serviceNames];

export const uploadPolicy = {
  maxBytes: 20 * 1024 * 1024,
  extensions: ["pdf", "jpg", "jpeg", "png", "webp", "heic"],
  mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"]
} as const;

export const designTokens = {
  colors: {
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
    primary: "#059669",
    accent: "#2563eb",
    danger: "#dc2626"
  },
  radius: {
    sm: "6px",
    md: "8px",
    pill: "999px"
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "18px",
    xl: "24px"
  }
} as const;

export interface HealthStatus {
  status: "ok";
  service: ServiceName;
  checkedAt: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}
