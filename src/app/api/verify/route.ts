import { NextResponse } from "next/server";
import { EmailVerifier } from "@/lib/email-verifier";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emails, email } = body as { emails?: string[]; email?: string };

    let emailList: string[];
    if (emails && Array.isArray(emails)) {
      emailList = emails;
    } else if (email && typeof email === "string") {
      emailList = [email];
    } else {
      return NextResponse.json(
        { error: "Provide 'email' (string) or 'emails' (string[])" },
        { status: 400 }
      );
    }

    if (emailList.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 emails per request" },
        { status: 400 }
      );
    }

    const verifier = new EmailVerifier();
    const results = await verifier.verifyBulk(emailList);

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
