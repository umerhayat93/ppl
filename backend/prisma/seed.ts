import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Ensure LiveState row exists
  await prisma.liveState.upsert({
    where:  { id: 1 },
    create: { id: 1, data: null },
    update: {},
  });

  // Seed default ads
  const adsCount = await prisma.ad.count();
  if (adsCount === 0) {
    await prisma.ad.createMany({
      data: [
        { content: '🏏 Welcome to PPL 2026 — Pattan Premier League Official App!', sortOrder: 0 },
        { content: '📅 Matches scheduled at Pattan Cricket Ground, Kohistan KPK', sortOrder: 1 },
        { content: '🏆 T10 Format — Fast, Furious, and Exciting Cricket!', sortOrder: 2 },
      ],
    });
  }

  console.log('✅ Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
