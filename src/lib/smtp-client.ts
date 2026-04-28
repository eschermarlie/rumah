import net from "node:net";
import type { SmtpResponse, VerificationResult, VerificationStatus } from "./types";

interface SmtpSessionOptions {
  mxHost: string;
  senderEmail: string;
  heloHostname: string;
  targetEmail: string;
  domain: string;
  timeoutMs: number;
  detectCatchAll: boolean;
}

function parseResponse(data: Buffer): SmtpResponse | null {
  const text = data.toString("utf-8").trim();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^(\d{3})\s?(.*)/);
    if (match) {
      return { code: parseInt(match[1], 10), text: match[2] };
    }
  }
  return null;
}

function classifyCode(code: number): VerificationStatus {
  switch (code) {
    case 250:
      return "valid";
    case 251:
    case 252:
      return "risky";
    case 450:
    case 452:
      return "risky";
    case 550:
    case 551:
    case 552:
    case 553:
      return "invalid";
    case 554:
      return "risky";
    case 421:
      return "error";
    default:
      if (code >= 200 && code < 300) return "valid";
      if (code >= 400 && code < 500) return "risky";
      if (code >= 500) return "invalid";
      return "error";
  }
}

function sendCommand(
  socket: net.Socket,
  command: string,
  timeoutMs: number
): Promise<SmtpResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to: ${command}`));
      socket.destroy();
    }, timeoutMs);

    const onData = (data: Buffer) => {
      clearTimeout(timer);
      socket.removeListener("data", onData);
      socket.removeListener("error", onError);
      const response = parseResponse(data);
      if (response) {
        resolve(response);
      } else {
        reject(new Error(`Could not parse SMTP response: ${data.toString("utf-8")}`));
      }
    };

    const onError = (err: Error) => {
      clearTimeout(timer);
      socket.removeListener("data", onData);
      reject(err);
    };

    socket.once("data", onData);
    socket.once("error", onError);
    socket.write(command + "\r\n");
  });
}

function connectToHost(
  host: string,
  port: number,
  timeoutMs: number
): Promise<{ socket: net.Socket; greeting: SmtpResponse }> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    const connectTimer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Connection timeout to ${host}:${port}`));
    }, timeoutMs);

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`Socket timeout to ${host}:${port}`));
    });

    socket.once("connect", () => {
      socket.removeListener("error", onError);
    });

    const onData = (data: Buffer) => {
      clearTimeout(connectTimer);
      socket.removeListener("data", onData);
      socket.removeListener("error", onError);
      const response = parseResponse(data);
      if (response && response.code === 220) {
        resolve({ socket, greeting: response });
      } else {
        socket.destroy();
        reject(
          new Error(
            `Unexpected greeting from ${host}: ${data.toString("utf-8")}`
          )
        );
      }
    };

    const onError = (err: Error) => {
      clearTimeout(connectTimer);
      socket.removeListener("data", onData);
      reject(err);
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.connect(port, host);
  });
}

export async function smtpSession(
  opts: SmtpSessionOptions
): Promise<VerificationResult> {
  const {
    mxHost,
    senderEmail,
    heloHostname,
    targetEmail,
    domain,
    timeoutMs,
    detectCatchAll,
  } = opts;

  const logs: string[] = [];
  const start = Date.now();
  let socket: net.Socket | null = null;
  let status: VerificationStatus = "error";
  let smtpCode: number | null = null;

  try {
    logs.push(`Connecting to ${mxHost}:25...`);
    const result = await connectToHost(mxHost, 25, timeoutMs);
    socket = result.socket;
    logs.push(`Connected (${result.greeting.code} ${result.greeting.text.trim()})`);

    logs.push(`EHLO ${heloHostname}`);
    const ehlo = await sendCommand(socket, `EHLO ${heloHostname}`, timeoutMs);
    logs.push(`EHLO response: ${ehlo.code}`);
    if (ehlo.code !== 250) {
      status = "error";
      smtpCode = ehlo.code;
      logs.push(`EHLO failed with ${ehlo.code}, trying HELO`);
      const helo = await sendCommand(socket, `HELO ${heloHostname}`, timeoutMs);
      logs.push(`HELO response: ${helo.code}`);
      if (helo.code !== 250) {
        status = "error";
        smtpCode = helo.code;
        return buildResult();
      }
    }

    logs.push(`MAIL FROM:<${senderEmail}>`);
    const mailFrom = await sendCommand(
      socket,
      `MAIL FROM:<${senderEmail}>`,
      timeoutMs
    );
    logs.push(`MAIL FROM response: ${mailFrom.code}`);
    smtpCode = mailFrom.code;
    if (mailFrom.code !== 250) {
      status = "error";
      logs.push(`MAIL FROM rejected: ${mailFrom.text.trim()}`);
      return buildResult();
    }

    logs.push(`RCPT TO:<${targetEmail}>`);
    const rcptTo = await sendCommand(
      socket,
      `RCPT TO:<${targetEmail}>`,
      timeoutMs
    );
    logs.push(`RCPT TO response: ${rcptTo.code}`);
    smtpCode = rcptTo.code;
    status = classifyCode(rcptTo.code);

    if (status === "valid" && detectCatchAll) {
      const randomLocal = `verify_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const probeEmail = `${randomLocal}@${domain}`;

      logs.push(`Catch-all probe: RCPT TO:<${probeEmail}>`);
      const probe = await sendCommand(
        socket,
        `RCPT TO:<${probeEmail}>`,
        timeoutMs
      );
      logs.push(`Probe response: ${probe.code}`);

      if (probe.code === 250) {
        status = "catch-all";
        logs.push("Domain is catch-all (accepted nonexistent address)");
      }
    }

    logs.push("QUIT");
    try {
      await sendCommand(socket, "QUIT", 5000);
      logs.push("QUIT ok");
    } catch {
      logs.push("QUIT failed (ignored)");
    }

    return buildResult();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logs.push(`Error: ${msg}`);
    status = "error";
    return buildResult();
  } finally {
    if (socket) {
      try {
        socket.destroy();
      } catch {
        // swallow
      }
    }
  }

  function buildResult(): VerificationResult {
    return {
      email: targetEmail,
      status,
      smtp_code: smtpCode,
      mx_record: mxHost,
      logs,
      duration_ms: Date.now() - start,
      ...(status === "error" ? { error: logs.find((l) => l.startsWith("Error:"))?.replace("Error: ", "") || "Unknown error" } : {}),
    };
  }
}
