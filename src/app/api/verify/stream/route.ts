import { EmailVerifier } from "@/lib/email-verifier";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const emailsParam = searchParams.get("emails");

  if (!emailsParam) {
    return new Response("Missing 'emails' query parameter", { status: 400 });
  }

  const emails = emailsParam
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (emails.length === 0 || emails.length > 500) {
    return new Response("Provide 1-500 emails", { status: 400 });
  }

  const encoder = new TextEncoder();
  const verifier = new EmailVerifier();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(data));
      };

      send(`event: total\ndata: ${JSON.stringify({ total: emails.length })}\n\n`);

      try {
        await verifier.verifyBulk(emails, (result, index) => {
          send(
            `event: result\ndata: ${JSON.stringify({ index, ...result })}\n\n`
          );
        });
        send("event: done\ndata: {}\n\n");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send(
          `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`
        );
      } finally {
        controller.close();
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
}
