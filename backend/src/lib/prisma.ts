import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: ['error'],
})

// Garde la connexion vivante toutes les 4 minutes
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    // silencieux
  }
}, 4 * 60 * 1000)