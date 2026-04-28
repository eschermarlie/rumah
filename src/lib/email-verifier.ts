import { MxResolver } from "./mx-resolver";
import { smtpSession } from "./smtp-client";
import { Semaphore, Throttle } from "./concurrency";
import { DEFAULT_CONFIG, type VerifierConfig, type VerificationResult } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts[parts.length - 1].toLowerCase();
}

export class EmailVerifier {
  private config: VerifierConfig;
  private mxResolver: MxResolver;
  private semaphore: Semaphore;
  private throttle: Throttle;

  constructor(config?: Partial<VerifierConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.mxResolver = new MxResolver(this.config.mxCacheTtlMs);
    this.semaphore = new Semaphore(this.config.concurrency);
    this.throttle = new Throttle(this.config.throttleDelayMs);
  }

  async verify(email: string): Promise<VerificationResult> {
    const trimmed = email.trim().toLowerCase();
    const start = Date.now();

    if (!EMAIL_REGEX.test(trimmed)) {
      return {
        email: trimmed,
        status: "invalid",
        smtp_code: null,
        mx_record: "",
        logs: ["Invalid email format"],
        duration_ms: Date.now() - start,
        error: "Invalid email format",
      };
    }

    const domain = extractDomain(trimmed);

    await this.throttle.wait();

    const mxRecords = await this.mxResolver.resolve(domain);

    if (mxRecords.length === 0) {
      return {
        email: trimmed,
        status: "error",
        smtp_code: null,
        mx_record: "",
        logs: [`No MX records found for ${domain}`],
        duration_ms: Date.now() - start,
        error: `No MX records found for ${domain}`,
      };
    }

    for (const mx of mxRecords) {
      try {
        const result = await smtpSession({
          mxHost: mx.exchange,
          senderEmail: this.config.senderEmail,
          heloHostname: this.config.heloHostname,
          targetEmail: trimmed,
          domain,
          timeoutMs: this.config.timeoutMs,
          detectCatchAll: true,
        });
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (mx === mxRecords[mxRecords.length - 1]) {
          return {
            email: trimmed,
            status: "error",
            smtp_code: null,
            mx_record: mx.exchange,
            logs: [
              `All MX servers failed. Last error: ${msg}`,
            ],
            duration_ms: Date.now() - start,
            error: msg,
          };
        }
      }
    }

    return {
      email: trimmed,
      status: "error",
      smtp_code: null,
      mx_record: "",
      logs: ["No MX servers to try"],
      duration_ms: Date.now() - start,
      error: "No MX servers to try",
    };
  }

  async verifyBulk(
    emails: string[],
    onResult?: (result: VerificationResult, index: number) => void
  ): Promise<VerificationResult[]> {
    const results: VerificationResult[] = new Array(emails.length);

    const tasks = emails.map(async (email, index) => {
      const result = await this.semaphore.withLock(() => this.verify(email));
      results[index] = result;
      onResult?.(result, index);
      return result;
    });

    await Promise.all(tasks);
    return results;
  }

  clearMxCache(): void {
    this.mxResolver.clear();
  }
}
