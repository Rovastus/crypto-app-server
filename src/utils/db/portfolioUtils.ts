import * as PrismaTypes from '.prisma/client';

export const getPortfolioById = async function getPortfolioById(id: number | bigint, prisma: PrismaTypes.PrismaClient): Promise<PrismaTypes.Portfolio> {
  const portfolio: PrismaTypes.Portfolio | null = await prisma.portfolio.findUnique({ where: { id: id } });

  if (!portfolio) {
    throw new Error("Portfolio don't exists.");
  }

  return portfolio;
};
