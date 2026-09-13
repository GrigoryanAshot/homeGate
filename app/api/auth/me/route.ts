import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import {
  getSessionUser,
  setSessionCookie,
} from "@/lib/auth/server";

export const runtime = "nodejs";

/** Fresh profile from DB (name can change after sign-in). */
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: true, user: null });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ ok: true, user: null });
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}

/** Update display name on the signed-in profile. */
export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "auth_required" },
      { status: 401 },
    );
  }

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 80);
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "name_required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: { name },
  });

  await setSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
