import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  sessionCookieName,
  sessionCookieOptions,
  verifySessionToken,
  type SessionUser,
} from "./session";

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Prefer setting cookies on the response (reliable in App Router route handlers). */
export function withSessionCookie(res: NextResponse, user: SessionUser) {
  res.cookies.set(
    sessionCookieName(),
    createSessionToken(user),
    sessionCookieOptions(),
  );
  return res;
}

export function withClearedSessionCookie(res: NextResponse) {
  res.cookies.set(sessionCookieName(), "", sessionCookieOptions(0));
  return res;
}

/** @deprecated use withSessionCookie on the response */
export async function setSessionCookie(user: SessionUser) {
  const jar = await cookies();
  jar.set(
    sessionCookieName(),
    createSessionToken(user),
    sessionCookieOptions(),
  );
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(sessionCookieName(), "", sessionCookieOptions(0));
}
