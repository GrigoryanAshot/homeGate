/**
 * Restore Ashot's working ESP (demo-gate-001) after accidental remove/reset confusion.
 * Does NOT wipe Wi‑Fi on the box — only cloud claim + display name.
 *
 *   npx tsx scripts/restore-gate1.ts
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const OWNER_EMAIL = "ashotgrigoryan94@gmail.com";
const DEVICE_ID = "demo-gate-001";
const DISPLAY_NAME = "Դարպաս 1";

async function main() {
  const user = await p.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!user) throw new Error(`User not found: ${OWNER_EMAIL}`);

  const device = await p.device.findUnique({ where: { id: DEVICE_ID } });
  if (!device) throw new Error(`Device not found: ${DEVICE_ID}`);

  const updated = await p.device.update({
    where: { id: DEVICE_ID },
    data: {
      status: "BUSY",
      ownerId: user.id,
      name: DISPLAY_NAME,
      claimedAt: device.claimedAt ?? new Date(),
      lastSeenAt: new Date(),
    },
  });

  // Un-revoke shares for this gate if any were soft-deleted
  const revived = await p.gateShare.updateMany({
    where: { deviceId: DEVICE_ID, revokedAt: { not: null } },
    data: { revokedAt: null },
  });

  console.log("Restored device:", {
    id: updated.id,
    name: updated.name,
    status: updated.status,
    ownerId: updated.ownerId,
    chipId: updated.chipId,
  });
  console.log("Shares un-revoked:", revived.count);
  console.log(
    "\nIf the box still will not open: it likely got WIFI_RESET (SoftAP).",
  );
  console.log("1) Join TouchGate-XXXX on phone");
  console.log("2) Open http://192.168.4.1 → pick home Wi‑Fi again");
  console.log("3) Soft refresh app — select Դարպաս 1 — Open");
  console.log("4) Re-share with parents (new invite links)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
