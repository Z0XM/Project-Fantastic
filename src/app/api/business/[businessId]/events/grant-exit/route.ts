import { prisma } from '@/lib/prisma';
import { ContractType, EventType, GlobalStates, RoundType, ShareAllocationType, ShareType } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const body = await request.json();

  const { round, exits, issues } = body as {
    round: {
      name: string;
      date: string;
    };
    exits: {
      stakeholderId: string;
      notes?: string;
    }[];
    issues: {
      stakeholderId: string;
      shares: number;
    }[];
  };

  const createdAt = new Date(round.date);

  await prisma.$transaction(async (tx) => {
    const roundDb = await tx.rounds.create({
      data: {
        name: round.name,
        type: RoundType.EXIT,
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
    const sharesIssued = issues.reduce((acc, issue) => acc + issue.shares, 0);

    const existSharesDb = await tx.stakeholderEvents.groupBy({
      where: {
        round: {
          businessId: businessId,
        },
        stakeholderId: {
          in: exits.map((x) => x.stakeholderId),
        },
      },
      by: ['stakeholderId'],
      _sum: {
        shares: true,
      },
    });

    const exitShares = existSharesDb.reduce((acc, x) => acc + (x._sum.shares ?? 0), 0);

    await tx.businessEvents.create({
      data: {
        roundId: roundDb.id,
        businessId,
        createdAt,
        balanceShares: balanceShares - sharesIssued + exitShares,
        totalShares: totalShares,
        preMoneyValuation: businessInfo?.preMoneyValuation ?? 0,
        postMoneyValuation: businessInfo?.postMoneyValuation ?? 0,
      },
    });

    await tx.stakeholderEvents.createMany({
      data: existSharesDb.map((exit) => ({
        roundId: roundDb.id,
        stakeholderId: exit.stakeholderId,
        shares: -1 * Number(exit._sum.shares ?? 0),
        createdAt,
        shareAllocationType: ShareAllocationType.ACTUAL_PRICE,
        shareType: ShareType.COMMON,
        eventType: EventType.EXIT,
      })),
    });

    await tx.stakeholderEvents.createMany({
      data: issues.map((issue) => ({
        roundId: roundDb.id,
        stakeholderId: issue.stakeholderId,
        shares: issue.shares,
        createdAt,
        shareAllocationType: ShareAllocationType.ACTUAL_PRICE,
        shareType: ShareType.COMMON,
        eventType: EventType.EXIT,
      })),
    });

    await Promise.all(
      existSharesDb.map(async (exit) => {
        await tx.stakeholders.update({
          where: { id: exit.stakeholderId },
          data: {
            hasExited: true,
            exitedAtPrice:
              Number(exit._sum.shares ?? 0) *
              (Number(businessInfo?.postMoneyValuation ?? 0) / Number(businessInfo?.totalShares ?? 0)),
          },
        });
      })
    );
  });

  return Response.json({}, { status: 201 });
}
