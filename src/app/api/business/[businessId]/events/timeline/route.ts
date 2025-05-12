import { prisma } from '@/lib/prisma';
import { ContractType, GlobalStates } from '@prisma/client';

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

  const contractsByDate: { [key: string]: typeof contracts } = {};
  contracts.forEach((event) => {
    const date = event.createdAt.toTimeString();
    if (!contractsByDate[date]) {
      contractsByDate[date] = [];
    }
    contractsByDate[date].push(event);
  });

  const warrantNoptions = await prisma.warrantAndOptionShares.findMany({
    where: {
      businessId: businessId,
    },
  });
  const warrantNoptionsByDate: { [key: string]: typeof warrantNoptions } = {};
  warrantNoptions.forEach((event) => {
    const date = event.createdAt.toTimeString();
    if (!warrantNoptionsByDate[date]) {
      warrantNoptionsByDate[date] = [];
    }
    warrantNoptionsByDate[date].push(event);
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
  const stakeholderEventsByDate: { [key: string]: typeof stakeholderEvents } = {};
  stakeholderEvents.forEach((event) => {
    const date = event.createdAt.toTimeString();
    if (!stakeholderEventsByDate[date]) {
      stakeholderEventsByDate[date] = [];
    }
    stakeholderEventsByDate[date].push(event);
  });

  const dateSet = new Set([
    ...Object.keys(businessEventsByDate),
    ...Object.keys(investmentsByDate),
    ...Object.keys(contractsByDate),
    ...Object.keys(warrantNoptionsByDate),
    ...Object.keys(stakeholderEventsByDate),
  ]);
  const dateArray = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  dateArray.map((date) => {
    const businessEventsForDate = businessEventsByDate[date] ?? [];
    const investmentsForDate = investmentsByDate[date] ?? [];
    const contractsForDate = contractsByDate[date] ?? [];
    const warrantNoptionsForDate = warrantNoptionsByDate[date] ?? [];
    const stakeholderEventsForDate = stakeholderEventsByDate[date] ?? [];

    dateMap[date] = {
      preMoneyValuation: Number(businessEventsForDate?.[0].preMoneyValuation ?? 0),
      postMoneyValuation: Number(businessEventsForDate?.[0].preMoneyValuation ?? 0),
      totalShares: Number(businessEventsForDate?.[0].totalShares ?? 0),
      balanceShares: Number(businessEventsForDate?.[0].balanceShares ?? 0),
      directInvestment: investmentsForDate.reduce((acc, investment) => acc + Number(investment.amount), 0),
      contractInvestment: contracts.reduce(
        (acc, contract) =>
          acc +
          Number(
            contract.status === GlobalStates.COMPLETED && contract.contractType == ContractType.NONE
              ? contract.contractInvestment
              : 0
          ),
        0
      ),
      warrantNoptions: warrantNoptionsForDate,
      stakeholderEvents: stakeholderEventsForDate,
    };
    return { date };
  });

  const dateMap: { [key: string]: {} } = {};

  return Response.json(rounds);
}
