import { objectType, queryField } from 'nexus'

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
})
