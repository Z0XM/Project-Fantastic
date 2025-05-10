import { prisma } from '@/lib/prisma';
import { EventType, RoundType, ShareAllocationType, ShareType } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const body = await request.json();

  const { addedShares, date, name, stockSplitRatio, type, valuation } = body as {
    addedShares: number;
    date: string;
    name: string;
    stockSplitRatio: number;
    type: typeof RoundType.NEW_SHARES | typeof RoundType.STOCK_SPLIT;
    valuation: number;
  };

  const createdAt = new Date(date);

  await prisma.$transaction(async (tx) => {
    const round = await tx.rounds.create({
      data: {
        name,
        type: type === 'NEW_SHARES' ? RoundType.NEW_SHARES : RoundType.STOCK_SPLIT,
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

    if (type === 'NEW_SHARES') {
      await tx.businessEvents.create({
        data: {
          roundId: round.id,
          businessId,
          createdAt,
          balanceShares: balanceShares + addedShares,
          totalShares: totalShares + addedShares,
          valuation,
        },
      });
    } else if (type === 'STOCK_SPLIT') {
      await tx.businessEvents.create({
        data: {
          roundId: round.id,
          businessId,
          createdAt,
          balanceShares: balanceShares * (1 + (stockSplitRatio ?? 0)),
          totalShares: totalShares * (1 + (stockSplitRatio ?? 0)),
          valuation,
        },
      });

      const stockIncrement = 1 / stockSplitRatio - 1;

      const existingHolders = await tx.stakeholderEvents.groupBy({
        where: {
          round: {
            businessId,
          },
        },
        by: ['stakeholderId'],
        _sum: {
          shares: true,
        },
      });

      const holdersWithNewShares = existingHolders
        .map((x) => {
          return {
            stakeHolderId: x.stakeholderId,
            oldShares: Number(x._sum.shares ?? 0),
            newShares: Number(x._sum.shares ?? 0) * stockIncrement,
          };
        })
        .filter((x) => x.oldShares > 0);

      await tx.stakeholderEvents.createMany({
        data: holdersWithNewShares.map((x) => ({
          roundId: round.id,
          stakeholderId: x.stakeHolderId,
          shares: x.newShares,
          shareAllocationType: ShareAllocationType.NONE,
          shareType: ShareType.COMMON,
          eventType: EventType.ALLOCATION,
        })),
      });
    }
  });

  return Response.json({}, { status: 201 });
}
