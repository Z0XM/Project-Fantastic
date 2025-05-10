import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const businessInfo = await prisma.businessEvents.findFirst({
    where: { businessId: businessId },
    orderBy: { createdAt: 'desc' },
  });

  // if (!businessInfo) {
  //   return Response.json({ error: 'Business info not found' }, { status: 404 });
  // }

  return Response.json(businessInfo ? { businessInfo } : {});
}
