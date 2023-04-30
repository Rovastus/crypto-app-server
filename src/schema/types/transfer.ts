import { SchemaBuilderType } from '../schema';

export function initTransfer(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.prismaObject('Transfer', {
		fields: (t) => ({
			id: t.expose('id', { type: 'BigInt' }),
			fee: t.expose('fee', { type: 'Decimal' }),
			feeCoin: t.exposeString('feeCoin'),
			time: t.expose('time', { type: 'Date' }),
			file: t.relation('file'),
		}),
	});
}
