import { prisma } from '@/lib/prisma';
import { ContractType, EventType, GlobalStates, RoundType, ShareAllocationType, ShareType } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const body = await request.json();

  const { round, investments, dilutions } = body as {
    round: {
      name: string;
      type: RoundType;
      date: string;
      preMoneyValuation: number;
    };
    investments: {
      stakeholderId: string;
      amount?: number;
      contracts: {
        title: string;
        description?: string;
        shares?: number;
        pricePerShare?: number;
        contractType?: ContractType;
        investedAmount?: number;
      }[];
      shares: number;
      notes?: string;
    }[];
    dilutions: {
      stakeholderId: string;
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
    const sharesDiluted = dilutions.reduce((acc, dilusion) => acc + dilusion.shares, 0);
    const contractShares = investments.reduce((acc, investment) => {
      const contractShares = investment.contracts
        .filter((c) => !c.contractType || c.contractType === ContractType.NONE)
        .reduce((acc, contract) => acc + (contract.shares ?? 0), 0);
      return acc + contractShares;
    }, 0);

    const investmentsWithPrice = investments.map((investment) => ({
      ...investment,
      amount:
        round.type === RoundType.BOOTSTRAP
          ? Number(investment.amount ?? 0)
          : (investment.shares * round.preMoneyValuation) / totalShares,
    }));

    const postMoneyValuation =
      round.preMoneyValuation +
      investmentsWithPrice.reduce((acc, investment) => acc + investment.amount, 0) +
      investmentsWithPrice.reduce(
        (acc, investment) =>
          acc +
          investment.contracts.reduce(
            (acc, contract) =>
              acc +
              (!contract.contractType || contract.contractType === ContractType.NONE
                ? (contract.shares ?? 0) * investment.amount
                : Number(contract.investedAmount ?? 0)),
            0
          ),
        0
      );

    await tx.businessEvents.create({
      data: {
        roundId: roundDb.id,
        businessId,
        createdAt,
        balanceShares: balanceShares - (sharesIssued + contractShares) + sharesDiluted,
        totalShares: totalShares,
        preMoneyValuation: round.preMoneyValuation,
        postMoneyValuation: postMoneyValuation,
      },
    });

    await tx.stakeholderEvents.createMany({
      data: investmentsWithPrice.map((investment) => ({
        roundId: roundDb.id,
        stakeholderId: investment.stakeholderId,
        shares: investment.shares,
        createdAt,
        shareAllocationType: ShareAllocationType.ACTUAL_PRICE,
        shareType: ShareType.COMMON,
        eventType: EventType.INVESTMENT,
      })),
    });

    await Promise.all(
      investmentsWithPrice.map(async (investment) => {
        const investmentsDb = await tx.investments.create({
          data: {
            roundId: roundDb.id,
            stakeholderId: investment.stakeholderId,
            amount: investment.amount,
            notes: investment.notes,
            createdAt,
            contracts: {
              createMany: {
                data: investment.contracts.map((contract) => ({
                  title: contract.title,
                  description: contract.description,
                  status: contract.contractType === ContractType.NONE ? GlobalStates.COMPLETED : GlobalStates.PENDING,
                  shares: contract.shares,
                  shareType: ShareType.COMMON,
                  createdAt,
                  contractType: contract.contractType ?? undefined,
                  contractInvestment: contract.investedAmount ?? undefined,
                })),
              },
            },
          },
          select: {
            roundId: true,
            stakeholderId: true,
            contracts: true,
          },
        });

        const contractsDb = investmentsDb.contracts;

        await tx.stakeholderEvents.createMany({
          data: contractsDb
            .filter((x) => x.shares && x.shares > 0 && x.contractType === ContractType.NONE)
            .map((contract) => ({
              roundId: investmentsDb.roundId,
              stakeholderId: investmentsDb.stakeholderId,
              shares: contract.shares!,
              pricePerShare: contract.pricePerShare ?? undefined,
              createdAt,
              shareAllocationType: ShareAllocationType.CONTRACT_PRICE,
              shareType: ShareType.COMMON,
              eventType: EventType.INVESTMENT,
              contractId: contract.id,
            })),
        });
      })
    );

    await tx.stakeholderEvents.createMany({
      data: dilutions.map((dilution) => ({
        roundId: roundDb.id,
        stakeholderId: dilution.stakeholderId,
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
