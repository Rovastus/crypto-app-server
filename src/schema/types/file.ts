import * as PrismaTypes from '.prisma/client';
import moment from 'moment';
import { getPortfolioById } from '../../utils/db/portfolioUtils';
import { getWalletRecordsByPortfolioId } from '../../utils/db/walletUtils';
import { processFileExport } from '../../utils/file/fileUtils';
import { prisma } from '../db';
import { SchemaBuilderType } from '../schema';

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
      portfolioId: t.expose('portfolioId', { type: 'BigInt' }),
      portfolio: t.relation('portfolio'),
      earns: t.relation('earns'),
      transactions: t.relation('transactions'),
      transfers: t.relation('transfers'),
    }),
  });

  schemaBuilder.queryFields((t) => ({
    filesByPortfolioId: t.prismaField({
      type: ['File'],
      args: {
        portfolioId: t.arg({ type: 'BigInt', required: true }),
      },
      resolve: async (_query, _root, args, _context, _info) => {
        return prisma.file.findMany({
          where: { portfolioId: args.portfolioId },
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
      type: 'File',
      args: {
        portfolioId: t.arg({ type: 'BigInt', required: true }),
        name: t.arg.string({ required: true }),
        jsonData: t.arg({ type: [FileJsonData], required: true }),
      },
      resolve: async (_query, _root, args, _context, _info) => {
        const portfolio: PrismaTypes.Portfolio = await getPortfolioById(args.portfolioId, prisma);
        const walletRecords: Array<PrismaTypes.Wallet> = await getWalletRecordsByPortfolioId(portfolio.id, prisma);

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

        const prismaPromises: PrismaTypes.PrismaPromise<PrismaTypes.File | PrismaTypes.Portfolio>[] = [];
        prismaPromises.push(
          prisma.file.create({
            data: {
              portfolio: {
                connect: {
                  id: args.portfolioId,
                },
              },
              name: args.name,
              jsonData: JSON.stringify(args.jsonData),
              earns: { create: data.earns },
              transactions: { create: data.transactions },
            },
          }),
        );
        const walletUpsert: Array<PrismaTypes.Prisma.WalletUpsertWithWhereUniqueWithoutPortfolioInput> = Array.from(data.wallets, (obj) => {
          return {
            where: {
              portfolioId_coin_unique: {
                portfolioId: portfolio.id,
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
          };
        });
        prismaPromises.push(
          prisma.portfolio.update({
            where: {
              id: portfolio.id,
            },
            data: {
              wallets: {
                upsert: [...walletUpsert],
              },
              walletHistories: {
                create: [...data.walletHistories],
              },
            },
          }),
        );

        return (await prisma.$transaction([...prismaPromises]))[0] as PrismaTypes.File;
      },
    }),
  }));
}
