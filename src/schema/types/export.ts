import {
  objectType,
  queryField,
  nonNull,
  list,
  inputObjectType,
  mutationField,
  stringArg,
} from 'nexus'

import * as PrismaTypes from '.prisma/client'
import { getPortpholioById } from '../../utils/portpholioUtils'
import { processExportData } from '../../utils/exportUtils'

export const Export = objectType({
  name: 'Export',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.jsonData()
    t.model.portpholioId()
    t.model.portpholio()
    t.model.deposit()
    t.model.earn()
    t.model.transaction()
    t.model.withdraw()
  },
})

export const Query = queryField((t) => {
  t.crud.exports()
  t.crud.export()
})

export const Mutation = mutationField((t) => {
  t.field('importExport', {
    type: 'Export',
    args: {
      portpholioId: nonNull('BigInt'),
      name: nonNull(stringArg()),
      jsonData: nonNull(
        list(
          nonNull(
            inputObjectType({
              name: 'ProcessExportInput',
              definition(t) {
                t.nonNull.string('UTC_Time')
                t.nonNull.string('Account')
                t.nonNull.string('Operation')
                t.nonNull.string('Coin')
                t.nonNull.float('Change')
                t.nonNull.string('Remark')
              },
            }),
          ),
        ),
      ),
    },
    async resolve(_root, args, ctx) {
      const portpholio: PrismaTypes.Portpholio = await getPortpholioById(
        args.portpholioId,
        ctx.prisma,
      )

      const processedData = await processExportData(
        args.jsonData,
        portpholio,
        ctx.prisma,
      )
      const exportCreateInput: PrismaTypes.Prisma.ExportCreateInput = {
        portpholio: {
          connect: {
            id: args.portpholioId,
          },
        },
        name: args.name,
        jsonData: JSON.stringify(args.jsonData),
        earn: {
          create: processedData.earns,
        },
        transaction: {
          create: processedData.transactions,
        },
        withdraw: {
          create: processedData.withdraws,
        },
        deposit: {
          create: processedData.deposits,
        },
      }

      const exportObj = await ctx.prisma.export.create({
        data: exportCreateInput,
      })

      console.log(exportObj)

      // calculate transaction taxes
      const transactions = await ctx.prisma.transaction.findMany({
        where: { exportId: exportObj.id },
      })

      return await ctx.prisma.export.findUnique({
        where: {
          id: exportObj.id,
        },
      })
    },
  })
})
