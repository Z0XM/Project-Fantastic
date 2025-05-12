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
    const date = new Date(event.createdAt).getTime();
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
    const date = new Date(event.createdAt).getTime();

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
    include: {
      investment: {
        select: {
          stakeholder: {
            select: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      },
      warrantOptions: {
        select: {
          stakeholder: {
            select: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  const contractsByDate: { [key: string]: typeof contracts } = {};
  contracts.forEach((event) => {
    const date = new Date(event.createdAt).getTime();

    if (!contractsByDate[date]) {
      contractsByDate[date] = [];
    }
    contractsByDate[date].push(event);
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
    const date = new Date(event.createdAt).getTime();

    if (!stakeholderEventsByDate[date]) {
      stakeholderEventsByDate[date] = [];
    }
    stakeholderEventsByDate[date].push(event);
  });

  const dateSet = new Set([
    ...Object.keys(businessEventsByDate),
    ...Object.keys(investmentsByDate),
    ...Object.keys(contractsByDate),
    ...Object.keys(stakeholderEventsByDate),
  ]);
  const dateArray = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const dateMap: {
    [key: string]: {
      preMoneyValuation: number;
      postMoneyValuation: number;
      totalShares: number;
      pricePerShare: number;
      balanceShares: number;
      directInvestment: number;
      contractInvestment: number;
      stakeholderMap: {
        [key: string]: { name: string; shares: number; promisedShares: number };
      };
    };
  } = {};

  dateArray.map((date) => {
    const businessEventsForDate = businessEventsByDate[date] ?? [];
    const investmentsForDate = investmentsByDate[date] ?? [];
    const contractsForDate = contractsByDate[date] ?? [];
    const stakeholderEventsForDate = stakeholderEventsByDate[date] ?? [];

    const stakeholderMap = stakeholderEventsForDate.reduce((acc, event) => {
      const stakeholderName = event.stakeholder.user.name;
      const shares = Number(event.shares);
      if (acc[stakeholderName]) {
        acc[stakeholderName].shares += shares;
      } else {
        acc[stakeholderName] = { name: stakeholderName, shares, promisedShares: 0 };
      }
      return acc;
    }, {} as { [key: string]: { name: string; shares: number; promisedShares: number } });

    // contractsForDate.forEach((event) => {
    //   if (event.status !== GlobalStates.PENDING) return;
    //   if (event.investment) {
    //     const stakeholderName = event.investment.stakeholder.user.name;
    //     const shares = Number(event.shares ?? 0);
    //     if (stakeholderMap[stakeholderName]) {
    //       stakeholderMap[stakeholderName].promisedShares += shares;
    //     } else {
    //       stakeholderMap[stakeholderName] = { name: stakeholderName, shares: 0, promisedShares: shares };
    //     }
    //   }

    //   if (event.warrantOptions) {
    //     const stakeholderName = event.warrantOptions.stakeholder.user.name;
    //     const shares = Number(event.shares ?? 0);
    //     if (stakeholderMap[stakeholderName]) {
    //       stakeholderMap[stakeholderName].promisedShares += shares;
    //     } else {
    //       stakeholderMap[stakeholderName] = { name: stakeholderName, shares: 0, promisedShares: shares };
    //     }
    //   }
    // });

    dateMap[date] = {
      preMoneyValuation: Number(businessEventsForDate?.[0].preMoneyValuation ?? 0),
      postMoneyValuation: Number(businessEventsForDate?.[0].preMoneyValuation ?? 0),
      totalShares: Number(businessEventsForDate?.[0].totalShares ?? 0),
      pricePerShare:
        Number(businessEventsForDate?.[0].postMoneyValuation ?? 0) /
        Number(businessEventsForDate?.[0].totalShares ?? 0),
      balanceShares: Number(businessEventsForDate?.[0].balanceShares ?? 0),
      directInvestment: investmentsForDate.reduce((acc, investment) => acc + Number(investment.amount), 0),
      contractInvestment: contractsForDate.reduce(
        (acc, contract) =>
          acc +
          Number(
            contract.status === GlobalStates.COMPLETED && contract.contractType == ContractType.NONE
              ? contract.contractInvestment
              : Number(contract.shares ?? 0) * Number(contract.pricePerShare ?? 0)
          ),
        0
      ),
      stakeholderMap,
    };
    return { date };
  });

  return Response.json(dateMap);
}
