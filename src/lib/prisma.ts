import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

// Initialize a new PrismaClient instance with Accelerate extension
// Accelerate provides edge-optimized database access with better performance
export const prisma = new PrismaClient().$extends(withAccelerate());
