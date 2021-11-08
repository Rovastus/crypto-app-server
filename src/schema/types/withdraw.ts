import { objectType, queryField } from 'nexus'

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
})
