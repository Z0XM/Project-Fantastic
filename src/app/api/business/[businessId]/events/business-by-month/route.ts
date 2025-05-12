import { prisma } from '@/lib/prisma';
import { ContractType, EventType, GlobalStates } from '@prisma/client';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;

  const businessEvents = await prisma.businessEvents.findMany({
    where: { businessId: businessId },
    orderBy: { createdAt: 'asc' },
    include: {
      round: {
        select: {
          investments: {
            select: {
              amount: true,
              contracts: {
                where: {
                  status: GlobalStates.COMPLETED,
                },
                select: {
                  contractType: true,
                  pricePerShare: true,
                  shares: true,
                  contractInvestment: true,
                },
              },
            },
          },
          stakeholderEvents: {
            where: {
              eventType: {
                in: [EventType.WARRANT, EventType.OPTION],
              },
            },
            select: {
              contract: {
                where: {
                  status: GlobalStates.COMPLETED,
                  contractType: {
                    in: [ContractType.WARRANT, ContractType.OPTION],
                  },
                },
                select: {
                  contractInvestment: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const businessEventsByMonth = businessEvents.reduce((acc, event) => {
    const month = new Date(event.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = {
        month,
        events: [],
      };
    }

    acc[month].events.push(event);

    return acc;
  }, {} as Record<string, { month: string; events: typeof businessEvents }>);

  const aggregated = Object.values(businessEventsByMonth).map((month) => {
    const events = month.events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    const totalInvestment = events.reduce((acc, event) => {
      const investments = event.round.investments.reduce((sum, investment) => {
        const contractInvestment = investment.contracts.reduce((sum, contract) => {
          if (contract.contractType === ContractType.NONE) {
            return sum + Number(contract.shares ?? 0) * Number(contract.pricePerShare ?? 0);
          }
          return sum + Number(contract?.contractInvestment ?? 0);
        }, 0);
        return sum + Number(investment.amount) + contractInvestment;
      }, 0);
      const warrantAndOptionInvestment = event.round.stakeholderEvents.reduce((sum, event) => {
        const contractInvestment = Number(event.contract?.contractInvestment ?? 0);
        return sum + contractInvestment;
      }, 0);
      return acc + investments + warrantAndOptionInvestment;
    }, 0);

    return {
      month: month.month,
      firstValuation: Number(firstEvent.preMoneyValuation),
      lastValuation: Number(lastEvent.postMoneyValuation),
      totalInvestment,
    };
  });

  return Response.json(Object.values(aggregated));
}
