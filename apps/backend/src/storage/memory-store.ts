import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type {
  Analysis,
  AuditLog,
  ConsentState,
  UserAccount,
  UserProfile,
  UserRole
} from "../domain/types.js";

export interface SessionPair {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export interface LoginGuardState {
  attempts: number;
  lockedUntil?: string;
}

export class MemoryStore {
  readonly users = new Map<string, UserAccount>();
  readonly analyses = new Map<string, Analysis>();
  readonly accessTokens = new Map<string, string>();
  readonly refreshTokens = new Map<string, string>();
  readonly auditLogs: AuditLog[] = [];
  readonly loginGuards = new Map<string, LoginGuardState>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  createUser(email: string, password: string, role: UserRole = "patient"): UserAccount {
    if ([...this.users.values()].some((user) => user.email === email && !user.deletedAt)) {
      throw new Error("email_already_registered");
    }

    const timestamp = this.now().toISOString();
    const user: UserAccount = {
      id: randomUUID(),
      email,
      passwordHash: this.hashPassword(password),
      role,
      twoFactorEnabled: role === "admin",
      profile: this.defaultProfile(),
      consents: this.defaultConsents(timestamp),
      createdAt: timestamp
    };
    this.users.set(user.id, user);
    this.writeAudit(user.id, "user.registered", "user", user.id, {});
    return user;
  }

  authenticate(email: string, password: string): SessionPair | undefined {
    const loginKey = email.toLowerCase();
    if (this.isLoginLocked(loginKey)) {
      this.writeAudit("system", "session.login_blocked", "session", loginKey, {
        reason: "brute_force_protection"
      });
      return undefined;
    }

    const user = [...this.users.values()].find(
      (candidate) => candidate.email === loginKey && !candidate.deletedAt
    );
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      this.recordFailedLogin(loginKey);
      return undefined;
    }

    this.loginGuards.delete(loginKey);
    const session = this.issueSession(user.id);
    this.writeAudit(user.id, "session.login", "session", user.id, {});
    return session;
  }

  issueSession(userId: string): SessionPair {
    const accessToken = randomUUID();
    const refreshToken = randomUUID();
    this.accessTokens.set(accessToken, userId);
    this.refreshTokens.set(refreshToken, userId);
    return { accessToken, refreshToken, userId };
  }

  rotateRefreshToken(refreshToken: string): SessionPair | undefined {
    const userId = this.refreshTokens.get(refreshToken);
    if (!userId) {
      return undefined;
    }
    this.refreshTokens.delete(refreshToken);
    const session = this.issueSession(userId);
    this.writeAudit(userId, "session.refresh", "session", userId, {});
    return session;
  }

  getUserByAccessToken(accessToken: string): UserAccount | undefined {
    const userId = this.accessTokens.get(accessToken);
    return userId ? this.users.get(userId) : undefined;
  }

  updateProfile(userId: string, profile: Partial<UserProfile>): UserProfile {
    const user = this.requireUser(userId);
    user.profile = { ...user.profile, ...profile };
    this.writeAudit(userId, "user.profile_updated", "user", userId, {});
    return user.profile;
  }

  updateConsents(userId: string, consents: Partial<Omit<ConsentState, "updatedAt">>): ConsentState {
    const user = this.requireUser(userId);
    user.consents = { ...user.consents, ...consents, updatedAt: this.now().toISOString() };
    this.writeAudit(userId, "user.consents_updated", "user", userId, {});
    return user.consents;
  }

  deleteAccount(userId: string): void {
    const user = this.requireUser(userId);
    user.deletedAt = this.now().toISOString();
    this.writeAudit(userId, "user.deleted", "user", userId, {});
  }

  addAnalysis(analysis: Analysis): Analysis {
    this.analyses.set(analysis.id, analysis);
    this.writeAudit(analysis.ownerId, "analysis.created", "analysis", analysis.id, {});
    return analysis;
  }

  writeAudit(
    actorId: string,
    action: string,
    subjectType: AuditLog["subjectType"],
    subjectId: string,
    metadata: AuditLog["metadata"]
  ): void {
    this.auditLogs.push({
      id: randomUUID(),
      actorId,
      action,
      subjectType,
      subjectId,
      metadata,
      createdAt: this.now().toISOString()
    });
  }

  private requireUser(userId: string): UserAccount {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("user_not_found");
    }
    return user;
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString("base64url");
    const hash = pbkdf2Sync(password, salt, 210_000, 32, "sha512").toString("base64url");
    return `pbkdf2-sha512$210000$${salt}$${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const [algorithm, iterations, salt, expected] = storedHash.split("$");
    if (algorithm !== "pbkdf2-sha512" || !iterations || !salt || !expected) {
      return false;
    }
    const candidate = pbkdf2Sync(password, salt, Number(iterations), 32, "sha512").toString(
      "base64url"
    );
    return (
      candidate.length === expected.length &&
      timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))
    );
  }

  private isLoginLocked(loginKey: string): boolean {
    const guard = this.loginGuards.get(loginKey);
    return Boolean(guard?.lockedUntil && Date.parse(guard.lockedUntil) > this.now().getTime());
  }

  private recordFailedLogin(loginKey: string): void {
    const current = this.loginGuards.get(loginKey) ?? { attempts: 0 };
    const attempts = current.attempts + 1;
    const lockedUntil =
      attempts >= 5 ? new Date(this.now().getTime() + 15 * 60 * 1000).toISOString() : undefined;
    this.loginGuards.set(loginKey, { attempts, lockedUntil });
  }

  private defaultProfile(): UserProfile {
    return {
      fullName: "",
      birthDate: "",
      sex: "unknown",
      chronicConditions: [],
      medications: []
    };
  }

  private defaultConsents(updatedAt: string): ConsentState {
    return {
      personalData: false,
      medicalData: false,
      marketing: false,
      updatedAt
    };
  }
}
