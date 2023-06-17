import * as PrismaTypes from '.prisma/client';

export const getWalletRecordsByPortpholioId = async function getWalletRecordsByPortpholioId(
	portpholioId: number | bigint,
	prisma: PrismaTypes.PrismaClient,
): Promise<PrismaTypes.Wallet[]> {
	const walletRecords: PrismaTypes.Wallet[] | null = await prisma.wallet.findMany({ where: { portpholioId: portpholioId } });

	if (!walletRecords) {
		return [];
	}

	return walletRecords;
};
