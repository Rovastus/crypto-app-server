import { prisma } from '../db';
import { SchemaBuilderType } from '../schema';

export function initEarn(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.prismaObject('Earn', {
		fields: (t) => ({
			id: t.expose('id', { type: 'BigInt' }),
			amount: t.expose('amount', { type: 'Decimal' }),
			amountCoin: t.exposeString('amountCoin'),
			time: t.expose('time', { type: 'Date' }),
			file: t.relation('file'),
		}),
	});

	schemaBuilder.queryFields((t) => ({
		earnsByPortpholioId: t.prismaField({
			type: ['Earn'],
			args: {
				portpholioId: t.arg({ type: 'BigInt', required: true }),
			},
			resolve: async (_query, _root, args, _context, _info) => {
				const fileIds: Array<{ id: bigint }> = await prisma.file.findMany({ select: { id: true }, where: { portpholioId: args.portpholioId } });
				return await prisma.earn.findMany({ where: { fileId: { in: fileIds.map((id) => id.id) } } });
			},
		}),
	}));
}
