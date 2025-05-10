import { prisma } from '@/lib/prisma';
import { ContractDataType, EventType, GlobalStates, RoundType, ShareAllocationType, ShareType } from '@prisma/client';

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
      name: string;
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
      },
    });
    const shareType = (contract.contractJson as any).shareType;
    const roundDb = await tx.rounds.create({
      data: {
        name: round.name,
        type:
          shareType === 'WARRANT'
            ? RoundType.WARRANT
            : shareType === 'OPTION'
            ? RoundType.OPTION
            : shareType === 'CONVERTIBLE_NOTE'
            ? RoundType.CONVERTIBLE_NOTE
            : shareType === 'SAFE'
            ? RoundType.SAFE
            : RoundType.SERIES_N,
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

    const users = await tx.users.findMany({
      where: {
        name: { in: dilutions.map((d) => d.name) },
      },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((user) => [user.name, user.id]));

    const stakeholders = await tx.stakeholders.findMany({
      where: { userId: { in: Array.from(userMap.values()) }, businessId },
      select: { id: true, userId: true },
    });

    const stakeholderMap = new Map(stakeholders.map((stakeholder) => [stakeholder.userId, stakeholder.id]));

    await tx.stakeholderEvents.create({
      data: {
        roundId: roundDb.id,
        stakeholderId: contract.investment.stakeholderId,
        contractId: contract.id,
        shares: round.shares,
        createdAt,
        shareAllocationType: ShareAllocationType.CONTRACT_PRICE,
        shareType: ShareType.COMMON,
        eventType:
          shareType === 'WARRANT'
            ? EventType.WARRANT
            : shareType === 'OPTION'
            ? EventType.OPTION
            : shareType === 'CONVERTIBLE_NOTE'
            ? EventType.CONVERTIBLE_NOTE
            : shareType === 'SAFE'
            ? EventType.SAFE
            : EventType.INVESTMENT,
        pricePerShare: (contract.contractJson as any).pricePerShare,
      },
    });

    const pendingShares = Number((contract.contractJson as any).shares) - round.shares;

    await tx.contracts.update({
      where: { id: round.contractId },
      data: {
        contractJson: {
          ...(contract.contractJson as any),
          shares: pendingShares,
        },
        status: pendingShares > 0 ? GlobalStates.PENDING : GlobalStates.COMPLETED,
      },
    });

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
