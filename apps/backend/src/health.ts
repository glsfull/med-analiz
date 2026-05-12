import { serviceNames, type HealthStatus } from "@med-analiz/shared";

export function getHealthStatus(now = new Date()): HealthStatus {
  return {
    status: "ok",
    service: serviceNames.backend,
    checkedAt: now.toISOString()
  };
}
