const OWNER_STORAGE_KEY = "smartgate-owner-id";

/** Local stand-in for a real user account until auth ships. */
export function getOrCreateOwnerId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(OWNER_STORAGE_KEY);
    if (existing) return existing;
    const id = `owner-${crypto.randomUUID()}`;
    window.localStorage.setItem(OWNER_STORAGE_KEY, id);
    return id;
  } catch {
    return `owner-${Date.now()}`;
  }
}
