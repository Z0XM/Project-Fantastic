import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });

  return Response.json(business);
}
