import { objectType, queryField } from 'nexus'

export const Earn = objectType({
  name: 'Earn',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.amount()
    t.model.amountCoin()
    t.model.exportId()
    t.model.export()
    t.model.earnTaxEventId()
    t.model.earnTaxEvent()
    t.model.cryptoCoinInWalletId()
    t.model.cryptoCoinInWallet()
  },
})

export const Query = queryField((t) => {
  t.crud.earns()
  t.crud.earn()
})
