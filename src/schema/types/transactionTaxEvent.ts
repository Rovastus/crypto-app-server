import { TransactionTaxEventTypeEnum } from '@prisma/client';
import { SchemaBuilderType } from '../schema';

export function initTransactionTaxEvent(schemaBuilder: SchemaBuilderType) {
  schemaBuilder.prismaObject('TransactionTaxEvent', {
    fields: (t) => ({
      id: t.expose('id', { type: 'BigInt' }),
      type: t.expose('type', { type: TransactionTaxEventTypeEnum }),
      gainInFiat: t.expose('gainInFiat', { type: 'Decimal' }),
      expensesInFiat: t.expose('expensesInFiat', { type: 'Decimal' }),
      transaction: t.relation('transaction'),
    }),
  });
}
