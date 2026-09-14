import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  console.log("pending", await p.chipPending.findMany());
  console.log("offers", await p.chipBindOffer.findMany());
  const d = await p.device.findUnique({ where: { id: "demo-gate-001" } });
  console.log("device", d);
}

main()
  .finally(() => p.$disconnect());
