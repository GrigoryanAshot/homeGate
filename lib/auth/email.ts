/**
 * Send login OTP via Resend.
 * Without RESEND_API_KEY, logs the code and returns it for local/dev UI.
 */
export async function sendLoginCodeEmail(
  email: string,
  code: string,
): Promise<{ ok: true; devCode?: string } | { ok: false }> {
  const from =
    process.env.AUTH_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Touch SmartGate <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY?.trim();

  // Unique subject so Gmail shows a new message (not only the first thread)
  const subject = `SmartGate login code: ${code}`;
  const text = `Your SmartGate login code is ${code}.\n\nIt expires in 10 minutes.\n\nIf you did not request this, ignore this email.`;
  const html = `<p>Your SmartGate login code is:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
<p>It expires in 10 minutes.</p>
<p style="color:#64748b;font-size:12px">If you did not request this, ignore this email.</p>`;

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
        html,
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
