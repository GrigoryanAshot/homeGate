/**
 * Factory: generate FREE product IDs + secrets for sticker print run.
 *
 *   npx tsx scripts/factory-seed.ts 50
 *   npx tsx scripts/factory-seed.ts 50 --prefix HG
 *
 * Prints CSV: productId,secret,qr
 * Inserts FREE rows into the database.
 */
import { randomBytes } from "crypto";
import { prisma } from "../lib/db/client";
import { seedFactoryDevice } from "../lib/db/devices";

async function main() {
  const count = Math.max(1, Number(process.argv[2] || 10));
  const prefixIdx = process.argv.indexOf("--prefix");
  const prefix =
    prefixIdx >= 0 && process.argv[prefixIdx + 1]
      ? process.argv[prefixIdx + 1]
      : "HG";

  console.log(`productId,secret,qr`);
  for (let i = 0; i < count; i++) {
    const n = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
    const productId = `${prefix}-${n}`;
    const secret = randomBytes(9).toString("base64url");
    const qr = `smartgate://pair?id=${encodeURIComponent(productId)}&s=${encodeURIComponent(secret)}`;

    const result = await seedFactoryDevice(productId, secret);
    if (!result.created) {
      // collision — retry once with new id
      const n2 = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
      const productId2 = `${prefix}-${n2}`;
      const secret2 = randomBytes(9).toString("base64url");
      const qr2 = `smartgate://pair?id=${encodeURIComponent(productId2)}&s=${encodeURIComponent(secret2)}`;
      await seedFactoryDevice(productId2, secret2);
      console.log(`${productId2},${secret2},${qr2}`);
      continue;
    }
    console.log(`${productId},${secret},${qr}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
