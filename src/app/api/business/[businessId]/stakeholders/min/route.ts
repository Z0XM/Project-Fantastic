import { prisma } from '@/lib/prisma';
import { EventType } from '@prisma/client';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const stakeholders = await prisma.stakeholders.findMany({
    where: { businessId: businessId },
    include: { user: true, stakeholderEvents: true },
  });

  const formattedStakeholders = stakeholders.map((stakeholder) => ({
    id: stakeholder.id,
    name: stakeholder.user.name,
    userId: stakeholder.userId,
    type: stakeholder.type,
    config: stakeholder.config,
    createdAt: stakeholder.createdAt,
    ownershipShares: stakeholder.stakeholderEvents.reduce(
      (acc, event) => acc + (event.eventType === EventType.OPTION ? 0 : Number(event.shares)),
      0
    ),
    totalShares: stakeholder.stakeholderEvents.reduce((acc, event) => acc + Number(event.shares), 0),
  }));
  return Response.json(formattedStakeholders);
}
