import { objectType, queryField } from 'nexus'

export const TransactionTaxEvent = objectType({
  name: 'TransactionTaxEvent',
  definition(t) {
    t.model.id()
    t.model.profitInFiat()
    t.model.expensesInFiat()
    t.model.transactionId()
    t.model.transaction()
    t.model.transactionExpensesDetail()
  },
})

export const Query = queryField((t) => {
  t.crud.transactionTaxEvents()
  t.crud.transactionTaxEvent()
})
