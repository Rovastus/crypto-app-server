import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from './db';
import { initCoinPair } from './types/coinPair';
import { initCoinPairPriceHistory } from './types/coinPairPriceHistory';
import { initCoinPairPriceHistoryKraken } from './types/coinPairPriceHistoryKraken';
import { initEarn } from './types/earn';
import { initEnums } from './types/enum';
import { initFile } from './types/file';
import { initPortfolio } from './types/portfolio';
import { initScalars } from './types/scalar';
import { initTransaction } from './types/transaction';
import { initTransactionTaxEvent } from './types/transactionTaxEvent';
import { initTransfer } from './types/transfer';
import { initWallet } from './types/wallet';
import { initWalletHistory } from './types/walletHistory';

interface SchemaBuilderTypes {
  PrismaTypes: PrismaTypes;
  Scalars: {
    Date: { Input: Date; Output: string | Date };
    BigInt: { Input: bigint | number; Output: bigint | string | number };
    Decimal: { Input: string | number | Decimal | null; Output: string | Decimal };
  };
}

export type SchemaBuilderType = PothosSchemaTypes.SchemaBuilder<PothosSchemaTypes.ExtendDefaultTypes<SchemaBuilderTypes>>;

export const schemaBuilder = new SchemaBuilder<SchemaBuilderTypes>({
  plugins: [PrismaPlugin],
  prisma: { client: prisma, exposeDescriptions: true, filterConnectionTotalCount: true },
});

schemaBuilder.queryType();
schemaBuilder.mutationType();

// scalars
initScalars(schemaBuilder);

// enums
initEnums(schemaBuilder);

// prisma objects
initPortfolio(schemaBuilder);
initFile(schemaBuilder);
initWallet(schemaBuilder);
initWalletHistory(schemaBuilder);
initTransaction(schemaBuilder);
initTransactionTaxEvent(schemaBuilder);
initTransfer(schemaBuilder);
initEarn(schemaBuilder);
initCoinPairPriceHistoryKraken(schemaBuilder);
initCoinPairPriceHistory(schemaBuilder);
initCoinPair(schemaBuilder);
