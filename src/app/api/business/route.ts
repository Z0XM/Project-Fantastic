import { prisma } from '@/lib/prisma';

export async function GET() {
  const businesses = await prisma.business.findMany({});

  return Response.json(businesses);
}
