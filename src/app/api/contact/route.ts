import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/data/config";
import { isGmailAddress } from "@/lib/validation";

/* Sender must stay on resend.dev until a custom domain is verified with
   Resend; replies go to the submitter via replyTo. */
const FROM = "K-OS Comms <onboarding@resend.dev>";

export async function POST(req: Request) {
  let body: { name?: unknown; email?: unknown; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const payload = typeof body.payload === "string" ? body.payload.trim() : "";

  if (!name || !email || !payload) {
    return NextResponse.json(
      { ok: false, error: "name, email and payload are all required." },
      { status: 400 },
    );
  }
  if (!isGmailAddress(email)) {
    return NextResponse.json({ ok: false, error: "email must be a valid @gmail.com address." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Mail transport is not configured." },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: siteConfig.email,
    replyTo: email,
    subject: `[TRANSMISSION] from ${name}`,
    text: [
      "── INCOMING TRANSMISSION ──",
      "",
      `IDENTIFY_NAME:    ${name}`,
      `RETURN_FREQUENCY: ${email}`,
      "",
      "PAYLOAD:",
      payload,
      "",
      "── END OF TRANSMISSION ──",
    ].join("\n"),
  });

  if (error) {
    console.error("[api/contact] resend error:", error);
    return NextResponse.json({ ok: false, error: "Failed to send." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
