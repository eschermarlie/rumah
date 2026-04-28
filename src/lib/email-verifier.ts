export interface VerificationResult {
  email: string;
  status: "valid" | "invalid" | "catch-all" | "risky" | "error";
  smtp_code: number | null;
  mx_record: string;
  logs: string[];
  duration_ms: number;
  error?: string;
}

export class EmailVerifier {
  async verifyBulk(
    emails: string[],
    onProgress?: (result: VerificationResult, index: number) => void
  ): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const result: VerificationResult = {
        email,
        status: "error",
        smtp_code: null,
        mx_record: "",
        logs: ["Email verifier library is missing or deleted."],
        duration_ms: 0,
        error: "Implementation missing",
      };
      results.push(result);
      if (onProgress) {
        onProgress(result, i);
      }
    }
    return results;
  }
}
