import { objectType, queryField } from 'nexus'

export const Wallet = objectType({
  name: 'Wallet',
  definition(t) {
    t.model.id()
    t.model.coin()
    t.model.amount()
    t.model.avcoFiatPerUnit()
    t.model.totalFiat()
    t.model.portpholioId()
    t.model.portpholio()
  },
})

export const Query = queryField((t) => {
  t.crud.wallets()
  t.crud.wallet()
})
