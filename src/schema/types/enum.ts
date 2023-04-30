import { SchemaBuilderType } from '../schema';
import { TaxMethodEnum, FiatEnum, TransactionTaxEventTypeEnum } from '@prisma/client';

export function initEnums(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.enumType(TaxMethodEnum, { name: 'TaxMethodEnum' });
	schemaBuilder.enumType(FiatEnum, { name: 'FiatEnum' });
	schemaBuilder.enumType(TransactionTaxEventTypeEnum, {
		name: 'TransactionTaxEventTypeEnum',
	});
}
