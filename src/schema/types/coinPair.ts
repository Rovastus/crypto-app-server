import { objectType, queryField, mutationField, list } from 'nexus'

import * as PrismaTypes from '.prisma/client'
import { getBinanceCoinPairs } from '../../utils/binanceApi'

export const CoinPair = objectType({
  name: 'CoinPair',
  definition(t) {
    t.model.id()
    t.model.pair()
    t.model.pairPriceHistory()
  },
})

export const Query = queryField((t) => {
  t.crud.coinPairs()
  t.crud.coinPair()
})

export const Mutation = mutationField((t) => {
  t.field('initCoinPairs', {
    type: list('CoinPair'),
    args: {},
    async resolve(_root, args, ctx) {
      const coinPairs: Array<PrismaTypes.Prisma.CoinPairCreateInput> = await getBinanceCoinPairs()
      await ctx.prisma.coinPair.deleteMany()
      await ctx.prisma.coinPair.createMany({
        data: [...coinPairs],
      })
      return ctx.prisma.coinPair.findMany()
    },
  })
})
