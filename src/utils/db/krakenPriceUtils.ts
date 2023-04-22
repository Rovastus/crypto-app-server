import * as PrismaTypes from '.prisma/client'

export const getCoinPairPriceKraken =
  async function getCoinPairPriceHistoryKraken(
    time: Date,
    coinPair: string,
    prisma: PrismaTypes.PrismaClient,
  ): Promise<PrismaTypes.Prisma.Decimal> {
    const coinPairPriceHistoryKrakenLTE: PrismaTypes.CoinPairPriceHistoryKraken | null =
      await prisma.coinPairPriceHistoryKraken.findFirst({
        where: {
          coinPair: coinPair,
          time: {
            lte: time,
          },
        },
      })
    const coinPairPriceHistoryKrakenGTE: PrismaTypes.CoinPairPriceHistoryKraken | null =
      await prisma.coinPairPriceHistoryKraken.findFirst({
        where: {
          coinPair: coinPair,
          time: {
            gte: time,
          },
        },
      })

    if (!coinPairPriceHistoryKrakenLTE && !coinPairPriceHistoryKrakenGTE) {
      throw new Error(
        `Cannot find kraken coin pair record. time=${time}, coinPair=${coinPair}`,
      )
    }

    if (!coinPairPriceHistoryKrakenLTE || !coinPairPriceHistoryKrakenGTE) {
      if (coinPairPriceHistoryKrakenLTE) {
        return coinPairPriceHistoryKrakenLTE.closePrice
      } else if (coinPairPriceHistoryKrakenGTE) {
        return coinPairPriceHistoryKrakenGTE.openPrice
      }

      throw new Error(
        `Cannot find kraken coin pair record. time=${time}, coinPair=${coinPair}`,
      )
    }

    const diffLTE =
      time.getTime() - coinPairPriceHistoryKrakenLTE.time.getTime()
    const diffGTE =
      coinPairPriceHistoryKrakenGTE.time.getTime() - time.getTime()

    if (diffLTE <= diffGTE) {
      return coinPairPriceHistoryKrakenLTE.closePrice
    }

    return coinPairPriceHistoryKrakenGTE.openPrice
  }
