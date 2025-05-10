import { prisma } from '@/lib/prisma';
import { ContractDataType, EventType, GlobalStates, RoundType, ShareAllocationType, ShareType } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const body = await request.json();

  const { round, investments } = body as {
    round: {
      name: string;
      type: RoundType;
      date: string;
    };
    investments: {
      stakeholder: {
        name: string;
      };
      contracts: { title: string; description: string }[];
      pricePerShare: number;
      shares: number;
      notes: string;
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

    const users = await tx.users.findMany({
      where: {
        name: { in: investments.map((i) => i.stakeholder.name) },
      },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((user) => [user.name, user.id]));

    const stakeholders = await tx.stakeholders.findMany({
      where: { userId: { in: Array.from(userMap.values()) }, businessId },
      select: { id: true, userId: true },
    });

    const stakeholderMap = new Map(stakeholders.map((stakeholder) => [stakeholder.userId, stakeholder.id]));

    await Promise.all(
      investments.map(async (investment) => {
        await tx.investments.create({
          data: {
            roundId: roundDb.id,
            stakeholderId: stakeholderMap.get(userMap.get(investment.stakeholder.name)!)!,
            amount: 0,
            notes: investment.notes,
            createdAt,
            contracts: {
              createMany: {
                data: investment.contracts.map((contract) => ({
                  title: contract.title,
                  description: contract.description,
                  contractJson: {
                    shareType: ShareType.WARRANT,
                    pricePerShare: investment.pricePerShare,
                    promisedShares: investment.shares,
                  },
                  status: GlobalStates.PENDING,
                  dataType: ContractDataType.JSON,
                })),
              },
            },
          },
        });
      })
    );
  });

  return Response.json({}, { status: 201 });
}
