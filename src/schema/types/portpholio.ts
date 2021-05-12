import { objectType, queryField } from 'nexus'

export const Portpholio = objectType({
  name: 'Portpholio',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.exportId()
    t.model.export()
  },
})

export const Query = queryField((t) => {
  t.crud.portpholios()
  t.crud.portpholio()
})
