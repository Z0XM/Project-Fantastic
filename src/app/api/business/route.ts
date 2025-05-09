import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const businesses = await prisma.business.findMany({});

  return Response.json(businesses);
}
