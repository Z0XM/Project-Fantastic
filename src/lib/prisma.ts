// import { PrismaClient } from '@prisma/client/edge';
import { PrismaClient as PrismaEdge } from '@prisma/client/edge';
import { PrismaClient as PrismaBase } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { config } from 'dotenv';

config();

// Initialize a new PrismaClient instance with Accelerate extension
// Accelerate provides edge-optimized database access with better performance
export const prisma = new PrismaEdge({ datasourceUrl: process.env.DATABASE_URL }).$extends(withAccelerate());
// export const prisma = new PrismaBase({ datasourceUrl: process.env.DATABASE_URL });
