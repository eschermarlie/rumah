export type VerificationStatus =
  | "valid"
  | "invalid"
  | "catch-all"
  | "risky"
  | "error";

export interface VerificationResult {
  email: string;
  status: VerificationStatus;
  smtp_code: number | null;
  mx_record: string;
  logs: string[];
  duration_ms: number;
  error?: string;
}

export interface VerifierConfig {
  concurrency: number;
  throttleDelayMs: number;
  timeoutMs: number;
  senderEmail: string;
  heloHostname: string;
  mxCacheTtlMs: number;
}

export const DEFAULT_CONFIG: VerifierConfig = {
  concurrency: 5,
  throttleDelayMs: 500,
  timeoutMs: 15_000,
  senderEmail: process.env.SMTP_SENDER_EMAIL || "verifier@localhost",
  heloHostname: process.env.SMTP_HELO_HOSTNAME || "localhost",
  mxCacheTtlMs: 300_000,
};

export interface SmtpResponse {
  code: number;
  text: string;
}

export interface MxRecord {
  exchange: string;
  priority: number;
}
