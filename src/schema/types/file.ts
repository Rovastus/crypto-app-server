import { SchemaBuilderType } from '../schema';
import { prisma } from '../db';
import * as PrismaTypes from '.prisma/client';
import { getPortpholioById } from '../../utils/db/portpholioUtils';
import { getWalletRecordsByPortpholioId } from '../../utils/db/walletUtils';
import { processFileExport } from '../../utils/file/fileUtils';
import moment from 'moment';

export interface FileJsonDataI {
	utcTime: Date;
	operation: string;
	description: string;
	data: string;
}

export function initFile(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.prismaObject('File', {
		fields: (t) => ({
			id: t.expose('id', { type: 'BigInt' }),
			name: t.exposeString('name'),
			jsonData: t.exposeString('jsonData'),
			portpholioId: t.expose('portpholioId', { type: 'BigInt' }),
			portpholio: t.relation('portpholio'),
			earns: t.relation('earns'),
			transactions: t.relation('transactions'),
			transfers: t.relation('transfers'),
		}),
	});

	schemaBuilder.queryFields((t) => ({
		filesByPortpholioId: t.prismaField({
			type: ['File'],
			args: {
				portpholioId: t.arg({ type: 'BigInt', required: true }),
			},
			resolve: async (_query, _root, args, _context, _info) => {
				return await prisma.file.findMany({
					where: { portpholioId: args.portpholioId },
				});
			},
		}),
	}));

	const FileJsonData = schemaBuilder.inputType('FileJsonData', {
		fields: (t) => ({
			utcTime: t.string({ required: true }),
			operation: t.string({ required: true }),
			description: t.string({ required: true }),
			data: t.string({ required: true }),
		}),
	});

	schemaBuilder.mutationFields((t) => ({
		importFile: t.prismaField({
			type: ['File'],
			args: {
				portpholioId: t.arg({ type: 'BigInt', required: true }),
				name: t.arg.string({ required: true }),
				jsonData: t.arg({ type: [FileJsonData], required: true }),
			},
			resolve: async (_query, _root, args, _context, _info) => {
				const portpholio: PrismaTypes.Portpholio = await getPortpholioById(args.portpholioId, prisma);
				const walletRecords: Array<PrismaTypes.Wallet> = await getWalletRecordsByPortpholioId(args.portpholioId, prisma);

				const data = await processFileExport(
					args.jsonData.map((obj) => {
						return {
							utcTime: moment(obj.utcTime).toDate(),
							operation: obj.operation,
							description: obj.description,
							data: obj.data,
						};
					}),
					walletRecords,
					prisma,
				);

				return await prisma.file.findMany({ where: { portpholioId: args.portpholioId } });
			},
		}),
	}));
}

/*
export const Mutation = mutationField((t) => {
  t.field('importFile', {
    type: 'File',
    args: {
      portpholioId: nonNull('BigInt'),
      name: nonNull(stringArg()),
      jsonData: nonNull(
        list(
          nonNull(
            inputObjectType({
              name: 'ProcessFileInput',
              definition(t) {
                t.nonNull.string('utcTime')
                t.nonNull.string('operation')
                t.nonNull.string('coin')
                t.nonNull.float('change')
              },
            }),
          ),
        ),
      ),
    },
    async resolve(_root, args, ctx) {
      const exportData: Array<ExportData> = Array.from(
        args.jsonData,
        (data) => {
          return {
            coin: data.coin,
            change: new Decimal(data.change),
            operation: data.operation,
            utcTime: moment.utc(data.utcTime).toDate(),
          }
        },
      )

      const portpholio: PrismaTypes.Portpholio = await getPortpholioById(
        args.portpholioId,
        ctx.prisma,
      )

      const walletRecords: Array<PrismaTypes.Wallet> =
        await getWalletRecordsByPortpholioId(args.portpholioId, ctx.prisma)

      const data = await processExportData(
        exportData,
        walletRecords,
        ctx.prisma,
      )

      const prismaPromises: PrismaTypes.PrismaPromise<any>[] = new Array()
      prismaPromises.push(
        ctx.prisma.file.create({
          data: {
            portpholio: {
              connect: {
                id: args.portpholioId,
              },
            },
            name: args.name,
            jsonData: JSON.stringify(args.jsonData),
            earn: { create: data.earns },
            transaction: { create: data.transactions },
          },
        }),
      )
      const walletUpsert: Array<PrismaTypes.Prisma.WalletUpsertWithWhereUniqueWithoutPortpholioInput> =
        Array.from(data.wallet, (obj) => {
          return {
            where: {
              portpholioId_coin_unique: {
                portpholioId: portpholio.id,
                coin: obj.coin,
              },
            },
            update: {
              amount: obj.amount,
              avcoFiatPerUnit: obj.avcoFiatPerUnit,
              totalFiat: obj.totalFiat,
            },
            create: {
              coin: obj.coin,
              amount: obj.amount,
              avcoFiatPerUnit: obj.avcoFiatPerUnit,
              totalFiat: obj.totalFiat,
            },
          }
        })
      prismaPromises.push(
        ctx.prisma.portpholio.update({
          where: {
            id: portpholio.id,
          },
          data: {
            wallet: {
              upsert: [...walletUpsert],
            },
            walletHistory: {
              create: [...data.walletHistory],
            },
          },
        }),
      )

      return await ctx.prisma.$transaction([...prismaPromises])[0]
    },
  })
})
*/
