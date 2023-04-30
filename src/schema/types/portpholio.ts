import { FiatEnum, TaxMethodEnum } from '@prisma/client';
import { SchemaBuilderType } from '../schema';
import { prisma } from '../db';

export function initPortpholio(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.prismaObject('Portpholio', {
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
		allPortpholios: t.prismaField({
			type: ['Portpholio'],
			args: {},
			resolve: async (query, _root, _args, _context, _info) => {
				return await prisma.portpholio.findMany({ ...query });
			},
		}),
	}));

	schemaBuilder.queryFields((t) => ({
		getPortpholioById: t.prismaField({
			type: 'Portpholio',
			args: {
				portpholioId: t.arg({ type: 'BigInt', required: true }),
			},
			resolve: async (query, _root, args, _context, _info) => {
				return await prisma.portpholio.findUniqueOrThrow({ ...query, where: { id: args.portpholioId } });
			},
		}),
	}));

	schemaBuilder.mutationFields((t) => ({
		createPortpholio: t.prismaField({
			type: 'Portpholio',
			args: {
				name: t.arg.string({ required: true }),
				taxMethod: t.arg({ type: TaxMethodEnum, required: true }),
				fiat: t.arg({ type: FiatEnum, required: true }),
			},
			resolve: async (_query, _parent, args, _context, _info) => {
				const portpholio = await prisma.portpholio.create({ data: { ...args } });
				return portpholio;
			},
		}),
	}));
}
