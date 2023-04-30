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
		transactionsByPortpholioId: t.prismaField({
			type: ['Transaction'],
			args: {
				portpholioId: t.arg({ type: 'BigInt', required: true }),
			},
			resolve: async (_query, _root, args, _context, _info) => {
				const fileIds: Array<{ id: bigint }> = await prisma.file.findMany({ select: { id: true }, where: { portpholioId: args.portpholioId } });
				return await prisma.transaction.findMany({ where: { fileId: { in: fileIds.map((id) => id.id) } } });
			},
		}),
	}));
}
