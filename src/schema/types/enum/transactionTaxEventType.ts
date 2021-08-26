import { enumType } from 'nexus'

export const TransactionTaxEventType = enumType({
  name: 'TransactionTaxEventType',
  members: ['FEE', 'BUY'],
})
