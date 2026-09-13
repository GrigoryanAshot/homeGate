/**
 * Send login OTP. Uses Resend when RESEND_API_KEY is set;
 * otherwise logs the code (local/dev) and returns it for the UI.
 */
export async function sendLoginCodeEmail(
  email: string,
  code: string,
): Promise<{ ok: true; devCode?: string } | { ok: false }> {
  const from =
    process.env.AUTH_EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "Touch SmartGate <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY?.trim();

  const subject = "Your SmartGate login code";
  const text = `Your SmartGate login code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`;

  if (!apiKey) {
    console.info(`[auth] Login code for ${email}: ${code}`);
    return { ok: true, devCode: code };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[auth] Resend failed", res.status, body);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[auth] Resend error", e);
    return { ok: false };
  }
}
