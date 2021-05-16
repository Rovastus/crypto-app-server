import { objectType, queryField } from 'nexus'

export const TransactionExpensesDetail = objectType({
  name: 'TransactionExpensesDetail',
  definition(t) {
    t.model.id()
    t.model.amount()
    t.model.expensesInFiat()
    t.model.cryptoCoinInWalletId()
    t.model.cryptoCoinInWallet()
    t.model.transactionTaxEventId()
    t.model.transactionTaxEvent()
  },
})

export const Query = queryField((t) => {
  t.crud.transactionExpensesDetails()
  t.crud.transactionExpensesDetail()
})
