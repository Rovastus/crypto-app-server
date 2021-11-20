import { list, nonNull, objectType, queryField } from 'nexus'
import * as PrismaTypes from '.prisma/client'

export const Deposit = objectType({
  name: 'Deposit',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.amount()
    t.model.coin()
    t.model.exportId()
    t.model.export()
  },
})

export const Query = queryField((t) => {
  t.crud.deposits()
  t.crud.deposit()
  t.field('depositsByPortpholioId', {
    type: nonNull(list('Deposit')),
    args: {
      portpholioId: nonNull('BigInt'),
    },
    async resolve(_root, args, ctx) {
      const exportIds: Array<{
        id: bigint
      }> = await ctx.prisma.export.findMany({
        select: { id: true },
        where: { portpholioId: args.portpholioId },
      })

      return await ctx.prisma.deposit.findMany({
        where: { exportId: { in: exportIds.map((id) => id.id) } },
      })
    },
  })
})
