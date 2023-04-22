import { list, nonNull, objectType, queryField } from 'nexus'

export const Earn = objectType({
  name: 'Earn',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.amount()
    t.model.amountCoin()
    t.model.fileId()
    t.model.file()
  },
})

export const Query = queryField((t) => {
  t.crud.earns()
  t.crud.earn()
  t.field('earnsByPortpholioId', {
    type: nonNull(list('Earn')),
    args: {
      portpholioId: nonNull('BigInt'),
    },
    async resolve(_root, args, ctx) {
      const fileIds: Array<{
        id: bigint
      }> = await ctx.prisma.file.findMany({
        select: { id: true },
        where: { portpholioId: args.portpholioId },
      })

      return await ctx.prisma.earn.findMany({
        where: { fileId: { in: fileIds.map((id) => id.id) } },
      })
    },
  })
})
