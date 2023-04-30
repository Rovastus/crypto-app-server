import moment from 'moment';
import { prisma } from '../db';
import { SchemaBuilderType } from '../schema';
import * as PrismaTypes from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export function initCoinPairPriceHistoryKraken(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.prismaObject('CoinPairPriceHistoryKraken', {
		fields: (t) => ({
			id: t.expose('id', { type: 'BigInt' }),
			time: t.expose('time', { type: 'Date' }),
			openPrice: t.expose('openPrice', { type: 'Decimal' }),
			closePrice: t.expose('closePrice', { type: 'Decimal' }),
			coinPair: t.exposeString('coinPair'),
		}),
	});

	const CoinPairPriceHistoryKrakenJsonData = schemaBuilder.inputType('CoinPairPriceHistoryKrakenJsonData', {
		fields: (t) => ({
			utcTimeUnix: t.int({ required: true }),
			openPrice: t.string({ required: true }),
			closePrice: t.string({ required: true }),
		}),
	});

	schemaBuilder.mutationFields((t) => ({
		importCoinPairPriceHistoryKrakenData: t.field({
			type: 'String',
			args: {
				coinPair: t.arg.string({ required: true }),
				jsonData: t.arg({ type: [CoinPairPriceHistoryKrakenJsonData], required: true }),
			},
			resolve: async (_parent, args, _context, _info) => {
				const importData: Array<PrismaTypes.Prisma.CoinPairPriceHistoryKrakenCreateManyInput> = Array.from(args.jsonData, (data) => {
					return {
						time: moment.unix(data.utcTimeUnix).toDate(),
						openPrice: new Decimal(data.openPrice),
						closePrice: new Decimal(data.closePrice),
						coinPair: args.coinPair,
					};
				});

				await prisma.coinPairPriceHistoryKraken.createMany({ data: importData });
				return 'File data was imported successfully.';
			},
		}),
	}));
}
