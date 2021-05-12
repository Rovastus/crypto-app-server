import {
  objectType,
  queryField,
  nonNull,
  list,
  inputObjectType,
  mutationField,
  stringArg
} from 'nexus'

import * as PrismaTypes from '.prisma/client'
import * as moment from 'moment';

export const Export = objectType({
  name: 'Export',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.jsonData()
    t.model.deposit()
    t.model.earn()
    t.model.portpholio()
    t.model.transaction()
    t.model.wallet()
    t.model.withdraw()
  },
})

export const Query = queryField((t) => {
  t.crud.exports()
  t.crud.export()
})

export const Mutation = mutationField((t) => {
  t.field('processExport', {
    type: 'Boolean',
    args: {
      exportName: nonNull(stringArg()),
      data: nonNull(
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
      const exportData: PrismaTypes.Prisma.ExportCreateInput = {
        name: args.exportName,
        jsonData: JSON.stringify(args.data),
      }
      const createdExport = await ctx.prisma.export.create({ data: exportData })
      const exportConnect: PrismaTypes.Prisma.ExportCreateNestedOneWithoutEarnInput = {
        connect: {
          id: createdExport.id,
        },
      }
      const earnData: PrismaTypes.Prisma.EarnCreateInput = {
        time: moment.utc(args.data[0].UTC_Time).toDate(),
        amount: args.data[0].Change,
        amountInEur: args.data[0].Change,
        amountCoin: args.data[0].Coin,
        export: exportConnect,
      }
      await ctx.prisma.earn.create({ data: earnData })
      return true
    },
  })
})
