import { prisma } from '@/lib/prisma';

export async function GET() {
  const businesses = await prisma.users.findMany({});

  return Response.json(businesses);
}
