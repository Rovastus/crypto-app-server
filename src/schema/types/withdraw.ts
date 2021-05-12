import { objectType, queryField } from 'nexus'

export const Deposit = objectType({
  name: 'Withdraw',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.amount()
    t.model.amountCoin()
    t.model.exportId()
    t.model.export()
  },
})

export const Query = queryField((t) => {
  t.crud.withdraws()
  t.crud.withdraw()
})
