import { objectType, queryField } from 'nexus'

export const ExpensesDetails = objectType({
  name: 'ExpensesDetails',
  definition(t) {
    t.model.id()
    t.model.amount()
    t.model.taxEvent()
  },
})

export const Query = queryField((t) => {
  t.crud.deposits()
  t.crud.deposit()
})
