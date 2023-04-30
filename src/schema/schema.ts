import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import { Decimal } from '@prisma/client/runtime/library';
import { initScalars } from './types/scalar';
import { initEnums } from './types/enum';
import { initPortpholio } from './types/portpholio';
import { initFile } from './types/file';
import { initWallet } from './types/wallet';
import { initWalletHistory } from './types/walletHistory';
import { initTransaction } from './types/transaction';
import { initTransactionTaxEvent } from './types/transactionTaxEvent';
import { initTransfer } from './types/transfer';
import { initEarn } from './types/earn';
import { initCoinPairPriceHistory } from './types/coinPairPriceHistory';
import { initCoinPairPriceHistoryKraken } from './types/coinPairPriceHistoryKraken';
import { initCoinPair } from './types/coinPair';
import { prisma } from './db';

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
initPortpholio(schemaBuilder);
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
