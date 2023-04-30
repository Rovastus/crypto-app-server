import { SchemaBuilderType } from '../schema';
import { GraphQLDate } from 'graphql-scalars';
import { GraphQLBigInt } from 'graphql-scalars';
import { GraphQLDecimal } from 'prisma-graphql-type-decimal';

export function initScalars(schemaBuilder: SchemaBuilderType) {
	schemaBuilder.addScalarType('Date', GraphQLDate, {});
	schemaBuilder.addScalarType('BigInt', GraphQLBigInt, {});
	schemaBuilder.addScalarType('Decimal', GraphQLDecimal, {});
}
