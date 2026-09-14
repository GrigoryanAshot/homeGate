/**
 * Make demo-gate-001 FREE again so Ashot can claim it via QR (production flow).
 *
 *   npx tsx scripts/prepare-demo-claim.ts
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const DEVICE_ID = "demo-gate-001";
const SECRET = "secret-demo-001";

async function main() {
  const before = await p.device.findUnique({ where: { id: DEVICE_ID } });
  if (!before) throw new Error(`Missing ${DEVICE_ID} — run prisma seed`);

  if (before.chipId) {
    await p.chipBindOffer.deleteMany({ where: { chipId: before.chipId } });
    await p.chipPending.deleteMany({ where: { chipId: before.chipId } });
  }

  await p.gateShare.updateMany({
    where: { deviceId: DEVICE_ID, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const updated = await p.device.update({
    where: { id: DEVICE_ID },
    data: {
      status: "FREE",
      ownerId: null,
      name: null,
      chipId: null,
      claimedAt: null,
      lastSeenAt: new Date(),
    },
  });

  const qr = `smartgate://pair?id=${DEVICE_ID}&s=${SECRET}`;
  console.log("Ready for QR claim:");
  console.log(JSON.stringify(updated, null, 2));
  console.log("\nQR / paste:");
  console.log(qr);
  console.log("\nOr open: https://1234-plum-nine.vercel.app/pair-qr-samples");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
