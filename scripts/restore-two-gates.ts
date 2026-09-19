/**
 * Restore two separate gates (does NOT touch GateShare rows):
 *   Դարպաս 1 / demo-gate-001 → installed ESP (parents' shares stay)
 *   Դարպաս 2 / demo-gate-002 → hand ESP
 *
 *   npx tsx scripts/restore-two-gates.ts
 */
import fs from "fs";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!m || process.env[m[1]]) continue;
        let v = m[2].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    } catch {
      /* next */
    }
  }
}

loadEnv();

const OWNER_EMAIL = "ashotgrigoryan94@gmail.com";
const GATE1 = "demo-gate-001";
const GATE2 = "demo-gate-002";
const SECRET2 = "secret-demo-002";
const INSTALLED_CHIP = "hg-98978472DA90";
const HAND_CHIP = "hg-2C998472DA90";

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const p = new PrismaClient();
  try {
    const user = await p.user.findUnique({ where: { email: OWNER_EMAIL } });
    if (!user) throw new Error(`User not found: ${OWNER_EMAIL}`);

    // Clear chips first (unique constraint), then assign
    await p.device.update({
      where: { id: GATE1 },
      data: { chipId: null },
    });
    await p.device.update({
      where: { id: GATE2 },
      data: { chipId: null },
    });

    await p.device.update({
      where: { id: GATE1 },
      data: {
        status: "BUSY",
        ownerId: user.id,
        name: "Դարպաս 1",
        chipId: INSTALLED_CHIP,
        // keep original claimedAt — only set if null
        lastSeenAt: new Date(),
      },
    });

    await p.device.update({
      where: { id: GATE2 },
      data: {
        status: "BUSY",
        ownerId: user.id,
        name: "Դարպաս 2",
        chipId: HAND_CHIP,
        claimedAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    await p.chipPending.deleteMany({
      where: { chipId: { in: [HAND_CHIP, INSTALLED_CHIP] } },
    });

    await p.chipBindOffer.upsert({
      where: { chipId: HAND_CHIP },
      create: {
        chipId: HAND_CHIP,
        productId: GATE2,
        secret: SECRET2,
      },
      update: {
        productId: GATE2,
        secret: SECRET2,
        createdAt: new Date(),
      },
    });

    const devices = await p.device.findMany({
      where: { id: { in: [GATE1, GATE2] } },
      select: {
        id: true,
        name: true,
        chipId: true,
        status: true,
        ownerId: true,
        claimedAt: true,
      },
    });
    const shares = await p.gateShare.findMany({
      where: { deviceId: GATE1, revokedAt: null },
      select: { name: true, deviceId: true },
    });

    console.log("devices", devices);
    console.log("gate1 active shares (unchanged)", shares);
    console.log("");
    console.log("HAND ESP must leave demo-gate-001:");
    console.log("  Hold BOOT ~2s → SoftAP → set Wi‑Fi → wait for Product: demo-gate-002");
    console.log("  Or flash FW 2026-09-19-chip-rebind (auto-clears on wrong_chip).");
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
