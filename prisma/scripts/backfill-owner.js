// Script to backfill repository.ownerId based on project.group.leaderId
// Usage: node prisma/scripts/backfill-owner.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); 

async function main() {
  console.log('Starting backfill of repository ownerId...');
  const repos = await prisma.repository.findMany({
    include: { project: { include: { group: true } } }
  });

  for (const repo of repos) {
    if (!repo.ownerId) {
      const leaderId = repo.project?.group?.leaderId;
      if (leaderId) {
        console.log(`Updating ${repo.name} (${repo.id}) -> ownerId=${leaderId}`);
        await prisma.repository.update({
          where: { id: repo.id },
          data: { ownerId: leaderId }
        });
      } else {
        console.warn(`Skipped ${repo.id}: no group.leaderId available`);
      }
    }
  }

  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
