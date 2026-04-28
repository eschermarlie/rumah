"use client";

import { useState, useCallback } from "react";

interface HunterResult {
  email: string;
  name?: string;
  role?: string;
  linkedin_url?: string;
  source: string;
  confidence: "high" | "medium" | "low" | "inferred";
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
  inferred: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const STAGE_STEPS: { stage: string; label: string; model: string }[] = [
  { stage: "research", label: "Researching", model: "Gemini 2.5 Flash" },
  { stage: "patterns", label: "Generating patterns", model: "Llama 3.3 70B" },
  { stage: "formatting", label: "Formatting results", model: "Llama 4 Scout" },
  { stage: "done", label: "Done", model: "" },
];

function extractUrl(source: string): string | null {
  const match = source.match(/https?:\/\/[^\s,)"'>]+/);
  return match ? match[0] : null;
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function SourceDialog({
  result,
  onClose,
}: {
  result: HunterResult;
  onClose: () => void;
}) {
  const url = extractUrl(result.source);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Source Details
          </span>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Person
            </span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100">
              {result.name || "—"}{" "}
              {result.role && (
                <span className="text-zinc-500">({result.role})</span>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Email
            </span>
            <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
              {result.email}
            </span>
          </div>

          {result.linkedin_url && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                LinkedIn
              </span>
              <a
                href={result.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all hover:underline transition-colors inline-flex items-center gap-1.5"
              >
                <LinkedInIcon />
                {result.linkedin_url}
              </a>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Source
            </span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {result.source}
            </p>
          </div>

          {url && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Link
              </span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 break-all hover:underline transition-colors"
              >
                {url}
              </a>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Confidence
            </span>
            <span
              className={`inline-flex items-center w-fit rounded-md px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[result.confidence] || CONFIDENCE_STYLES.medium}`}
            >
              {result.confidence}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-zinc-100 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StageIndicator({
  currentStage,
  errorMessage,
}: {
  currentStage: string;
  errorMessage: string;
}) {
  const currentIndex = STAGE_STEPS.findIndex((s) => s.stage === currentStage);
  const isDone = currentStage === "done";
  const isError = currentStage === "error";

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center gap-3">
        {STAGE_STEPS.map((step, i) => {
          const isActive = i === currentIndex && !isDone && !isError;
          const isComplete = isDone || isError ? true : i < currentIndex;

          return (
            <div key={step.stage} className="flex items-center gap-3 flex-1">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isError
                        ? "bg-red-500 text-white"
                        : isComplete && !isError
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-blue-500 text-white animate-pulse"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                    }`}
                  >
                    {isError ? "✕" : isComplete && !isError ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium truncate ${
                      isError
                        ? "text-red-600 dark:text-red-400"
                        : isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : isComplete && !isError
                            ? "text-zinc-700 dark:text-zinc-300"
                            : "text-zinc-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {step.model && (
                  <span className="text-[10px] text-zinc-400 pl-7">
                    {step.model}
                  </span>
                )}
              </div>
              {i < STAGE_STEPS.length - 1 && (
                <div
                  className={`h-px w-6 shrink-0 ${
                    i < currentIndex
                      ? "bg-emerald-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {errorMessage && (
        <div className="mt-3 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

export default function HunterPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HunterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("");
  const [stageMessage, setStageMessage] = useState("");
  const [selectedResult, setSelectedResult] = useState<HunterResult | null>(
    null,
  );

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedResult(null);
    setStage("research");
    setStageMessage("");

    try {
      const response = await fetch("/api/hunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || `HTTP ${response.status}`);
        return;
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
          if (line.startsWith("event: ")) {
            continue;
          }
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.stage) {
                setStage(data.stage);
                setStageMessage(data.message || "");
                if (data.stage === "error") {
                  setError(data.message || "An error occurred");
                }
              }

              if (data.results) {
                setResults(data.results || []);
              }

              if (data.error) {
                setError(data.error);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const allEmails = results.map((r) => r.email).join("\n");

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="flex flex-col w-full max-w-4xl gap-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Email Hunter
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            3-stage AI pipeline: Gemini 2.5 Flash (research) → Llama 3.3 70B
            (pattern inference) → Llama 4 Scout (formatting)
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <textarea
            className="w-full h-32 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 resize-none"
            placeholder={
              "Examples:\n• CTO of Stripe\n• contact@linear.app\n• John Doe LinkedIn product manager at Notion\n• Vercel company email addresses"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="h-10 px-5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Find Emails"}
            </button>

            <span className="text-xs text-zinc-400">
              Press Ctrl+Enter to search
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && <StageIndicator currentStage={stage} errorMessage={stageMessage} />}

        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {results.length} email{results.length !== 1 ? "s" : ""} found
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(allEmails)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Copy all emails
              </button>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 text-left text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5 hidden sm:table-cell">Role</th>
                    <th className="px-4 py-2.5 hidden md:table-cell">LinkedIn</th>
                    <th className="px-4 py-2.5">Confidence</th>
                    <th className="px-4 py-2.5">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {results.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                        {r.email}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {r.name || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">
                        {r.role || "—"}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        {r.linkedin_url ? (
                          <a
                            href={r.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                          >
                            <LinkedInIcon />
                            {r.linkedin_url.includes("/in/")
                              ? r.linkedin_url.split("/in/")[1]?.split("?")[0]
                              : r.linkedin_url.includes("/company/")
                                ? r.linkedin_url.split("/company/")[1]?.split("?")[0]
                                : r.linkedin_url}
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[r.confidence] || CONFIDENCE_STYLES.medium}`}
                        >
                          {r.confidence}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setSelectedResult(r)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline truncate max-w-48 block transition-colors"
                          title="Click to view source details"
                        >
                          {r.source.length > 40
                            ? r.source.slice(0, 40) + "..."
                            : r.source}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedResult && (
        <SourceDialog
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}
