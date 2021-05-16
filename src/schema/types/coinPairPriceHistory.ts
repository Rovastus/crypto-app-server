import { objectType, queryField, mutationField } from 'nexus'

export const CoinPairPriceHistory = objectType({
  name: 'CoinPairPriceHistory',
  definition(t) {
    t.model.id()
    t.model.time()
    t.model.price()
    t.model.url()
    t.model.coinPairId()
    t.model.coinPair()
  },
})

export const Query = queryField((t) => {
  t.crud.coinPairs()
  t.crud.coinPair()
})
