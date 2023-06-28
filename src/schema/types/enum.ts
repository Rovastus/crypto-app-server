import { FiatEnum, TaxMethodEnum, TransactionTaxEventTypeEnum } from '@prisma/client';
import { SchemaBuilderType } from '../schema';

export function initEnums(schemaBuilder: SchemaBuilderType) {
  schemaBuilder.enumType(TaxMethodEnum, { name: 'TaxMethodEnum' });
  schemaBuilder.enumType(FiatEnum, { name: 'FiatEnum' });
  schemaBuilder.enumType(TransactionTaxEventTypeEnum, {
    name: 'TransactionTaxEventTypeEnum',
  });
}
