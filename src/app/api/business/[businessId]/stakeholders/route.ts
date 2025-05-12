import { prisma } from '@/lib/prisma';
import { ContractType, EventType } from '@prisma/client';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;

  const businessInfo = await prisma.businessEvents.findFirst({
    where: { businessId: businessId },
    orderBy: { createdAt: 'desc' },
  });

  const stakeholders = await prisma.stakeholders.findMany({
    where: { businessId: businessId },
    include: {
      user: true,
      investments: { include: { contracts: true } },
      stakeholderEvents: true,
      warrantandOptionShares: { include: { contracts: true } },
    },
    orderBy: {
      user: {
        name: 'asc',
      },
    },
  });

  // console.log('stakeholders', JSON.stringify(stakeholders, null, 2));

  const formattedStakeholders = stakeholders.map((stakeholder) => ({
    id: stakeholder.id,
    name: stakeholder.user.name,
    userId: stakeholder.userId,
    type: stakeholder.type,
    config: stakeholder.config,
    createdAt: stakeholder.createdAt,
    hasExited: stakeholder.hasExited,
    exitedAtPrice: stakeholder.exitedAtPrice,
    totalInvestment:
      stakeholder.investments.reduce((acc, investment) => acc + Number(investment.amount), 0) +
      stakeholder.investments.reduce(
        (acc, investment) =>
          acc +
          investment.contracts.reduce(
            (accy, c) =>
              accy + c.contractType === ContractType.NONE
                ? Number(c.shares ?? 0) * Number(c.pricePerShare ?? 0)
                : Number(c.contractInvestment ?? 0),
            0
          ),
        0
      ),
    ownedShares: stakeholder.stakeholderEvents.reduce((acc, event) => acc + Number(event.shares), 0),
    ownershipShares: stakeholder.stakeholderEvents
      .filter((c) => c.eventType !== EventType.OPTION)
      .reduce((acc, event) => acc + Number(event.shares), 0),
    promisedShares:
      stakeholder.warrantandOptionShares.reduce(
        (acc, event) => acc + event.contracts.reduce((accy, c) => accy + Number(c.shares ?? 0), 0),
        0
      ) +
      stakeholder.investments.reduce(
        (acc, investment) =>
          acc +
          investment.contracts
            .filter((c) => c.contractType === ContractType.CONVERTIBLE_NOTE || c.contractType === ContractType.SAFE)
            .reduce((accy, c) => accy + Number(c.shares ?? 0), 0),
        0
      ),
  }));

  const totalOwnershipShares = formattedStakeholders.reduce(
    (acc, stakeholder) => acc + Number(stakeholder.ownershipShares),
    0
  );

  const totalOwnedShares = formattedStakeholders.reduce((acc, stakeholder) => acc + Number(stakeholder.ownedShares), 0);

  const totalInvestment = formattedStakeholders.reduce((acc, stakeholder) => acc + stakeholder.totalInvestment, 0);

  const result = {
    stakeholders: formattedStakeholders.map((x) => ({
      ...x,
      stockValue:
        x.ownedShares * (Number(businessInfo?.postMoneyValuation ?? 0) / Number(businessInfo?.totalShares ?? 0)),
    })),
    totalOwnershipShares,
    totalOwnedShares,
    totalInvestment,
  };

  return Response.json(result);
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
