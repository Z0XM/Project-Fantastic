import { prisma } from '@/lib/prisma';
import { GlobalStates } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string; status: GlobalStates }> }
) {
  const { businessId, status } = await params;

  const pendingContracts = await prisma.contracts.findMany({
    where: {
      investment: {
        round: {
          businessId: businessId,
        },
      },
      status: (status as string) === 'ALL' ? undefined : GlobalStates.PENDING,
    },
  });

  return Response.json(pendingContracts);
}
