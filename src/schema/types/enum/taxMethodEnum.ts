import { enumType } from 'nexus'

export const TaxMethodEnum = enumType({
  name: 'TaxMethod',
  members: ['FIFO', 'AVCO'],
})
