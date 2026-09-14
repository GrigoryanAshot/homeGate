import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    select: { id: true, email: true, name: true },
  });
  const devices = await p.device.findMany({ orderBy: { updatedAt: "desc" } });
  const shares = await p.gateShare.findMany({ orderBy: { updatedAt: "desc" } });
  console.log("USERS\n", JSON.stringify(users, null, 2));
  console.log("DEVICES\n", JSON.stringify(devices, null, 2));
  console.log(
    "SHARES\n",
    JSON.stringify(
      shares.map((s) => ({
        id: s.id.slice(0, 12),
        deviceId: s.deviceId,
        name: s.name,
        revokedAt: s.revokedAt,
        updatedAt: s.updatedAt,
      })),
      null,
      2,
    ),
  );
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
