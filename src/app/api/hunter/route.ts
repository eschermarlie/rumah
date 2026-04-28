import { EmailHunter, type HunterResult } from "@/lib/email-hunter";

export const dynamic = "force-dynamic";

const MAX_QUERIES = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body as { query?: string };

    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(
        JSON.stringify({ error: "Provide a 'query' string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const lines = query
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const unique = [...new Set(lines)].slice(0, MAX_QUERIES);

    if (unique.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid queries provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const hunter = new EmailHunter();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const close = () => {
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              // stream may already be closed
            }
          }
        };
        const send = (event: string, data: unknown) => {
          if (closed) return;
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              )
            );
          } catch {
            close();
          }
        };

        try {
          const allResults: HunterResult[] = [];
          const total = unique.length;

          console.log(`[Hunter API] Processing ${total} queries:`, unique);

          for (let i = 0; i < total; i++) {
            if (closed) break;

            const q = unique[i];
            const prefix =
              total > 1 ? `[${i + 1}/${total}] ` : "";

            console.log(`[Hunter API] Starting query ${i + 1}/${total}: ${q}`);

            try {
              const result = await hunter.find(q, (stageEvent) => {
                console.log(`[Hunter API] Stage: ${stageEvent.stage} — ${stageEvent.message}`);
                send("stage", {
                  ...stageEvent,
                  message: `${prefix}${stageEvent.message}`,
                });
              });

              console.log(`[Hunter API] Query ${i + 1}/${total} returned ${result.results.length} results`);
              allResults.push(...result.results);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Unknown error";
              console.error(`[Hunter API] Query ${i + 1}/${total} failed:`, message);
              send("stage", {
                stage: "error",
                message: `${prefix}Failed: ${message}`,
              });
            }
          }

          if (!closed) {
            send("results", { results: allResults });
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal error";
          console.error("[Hunter API] Unhandled error:", message, err);
          send("error", { error: message });
        } finally {
          close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
