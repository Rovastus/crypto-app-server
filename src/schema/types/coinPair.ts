import * as PrismaTypes from '.prisma/client';
import { getBinanceCoinPairs } from '../../utils/binanceApi';
import { prisma } from '../db';
import { SchemaBuilderType } from '../schema';

export function initCoinPair(schemaBuilder: SchemaBuilderType) {
  schemaBuilder.prismaObject('CoinPair', {
    fields: (t) => ({
      id: t.expose('id', { type: 'BigInt' }),
      pair: t.exposeString('pair'),
      pairPriceHistories: t.relation('pairPriceHistories'),
    }),
  });

  schemaBuilder.mutationFields((t) => ({
    initCoinPairs: t.field({
      type: 'String',
      args: {},
      resolve: async (_parent, _args, _context, _info) => {
        const coinPairs: Array<PrismaTypes.Prisma.CoinPairCreateInput> = await getBinanceCoinPairs();
        await prisma.coinPair.createMany({ data: coinPairs });
        return 'Coin pairs was imported successfully.';
      },
    }),
  }));
}
