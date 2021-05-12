import { objectType, queryField } from 'nexus'

export const Transaction = objectType({
  name: 'Transaction',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.type()
    t.model.amount()
    t.model.amountCoin()
    t.model.price()
    t.model.priceInEur()
    t.model.priceCoin()
    t.model.fee()
    t.model.feeInEur()
    t.model.feeCoin()
    t.model.exportId()
    t.model.export()
    t.model.taxEvent()
    t.model.wallet()
  },
})

export const Query = queryField((t) => {
  t.crud.transactions()
  t.crud.transaction()
})
