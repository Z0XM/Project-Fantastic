import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const businesses = await prisma.users.findMany({});

  return Response.json(businesses);
}
