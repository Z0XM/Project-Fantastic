import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const stakeholders = await prisma.stakeholders.findMany({
    where: { businessId: businessId },
    include: { user: true, investments: true, stakeholderEvents: true, warrantandOptionShares: true },
  });

  const formattedStakeholders = stakeholders.map((stakeholder) => ({
    id: stakeholder.id,
    name: stakeholder.user.name,
    userId: stakeholder.userId,
    type: stakeholder.type,
    config: stakeholder.config,
    createdAt: stakeholder.createdAt,
    totalInvestment: stakeholder.investments.reduce((acc, investment) => acc + Number(investment.amount), 0),
    totalShares: stakeholder.stakeholderEvents.reduce((acc, event) => acc + Number(event.shares), 0),
    warrantNOptions: stakeholder.warrantandOptionShares.reduce((acc, event) => acc + Number(event.shares), 0),
  }));
  return Response.json(formattedStakeholders);
}

export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const body = await request.json();

  const name = body.name;
  const type = body.type;
  const config = body.config;

  const user = await prisma.users.findUniqueOrThrow({
    where: { name },
  });

  await prisma.stakeholders.create({
    data: {
      businessId: businessId,
      type: type,
      config: config,
      userId: user.id,
    },
  });

  return Response.json({}, { status: 201 });
}
