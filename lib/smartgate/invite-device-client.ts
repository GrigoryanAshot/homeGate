const INVITE_DEVICE_STORAGE_KEY = "smartgate-invite-device-id";

export function getOrCreateInviteDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(INVITE_DEVICE_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(INVITE_DEVICE_STORAGE_KEY, id);
  }
  return id;
}
