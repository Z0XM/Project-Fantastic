import { prisma } from '@/lib/prisma';
import { ContractType, EventType, GlobalStates, RoundType, ShareType } from '@prisma/client';

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const body = await request.json();

  const { event, grants } = body as {
    event: {
      notes?: string;
      type: EventType;
      date: string;
    };
    grants: {
      stakeholderId: string;
      contracts: { title: string; description: string; shares?: number }[];
      notes?: string;
    }[];
  };

  const createdAt = new Date(event.date);

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      grants.map(async (grant) => {
        await tx.warrantAndOptionShares.create({
          data: {
            eventType: event.type,
            notes: event.notes,
            createdAt,
            stakeholderId: grant.stakeholderId,
            businessId,
            contracts: {
              createMany: {
                data: grant.contracts.map((contract) => ({
                  title: contract.title,
                  description: contract.description,
                  shares: contract.shares,
                  createdAt,
                  status: GlobalStates.PENDING,
                  shareType: event.type === EventType.OPTION ? ShareType.OPTION : ShareType.COMMON,
                  contractType: event.type === EventType.OPTION ? ContractType.OPTION : ContractType.WARRANT,
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
