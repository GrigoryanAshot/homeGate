/**
 * Factory: generate FREE numeric product IDs + secrets for sticker print.
 *
 *   npx tsx scripts/factory-seed.ts 100
 *   npx tsx scripts/factory-seed.ts 100 --digits 8
 *
 * IDs are random digits only (not sequential).
 * Prints CSV: productId,secret,qr
 */
import { randomBytes, randomInt } from "crypto";
import { prisma } from "../lib/db/client";
import { seedFactoryDevice } from "../lib/db/devices";

function randomNumericId(digits: number): string {
  // First digit 1–9 so it doesn't look like a padded sequence
  let id = String(randomInt(1, 10));
  for (let i = 1; i < digits; i++) {
    id += String(randomInt(0, 10));
  }
  return id;
}

async function main() {
  const count = Math.max(1, Number(process.argv[2] || 10));
  const digitsIdx = process.argv.indexOf("--digits");
  const digits = Math.min(
    12,
    Math.max(6, Number(digitsIdx >= 0 ? process.argv[digitsIdx + 1] : 8) || 8),
  );

  console.log(`productId,secret,qr`);
  for (let i = 0; i < count; i++) {
    let productId = randomNumericId(digits);
    let secret = randomBytes(9).toString("base64url");
    let result = await seedFactoryDevice(productId, secret);

    // Collision — retry a few times
    for (let attempt = 0; !result.created && attempt < 5; attempt++) {
      productId = randomNumericId(digits);
      secret = randomBytes(9).toString("base64url");
      result = await seedFactoryDevice(productId, secret);
    }

    const qr = `smartgate://pair?id=${encodeURIComponent(productId)}&s=${encodeURIComponent(secret)}`;
    console.log(`${productId},${secret},${qr}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
