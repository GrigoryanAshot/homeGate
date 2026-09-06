import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hash(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

/** Demo factory units — QR payload: smartgate://pair?id=...&s=... */
const SEED = [
  {
    id: "demo-gate-001",
    secret: "secret-demo-001",
    status: "FREE",
    ownerId: null as string | null,
    name: null as string | null,
  },
  {
    id: "demo-gate-002",
    secret: "secret-demo-002",
    status: "FREE",
    ownerId: null,
    name: null,
  },
  {
    id: "demo-gate-busy",
    secret: "secret-demo-busy",
    status: "BUSY",
    ownerId: "other-owner",
    name: "Someone else's gate",
  },
];

async function main() {
  for (const row of SEED) {
    await prisma.device.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        secretHash: hash(row.secret),
        status: row.status,
        ownerId: row.ownerId,
        name: row.name,
        claimedAt: row.status === "BUSY" ? new Date() : null,
        lastSeenAt: new Date(),
      },
      update: {
        secretHash: hash(row.secret),
        status: row.status,
        ownerId: row.ownerId,
        name: row.name,
        claimedAt: row.status === "BUSY" ? new Date() : null,
        lastSeenAt: new Date(),
      },
    });
    console.log(
      `seed ${row.id} → ${row.status}  QR: smartgate://pair?id=${row.id}&s=${row.secret}`,
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
