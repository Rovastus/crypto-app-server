import {
  objectType,
  queryField,
  nonNull,
  list,
  inputObjectType,
  mutationField,
  stringArg,
} from 'nexus'
import * as moment from 'moment'
import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime'

export const CoinPairPriceHistoryKraken = objectType({
  name: 'CoinPairPriceHistoryKraken',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.openPrice()
    t.model.closePrice()
    t.model.coinPair()
  },
})

export const Query = queryField((t) => {
  t.crud.coinPairPriceHistoryKrakens()
  t.crud.coinPairPriceHistoryKraken()
})

export const Mutation = mutationField((t) => {
  t.field('importCoinPairPriceHistoryKrakenData', {
    type: 'String',
    args: {
      coinPair: nonNull(stringArg()),
      jsonData: nonNull(
        list(
          nonNull(
            inputObjectType({
              name: 'CoinPairPriceHistoryKrakenFileInput',
              definition(t) {
                t.nonNull.string('utcTime')
                t.nonNull.string('openPrice')
                t.nonNull.string('closePrice')
              },
            }),
          ),
        ),
      ),
    },
    async resolve(_root, args, ctx) {
      const exportData: Array<PrismaTypes.Prisma.CoinPairPriceHistoryKrakenCreateManyInput> =
        Array.from(args.jsonData, (data: JsonDataRow) => {
          return {
            time: moment.utc(data.utcTime).toDate(),
            openPrice: new Decimal(data.openPrice),
            closePrice: new Decimal(data.closePrice),
            coinPair: args.coinPair,
          }
        })

      await ctx.prisma.coinPairPriceHistoryKraken.createMany({
        data: exportData,
      })

      return 'File data was imported successfully.'
    },
  })
})

export interface JsonDataRow {
  utcTime: string
  openPrice: string
  closePrice: string
}
