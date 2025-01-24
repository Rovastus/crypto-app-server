import * as PrismaTypes from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const getCoinPairPriceKraken = async function getCoinPairPriceKraken(coinPair: string, time: Date, prisma: PrismaTypes.PrismaClient): Promise<Decimal> {
  if (coinPair === 'ETH2EUR') {
    const eth2EthPrice = await getCoinPairPriceHistoryKraken('ETH2ETH', time, prisma);
    const ethEurPrice = await getCoinPairPriceHistoryKraken('ETHEUR', time, prisma);

    return eth2EthPrice.mul(ethEurPrice);
  }

  return getCoinPairPriceHistoryKraken(coinPair, time, prisma);
};

async function getCoinPairPriceHistoryKraken(coinPair: string, time: Date, prisma: PrismaTypes.PrismaClient): Promise<Decimal> {
  const coinPairPriceHistoryKrakenLTE: PrismaTypes.CoinPairPriceHistoryKraken | null = await prisma.coinPairPriceHistoryKraken.findFirst({
    where: {
      coinPair: coinPair,
      time: { lte: time },
    },
    orderBy: { time: 'desc' },
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
}
