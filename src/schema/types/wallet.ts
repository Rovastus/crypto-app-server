import { prisma } from '../db';
import { SchemaBuilderType } from '../schema';

export function initWallet(schemaBuilder: SchemaBuilderType) {
  schemaBuilder.prismaObject('Wallet', {
    fields: (t) => ({
      id: t.expose('id', { type: 'BigInt' }),
      coin: t.exposeString('coin'),
      amount: t.expose('amount', { type: 'Decimal' }),
      avcoFiatPerUnit: t.expose('avcoFiatPerUnit', { type: 'Decimal' }),
      totalFiat: t.expose('totalFiat', { type: 'Decimal' }),
      portfolioId: t.expose('portfolioId', { type: 'BigInt' }),
      portfolio: t.relation('portfolio'),
    }),
  });

  schemaBuilder.queryFields((t) => ({
    getWalletsByPortfolioId: t.prismaField({
      type: ['Wallet'],
      args: {
        portfolioId: t.arg({ type: 'BigInt', required: true }),
      },
      resolve: async (query, _root, args, _context, _info) => {
        return prisma.wallet.findMany({ ...query, where: { portfolioId: args.portfolioId } });
      },
    }),
  }));
}
