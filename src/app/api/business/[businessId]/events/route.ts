import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;

  const rounds = await prisma.rounds.findMany({
    where: {
      businessId: businessId,
    },
    include: {
      investments: {
        select: {
          stakeholderId: true,
          amount: true,
        },
      },
      businessEvents: true,
      stakeholderEvents: {
        include: {
          stakeholder: {
            select: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  return Response.json(rounds);
}
