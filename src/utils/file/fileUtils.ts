import * as PrismaTypes from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FileJsonDataI } from '../../schema/types/file';
import { EarnI, processEarn } from './earnUtils';
import { TransactionI, processTransaction } from './transactionUtils';
import { TransferI, processTransfer } from './transferUtils';

export interface WalletI {
  id?: bigint;
  coin: string;
  amount: Decimal;
  avcoFiatPerUnit: Decimal;
  totalFiat: Decimal;
}

export interface WalletHistoryI {
  coin: string;
  oldAmount: Decimal;
  oldAvcoFiatPerUnit: Decimal;
  oldTotalFiat: Decimal;
  newAmount: Decimal;
  newAvcoFiatPerUnit: Decimal;
  newTotalFiat: Decimal;
  time: Date;
}

export interface ProcessDataOutputI {
  wallets: Array<WalletI>;
  walletHistories: Array<WalletHistoryI>;
  transactions: Array<TransactionI>;
  transfers: Array<TransferI>;
  earns: Array<EarnI>;
}

export const processFileExport = async function processFileExport(
  fileData: FileJsonDataI[],
  walletsRecord: Array<PrismaTypes.Wallet>,
  prisma: PrismaTypes.PrismaClient,
): Promise<ProcessDataOutputI> {
  const processData = {
    wallets: Array.from(walletsRecord, (record) => {
      return {
        coin: record.coin,
        amount: new Decimal(record.amount),
        avcoFiatPerUnit: new Decimal(record.avcoFiatPerUnit),
        totalFiat: new Decimal(record.totalFiat),
      };
    }),
    walletHistories: new Array<WalletHistoryI>(),
    transactions: new Array<TransactionI>(),
    transfers: new Array<TransferI>(),
    earns: new Array<EarnI>(),
  };

  for (let i = 0; i < fileData.length; i++) {
    const row = fileData[i];
    switch (row.operation) {
      case 'Transaction':
        await processTransaction(row, processData, prisma);
        break;
      case 'Transfer':
        processTransfer(row, processData);
        break;
      case 'Earn':
        processEarn(row, processData);
        break;
      default:
        throw Error(`Operation ${row.operation} not supported. Data: ${row}`);
    }
  }

  return processData;
};
