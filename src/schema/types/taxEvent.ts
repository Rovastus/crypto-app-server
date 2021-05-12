import { objectType, queryField } from 'nexus'

export const TaxEvent = objectType({
  name: 'TaxEvent',
  definition(t) {
    t.model.id()
    t.model.amount()
    t.model.expenses()
    t.model.profit()
    t.model.taxToBePaid()
    t.model.expensesDetailsId()
    t.model.transactionId()
    t.model.expensesDetails()
    t.model.transaction()
  },
})

export const Query = queryField((t) => {
  t.crud.taxEvents()
  t.crud.taxEvent()
})
