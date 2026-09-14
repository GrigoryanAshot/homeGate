/**
 * Bind Ashot's ESP chip to demo-gate-001 + create bind offer (fixes claim-before-hello race).
 *
 *   npx tsx scripts/bind-chip-now.ts
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const DEVICE_ID = "demo-gate-001";
const SECRET = "secret-demo-001";
const CHIP_ID = "hg-98978472DA90";

async function main() {
  const updated = await p.device.update({
    where: { id: DEVICE_ID },
    data: {
      status: "BUSY",
      chipId: CHIP_ID,
      lastSeenAt: new Date(),
    },
  });

  await p.chipPending.deleteMany({ where: { chipId: CHIP_ID } });
  await p.chipBindOffer.upsert({
    where: { chipId: CHIP_ID },
    create: { chipId: CHIP_ID, productId: DEVICE_ID, secret: SECRET },
    update: {
      productId: DEVICE_ID,
      secret: SECRET,
      createdAt: new Date(),
    },
  });

  console.log("Bound chip → product:", {
    id: updated.id,
    name: updated.name,
    chipId: updated.chipId,
    status: updated.status,
  });
  console.log("ESP must subscribe:", `home/gate/${DEVICE_ID}/command`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
