import { cookies } from "next/headers";
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
