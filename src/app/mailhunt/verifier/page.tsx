"use client";

import { useState, useCallback, useRef } from "react";

interface VerificationResult {
  email: string;
  status: "valid" | "invalid" | "catch-all" | "risky" | "error";
  smtp_code: number | null;
  mx_record: string;
  logs: string[];
  duration_ms: number;
  error?: string;
}

const STATUS_STYLES: Record<string, string> = {
  valid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  invalid: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "catch-all": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  risky: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  error: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function Home() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleVerify = useCallback(async () => {
    const emails = input
      .split("\n")
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    setResults([]);
    setLoading(true);
    setProgress({ done: 0, total: emails.length });
    setExpandedRow(null);

    abortRef.current = new AbortController();
    const controller = abortRef.current;

    try {
      const params = new URLSearchParams({ emails: emails.join(",") });
      const response = await fetch(`/api/verify/stream?${params}`, {
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.total !== undefined) {
                setProgress((p) => ({ ...p, total: data.total }));
              } else if (data.email) {
                setResults((prev) => {
                  const next = [...prev];
                  const idx = data.index ?? prev.length;
                  next[idx] = data;
                  return next;
                });
                setProgress((p) => ({ ...p, done: p.done + 1 }));
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input]);

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const validCount = results.filter((r) => r?.status === "valid").length;
  const invalidCount = results.filter((r) => r?.status === "invalid").length;
  const catchAllCount = results.filter((r) => r?.status === "catch-all").length;
  const riskyCount = results.filter((r) => r?.status === "risky").length;
  const errorCount = results.filter((r) => r?.status === "error").length;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="flex flex-col w-full max-w-4xl gap-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            SMTP Email Verifier
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Deep SMTP handshake verification with catch-all detection
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <textarea
            className="w-full h-48 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 resize-none font-mono"
            placeholder={"user@example.com\nanother@domain.com\n...\n\nOne email per line"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={loading || !input.trim()}
              className="h-10 px-5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? `Verifying... (${progress.done}/${progress.total})` : "Verify Emails"}
            </button>

            {loading && (
              <button
                onClick={handleAbort}
                className="h-10 px-5 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                Stop
              </button>
            )}

            {results.length > 0 && (
              <span className="ml-auto text-xs text-zinc-400">
                {results.length} results
              </span>
            )}
          </div>

          {loading && progress.total > 0 && (
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400">
                {validCount} valid
              </span>
              <span className="text-red-600 dark:text-red-400">
                {invalidCount} invalid
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {catchAllCount} catch-all
              </span>
              <span className="text-orange-600 dark:text-orange-400">
                {riskyCount} risky
              </span>
              <span className="text-zinc-500">
                {errorCount} error
              </span>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 text-left text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">SMTP</th>
                    <th className="px-4 py-2.5 hidden sm:table-cell">MX</th>
                    <th className="px-4 py-2.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {results.filter(Boolean).map((r, i) => (
                    <tr
                      key={i}
                      onClick={() =>
                        setExpandedRow(expandedRow === i ? null : i)
                      }
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                        {r.email}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] || STATUS_STYLES.error}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500 font-mono">
                        {r.smtp_code ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500 font-mono hidden sm:table-cell truncate max-w-48">
                        {r.mx_record || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500">
                        {r.duration_ms}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {expandedRow !== null && results[expandedRow] && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    SMTP Logs — {results[expandedRow].email}
                  </span>
                </div>
                <pre className="text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {results[expandedRow].logs.join("\n")}
                </pre>
                {results[expandedRow].error && (
                  <div className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium">
                    Error: {results[expandedRow].error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
