import { list, nonNull, objectType, queryField } from 'nexus'

export const Transaction = objectType({
  name: 'Transaction',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.buy()
    t.model.buyCoin()
    t.model.price()
    t.model.priceCoin()
    t.model.fee()
    t.model.feeCoin()
    t.model.exportId()
    t.model.export()
    t.model.transactionTaxEvent()
  },
})

export const Query = queryField((t) => {
  t.crud.transactions()
  t.crud.transaction()
  t.field('transactionsByPortpholioId', {
    type: nonNull(list('Transaction')),
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

      return await ctx.prisma.transaction.findMany({
        where: { exportId: { in: exportIds.map((id) => id.id) } },
      })
    },
  })
})
