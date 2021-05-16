import { objectType, queryField } from 'nexus'

export const CryptoCoinInWallet = objectType({
  name: 'CryptoCoinInWallet',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.amount()
    t.model.amountCoin()
    t.model.remainAmount()
    t.model.expensesInFiat()
    t.model.portpholioId()
    t.model.portpholio()
    t.model.earn()
    t.model.transaction()
    t.model.transactionExpensesDetail()
  },
})

export const Query = queryField((t) => {
  t.crud.cryptoCoinInWallets()
  t.crud.cryptoCoinInWallet()
})
