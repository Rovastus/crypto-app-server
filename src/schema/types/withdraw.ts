import { list, nonNull, objectType, queryField } from 'nexus'

export const Withdraw = objectType({
  name: 'Withdraw',
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
  t.crud.withdraws()
  t.crud.withdraw()
  t.field('withdrawsByPortpholioId', {
    type: nonNull(list('Withdraw')),
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

      return await ctx.prisma.withdraw.findMany({
        where: { exportId: { in: exportIds.map((id) => id.id) } },
      })
    },
  })
})
