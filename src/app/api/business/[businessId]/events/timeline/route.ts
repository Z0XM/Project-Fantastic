import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;

  const rounds = await prisma.rounds.findMany({
    where: {
      businessId: businessId,
    },
  });

  const businessEvents = await prisma.businessEvents.findMany({
    where: {
      businessId: businessId,
    },
  });

  const businessEventsByDate: { [key: string]: typeof businessEvents } = {};
  businessEvents.forEach((event) => {
    const date = event.createdAt.toTimeString();
    if (!businessEventsByDate[date]) {
      businessEventsByDate[date] = [];
    }
    businessEventsByDate[date].push(event);
  });

  const investments = await prisma.investments.findMany({
    where: {
      roundId: {
        in: rounds.map((round) => round.id),
      },
    },
  });

  const investmentsByDate: { [key: string]: typeof investments } = {};
  investments.forEach((event) => {
    const date = event.createdAt.toTimeString();
    if (!investmentsByDate[date]) {
      investmentsByDate[date] = [];
    }
    investmentsByDate[date].push(event);
  });

  const contracts = await prisma.contracts.findMany({
    where: {
      investmentId: {
        in: investments.map((investment) => investment.id),
      },
    },
  });

  const warrantNoptions = await prisma.warrantAndOptionShares.findMany({
    where: {
      businessId: businessId,
    },
  });

  const stakeholderEvents = await prisma.stakeholderEvents.findMany({
    where: {
      roundId: {
        in: rounds.map((round) => round.id),
      },
    },
    include: {
      stakeholder: {
        select: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  const dateMap: { [key: string]: {} } = {};

  return Response.json(rounds);
}
