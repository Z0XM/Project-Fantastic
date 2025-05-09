import { prisma } from '@/lib/prisma';

async function main() {
  console.info('Seeding database...');

  const businessList = await prisma.business.createMany({
    data: [{ name: 'Talent Monks' }, { name: 'Zepto' }, { name: 'Lenskart' }],
    skipDuplicates: true,
  });
  console.info(`Created ${businessList.count} businesses`);

  const users = await prisma.users.createMany({
    data: [
      { name: 'Kunal' },
      { name: 'Paresh' },
      { name: 'Saurabh' },
      { name: 'Nishit Khanna' },
      { name: 'Mukul' },
      { name: 'Anurag' },
      { name: 'Ishan' },
    ],
  });
  console.info(`Created ${users.count} users`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
