import { objectType, queryField } from 'nexus'

export const Wallet = objectType({
  name: 'Wallet',
  definition(t) {
    t.model.id()
    t.model.amount()
    t.model.amountCoin()
    t.model.remain()
    t.model.portpholioId()
    t.model.transactionId()
    t.model.earnId()
    t.model.earn()
    t.model.portpholio()
    t.model.transaction()
  },
})

export const Query = queryField((t) => {
  t.crud.wallets()
  t.crud.wallet()
})
