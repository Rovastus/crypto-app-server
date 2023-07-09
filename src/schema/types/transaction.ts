import { prisma } from '../db';
import { SchemaBuilderType } from '../schema';

export function initTransaction(schemaBuilder: SchemaBuilderType) {
  schemaBuilder.prismaObject('Transaction', {
    fields: (t) => ({
      id: t.expose('id', { type: 'BigInt' }),
      buy: t.expose('buy', { type: 'Decimal' }),
      buyCoin: t.exposeString('buyCoin'),
      price: t.expose('price', { type: 'Decimal' }),
      priceCoin: t.exposeString('priceCoin'),
      fee: t.expose('fee', { type: 'Decimal' }),
      feeCoin: t.exposeString('feeCoin'),
      time: t.expose('time', { type: 'Date' }),
      file: t.relation('file'),
      transactionTaxEvents: t.relation('transactionTaxEvents'),
    }),
  });

  schemaBuilder.queryFields((t) => ({
    transactionsByPortfolioId: t.prismaField({
      type: ['Transaction'],
      args: {
        portfolioId: t.arg({ type: 'BigInt', required: true }),
        year: t.arg.int({ required: true }),
      },
      resolve: async (_query, _root, args, _context, _info) => {
        const fileIds: Array<{ id: bigint }> = await prisma.file.findMany({ select: { id: true }, where: { portfolioId: args.portfolioId } });

        const gte = new Date(args.year, 0, 1, 0, 0, 0, 0);
        const lte = new Date(args.year, 11, 31, 23, 59, 59, 999);

        return prisma.transaction.findMany({
          where: {
            fileId: { in: fileIds.map((id) => id.id) },
            time: {
              gte,
              lte,
            },
          },
        });
      },
    }),
  }));
}
