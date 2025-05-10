import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const stakeholders = await prisma.stakeholders.findMany({
    where: { businessId: businessId },
    include: { user: true, _count: { select: { stakeholderEvents: true } } },
  });

  const formattedStakeholders = stakeholders.map((stakeholder) => ({
    id: stakeholder.id,
    name: stakeholder.user.name,
    userId: stakeholder.userId,
    type: stakeholder.type,
    config: stakeholder.config,
    createdAt: stakeholder.createdAt,
    hasStakes: stakeholder._count.stakeholderEvents > 0,
  }));
  return Response.json(formattedStakeholders);
}
