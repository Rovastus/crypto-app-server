import { enumType } from 'nexus'

export const TransactionTaxEventTypeEnum = enumType({
  name: 'TransactionTaxEventType',
  members: ['FEE', 'BUY'],
})
