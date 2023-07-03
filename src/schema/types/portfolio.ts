import { FiatEnum, TaxMethodEnum } from '@prisma/client';
import { prisma } from '../db';
import { SchemaBuilderType } from '../schema';

export function initPortfolio(schemaBuilder: SchemaBuilderType) {
  schemaBuilder.prismaObject('Portfolio', {
    fields: (t) => ({
      id: t.expose('id', { type: 'BigInt' }),
      name: t.exposeString('name'),
      taxMethod: t.expose('taxMethod', { type: TaxMethodEnum }),
      fiat: t.expose('fiat', { type: FiatEnum }),
      files: t.relation('files'),
      wallets: t.relation('wallets'),
      walletHistories: t.relation('walletHistories'),
    }),
  });

  schemaBuilder.queryFields((t) => ({
    allPortfolios: t.prismaField({
      type: ['Portfolio'],
      args: {},
      resolve: async (query, _root, _args, _context, _info) => {
        return prisma.portfolio.findMany({ ...query });
      },
    }),
  }));

  schemaBuilder.mutationFields((t) => ({
    createPortfolio: t.prismaField({
      type: 'Portfolio',
      args: {
        name: t.arg.string({ required: true }),
        taxMethod: t.arg({ type: TaxMethodEnum, required: true }),
        fiat: t.arg({ type: FiatEnum, required: true }),
      },
      resolve: async (_query, _parent, args, _context, _info) => {
        return prisma.portfolio.create({ data: { ...args } });
      },
    }),
  }));
}
