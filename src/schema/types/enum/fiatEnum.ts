import { enumType } from 'nexus'

export const FiatEnum = enumType({
  name: 'Fiat',
  members: ['EUR', 'USD'],
})
