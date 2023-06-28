import { SchemaBuilderType } from '../schema';

export function initCoinPairPriceHistory(schemaBuilder: SchemaBuilderType) {
  schemaBuilder.prismaObject('CoinPairPriceHistory', {
    fields: (t) => ({
      id: t.expose('id', { type: 'BigInt' }),
      time: t.expose('time', { type: 'Date' }),
      price: t.expose('price', { type: 'Decimal' }),
      url: t.exposeString('url'),
      coinPair: t.relation('coinPair'),
    }),
  });
}
