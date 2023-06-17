import * as PrismaTypes from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const getCoinPairPriceKraken = async function getCoinPairPriceHistoryKraken(
	coinPair: string,
	time: Date,
	prisma: PrismaTypes.PrismaClient,
): Promise<Decimal> {
	const coinPairPriceHistoryKrakenLTE: PrismaTypes.CoinPairPriceHistoryKraken | null = await prisma.coinPairPriceHistoryKraken.findFirst({
		where: {
			coinPair: coinPair,
			time: { lte: time },
		},
	});
	const coinPairPriceHistoryKrakenGTE: PrismaTypes.CoinPairPriceHistoryKraken | null = await prisma.coinPairPriceHistoryKraken.findFirst({
		where: {
			coinPair: coinPair,
			time: { gte: time },
		},
	});

	if (!coinPairPriceHistoryKrakenLTE && !coinPairPriceHistoryKrakenGTE) {
		throw new Error(`Cannot find kraken coin pair record. time=${time}, coinPair=${coinPair}`);
	}

	if (!coinPairPriceHistoryKrakenLTE || !coinPairPriceHistoryKrakenGTE) {
		if (coinPairPriceHistoryKrakenLTE) {
			return coinPairPriceHistoryKrakenLTE.closePrice;
		} else if (coinPairPriceHistoryKrakenGTE) {
			return coinPairPriceHistoryKrakenGTE.openPrice;
		}

		throw new Error(`Cannot find kraken coin pair record. time=${time}, coinPair=${coinPair}`);
	}

	const diffLTE = time.getTime() - coinPairPriceHistoryKrakenLTE.time.getTime();
	const diffGTE = coinPairPriceHistoryKrakenGTE.time.getTime() - time.getTime();

	if (diffLTE <= diffGTE) {
		return coinPairPriceHistoryKrakenLTE.closePrice;
	}

	return coinPairPriceHistoryKrakenGTE.openPrice;
};
