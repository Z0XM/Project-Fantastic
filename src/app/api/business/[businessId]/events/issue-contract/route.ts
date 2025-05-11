import { prisma } from '@/lib/prisma';
import { ContractType, EventType, GlobalStates, RoundType, ShareAllocationType, ShareType } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const body = await request.json();

  const { round, dilutions } = body as {
    round: {
      name: string;
      date: string;
      contractId: string;
      shares: number;
    };
    dilutions: {
      stakeholderId: string;
      shares: number;
    }[];
  };

  const createdAt = new Date(round.date);

  await prisma.$transaction(async (tx) => {
    const contract = await tx.contracts.findUniqueOrThrow({
      where: { id: round.contractId },
      include: {
        investment: {
          select: {
            stakeholderId: true,
          },
        },
        warrantOptions: {
          select: {
            stakeholderId: true,
            eventType: true,
          },
        },
      },
    });

    const roundDb = await tx.rounds.create({
      data: {
        name: round.name,
        type: RoundType.CONTRACT_ISSUE,
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
    const sharesIssued = round.shares;
    const sharesDiluted = dilutions.reduce((acc, dilusion) => acc + dilusion.shares, 0);

    await tx.businessEvents.create({
      data: {
        roundId: roundDb.id,
        businessId,
        createdAt,
        balanceShares: balanceShares - sharesIssued + sharesDiluted,
        totalShares: totalShares,
        preMoneyValuation: businessInfo?.preMoneyValuation ?? 0,
        postMoneyValuation: businessInfo?.postMoneyValuation ?? 0,
      },
    });

    if (contract.investment) {
      await tx.stakeholderEvents.create({
        data: {
          shares: round.shares,
          createdAt,
          stakeholderId: contract.investment.stakeholderId,
          roundId: roundDb.id,
          eventType:
            contract.contractType === ContractType.CONVERTIBLE_NOTE
              ? EventType.CONVERTIBLE_NOTE
              : contract.contractType === ContractType.SAFE
              ? EventType.SAFE
              : EventType.INVESTMENT,
          shareType: contract.shareType ?? ShareType.COMMON,
          shareAllocationType: ShareAllocationType.CONTRACT_PRICE,
          pricePerShare: Number(businessInfo?.postMoneyValuation ?? 0) / Number(businessInfo?.totalShares ?? 0),
          contractId: contract.id,
        },
      });
    } else if (contract.warrantOptions) {
      await tx.stakeholderEvents.create({
        data: {
          shares: round.shares,
          createdAt,
          stakeholderId: contract.warrantOptions.stakeholderId,
          roundId: roundDb.id,
          eventType: contract.warrantOptions.eventType,
          shareType: contract.shareType ?? ShareType.COMMON,
          shareAllocationType: ShareAllocationType.CONTRACT_PRICE,
          pricePerShare: contract.pricePerShare,
          contractId: contract.id,
        },
      });
    }

    const pendingShares = (contract.shares ?? 0) - round.shares;

    await tx.contracts.update({
      where: { id: round.contractId },
      data: {
        shares: pendingShares,
        status: pendingShares > 0 ? GlobalStates.PENDING : GlobalStates.COMPLETED,
      },
    });

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
