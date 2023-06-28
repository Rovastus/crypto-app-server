import { GraphQLBigInt, GraphQLDate } from 'graphql-scalars';
import { GraphQLDecimal } from 'prisma-graphql-type-decimal';
import { SchemaBuilderType } from '../schema';

export function initScalars(schemaBuilder: SchemaBuilderType) {
  schemaBuilder.addScalarType('Date', GraphQLDate, {});
  schemaBuilder.addScalarType('BigInt', GraphQLBigInt, {});
  schemaBuilder.addScalarType('Decimal', GraphQLDecimal, {});
}
