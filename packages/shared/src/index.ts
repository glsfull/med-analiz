export const serviceNames = {
  backend: "med-analiz-backend",
  frontend: "med-analiz-frontend"
} as const;

export type ServiceName = (typeof serviceNames)[keyof typeof serviceNames];

export interface HealthStatus {
  status: "ok";
  service: ServiceName;
  checkedAt: string;
}
