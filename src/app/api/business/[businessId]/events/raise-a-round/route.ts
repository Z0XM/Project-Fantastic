import { prisma } from '@/lib/prisma';
import { ContractDataType, EventType, GlobalStates, RoundType, ShareAllocationType, ShareType } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const body = await request.json();

  const { round, investments, dilutions } = body as {
    round: {
      name: string;
      type: RoundType;
      date: string;
      valuation: number;
    };
    investments: {
      stakeholder: {
        name: string;
      };
      contracts: { title: string; description: string; rule: any }[];
      amount: number;
      shares: number;
      notes: string;
    }[];
    dilutions: {
      name: string;
      shares: number;
    }[];
  };

  const createdAt = new Date(round.date);

  await prisma.$transaction(async (tx) => {
    const roundDb = await tx.rounds.create({
      data: {
        name: round.name,
        type: round.type,
        businessId,
        createdAt,
      },
    });

    const businessInfo = await tx.businessEvents.findFirst({
      where: { businessId: businessId },
      orderBy: { createdAt: 'desc' },
    });

    const balanceShares = Number(businessInfo?.balanceShares ?? 0);
    const totalShares = Number(businessInfo?.totalShares ?? 0);
    const sharesIssued = investments.reduce((acc, investment) => acc + investment.shares, 0);

    await tx.businessEvents.create({
      data: {
        roundId: roundDb.id,
        businessId,
        createdAt,
        balanceShares: balanceShares - sharesIssued,
        totalShares: totalShares,
        valuation: round.valuation,
      },
    });

    const users = await tx.users.findMany({
      where: { name: { in: [...dilutions.map((d) => d.name), ...investments.map((i) => i.stakeholder.name)] } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((user) => [user.name, user.id]));

    const stakeholders = await tx.stakeholders.findMany({
      where: { userId: { in: Array.from(userMap.values()) }, businessId },
      select: { id: true, userId: true },
    });

    const stakeholderMap = new Map(stakeholders.map((stakeholder) => [stakeholder.userId, stakeholder.id]));

    await tx.stakeholderEvents.createMany({
      data: investments.map((investment) => ({
        roundId: roundDb.id,
        stakeholderId: stakeholderMap.get(userMap.get(investment.stakeholder.name)!)!,
        shares: investment.shares,
        createdAt,
        shareAllocationType: ShareAllocationType.ACTUAL_PRICE,
        shareType: ShareType.COMMON,
        eventType: EventType.INVESTMENT,
      })),
    });

    await Promise.all(
      investments.map(
        async (investment) =>
          await tx.investments.create({
            data: {
              roundId: roundDb.id,
              stakeholderId: stakeholderMap.get(userMap.get(investment.stakeholder.name)!)!,
              amount: investment.amount,
              notes: investment.notes,
              createdAt,
              contracts: {
                createMany: {
                  data: investment.contracts.map((contract) => ({
                    title: contract.title,
                    description: contract.description,
                    contractJson: contract.rule,
                    status: GlobalStates.PENDING,
                    dataType: ContractDataType.JSON,
                  })),
                },
              },
            },
          })
      )
    );

    await tx.stakeholderEvents.createMany({
      data: dilutions.map((dilution) => ({
        roundId: roundDb.id,
        stakeholderId: stakeholderMap.get(userMap.get(dilution.name)!)!,
        shares: -dilution.shares,

        createdAt,
        shareAllocationType: ShareAllocationType.ACTUAL_PRICE,
        shareType: ShareType.COMMON,
        eventType: EventType.DILUTION,
      })),
    });
  });

  return Response.json({}, { status: 201 });
}
