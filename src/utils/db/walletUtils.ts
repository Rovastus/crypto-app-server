import * as PrismaTypes from '.prisma/client';

export const getWalletRecordsByPortfolioId = async function getWalletRecordsByPortfolioId(
  portfolioId: number | bigint,
  prisma: PrismaTypes.PrismaClient,
): Promise<PrismaTypes.Wallet[]> {
  const walletRecords: PrismaTypes.Wallet[] | null = await prisma.wallet.findMany({ where: { portfolioId: portfolioId } });

  if (!walletRecords) {
    return [];
  }

  return walletRecords;
};
