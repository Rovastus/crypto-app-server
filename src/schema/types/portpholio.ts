import {
  objectType,
  queryField,
  nonNull,
  stringArg,
  mutationField,
} from 'nexus'

export const Portpholio = objectType({
  name: 'Portpholio',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.taxMethod()
    t.model.fiat()
    t.model.exports()
    t.model.cryptoCoinInWallet()
  },
})

export const Query = queryField((t) => {
  t.crud.portpholios()
  t.crud.portpholio()
})

export const Mutation = mutationField((t) => {
  t.field('createPortpholio', {
    type: 'Portpholio',
    args: {
      name: nonNull(stringArg()),
      taxMethod: nonNull('TaxMethod'),
      fiat: nonNull('Fiat'),
    },
    async resolve(_root, args, ctx) {
      const portpholio = await ctx.prisma.portpholio.create({
        data: {
          ...args,
        },
      })
      return portpholio
    },
  })
})
