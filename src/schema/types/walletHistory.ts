import { SchemaBuilderType } from '../schema';

export function initWalletHistory(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.prismaObject('WalletHistory', {
		fields: (t) => ({
			id: t.expose('id', { type: 'BigInt' }),
			coin: t.exposeString('coin'),
			oldAmount: t.expose('oldAmount', { type: 'Decimal' }),
			oldAvcoFiatPerUnit: t.expose('oldAvcoFiatPerUnit', { type: 'Decimal' }),
			oldTotalFiat: t.expose('oldTotalFiat', { type: 'Decimal' }),
			newAmount: t.expose('newAmount', { type: 'Decimal' }),
			newAvcoFiatPerUnit: t.expose('newAvcoFiatPerUnit', { type: 'Decimal' }),
			newTotalFiat: t.expose('newTotalFiat', { type: 'Decimal' }),
			portpholioId: t.expose('portpholioId', { type: 'BigInt' }),
			portpholio: t.relation('portpholio'),
		}),
	});
}
