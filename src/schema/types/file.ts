import {
  objectType,
  queryField,
  nonNull,
  list,
  inputObjectType,
  mutationField,
  stringArg,
} from 'nexus'

import * as moment from 'moment'
import * as PrismaTypes from '.prisma/client'
import { getPortpholioById } from '../../utils/db/portpholioUtils'
import { getWalletRecordsByPortpholioId } from '../../utils/db/walletUtils'
import { ExportData, processExportData } from '../../utils/export/exportUtils'
import { Decimal } from '@prisma/client/runtime'

export const File = objectType({
  name: 'File',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.jsonData()
    t.model.portpholioId()
    t.model.portpholio()
    t.model.earn()
    t.model.transaction()
  },
})

export const Query = queryField((t) => {
  t.crud.files()
  t.crud.file()
  t.field('filesByPortpholioId', {
    type: nonNull(list('File')),
    args: {
      portpholioId: nonNull('BigInt'),
    },
    async resolve(_root, args, ctx) {
      return await ctx.prisma.file.findMany({
        where: { portpholioId: args.portpholioId },
      })
    },
  })
})

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
