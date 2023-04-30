import { SchemaBuilderType } from '../schema';

export function initWallet(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.prismaObject('Wallet', {
		fields: (t) => ({
			id: t.expose('id', { type: 'BigInt' }),
			coin: t.exposeString('coin'),
			amount: t.expose('amount', { type: 'Decimal' }),
			avcoFiatPerUnit: t.expose('avcoFiatPerUnit', { type: 'Decimal' }),
			totalFiat: t.expose('totalFiat', { type: 'Decimal' }),
			portpholioId: t.expose('portpholioId', { type: 'BigInt' }),
			portpholio: t.relation('portpholio'),
		}),
	});
}
