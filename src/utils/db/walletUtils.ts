import * as PrismaTypes from '.prisma/client';

export const getWalletRecordsByPortfolioId = async function getWalletRecordsByPortfolioId(
  portfolioId: number | bigint,
  prisma: PrismaTypes.PrismaClient,
): Promise<PrismaTypes.Wallet[]> {
  const walletRecords = await prisma.wallet.findMany({ where: { portfolioId: portfolioId } });

  return walletRecords;
};
