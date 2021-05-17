import { objectType, queryField } from 'nexus'

export const EarnTaxEvent = objectType({
  name: 'EarnTaxEvent',
  definition(t) {
    t.model.id()
    t.model.gainInFiat()
    t.model.earn()
  },
})

export const Query = queryField((t) => {
  t.crud.earnTaxEvents()
  t.crud.earnTaxEvent()
})
