import { prisma } from '@/lib/prisma';
import { GlobalStates } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string; status: GlobalStates }> }
) {
  const { businessId, status } = await params;

  const pendingContracts = await prisma.contracts.findMany({
    where: {
      OR: [
        {
          investment: {
            round: {
              businessId: businessId,
            },
          },
        },
        {
          warrantOptions: {
            businessId: businessId,
          },
        },
      ],
      status: (status as string) === 'ALL' ? undefined : GlobalStates.PENDING,
    },
  });

  return Response.json(pendingContracts);
}
