import { objectType, queryField } from 'nexus'

export const WalletHistory = objectType({
  name: 'WalletHistory',
  definition(t) {
    t.model.id()
    t.model.coin()
    t.model.oldAmount()
    t.model.oldAvcoFiatPerUnit()
    t.model.oldTotalFiat()
    t.model.newAmount()
    t.model.newAvcoFiatPerUnit()
    t.model.newTotalFiat()
    t.model.time()
    t.model.portpholioId()
    t.model.portpholio()
  },
})

export const Query = queryField((t) => {
  t.crud.walletHistories()
  t.crud.walletHistory()
})
