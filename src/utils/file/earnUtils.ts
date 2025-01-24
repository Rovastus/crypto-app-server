import { Decimal } from '@prisma/client/runtime/library';
import { FileJsonDataI } from '../../schema/types/file';
import { ProcessDataOutputI } from './fileUtils';
import { getRecordFromWallet, updateWalletRecordByAddingCoin } from './walletUtils';

export interface EarnJsonDataI {
  amount: Decimal;
  coin: string;
}

export interface EarnI {
  amount: Decimal;
  amountCoin: string;
  time: Date;
}

export const processEarn = function processEarn(row: FileJsonDataI, processData: ProcessDataOutputI): void {
  const earnJsonData = createEarnJsonData(row.data);

  // create earn record
  processData.earns.push({
    amount: earnJsonData.amount,
    amountCoin: earnJsonData.coin,
    time: row.utcTime,
  });

  // get wallet record + update wallet history
  const coinWallet = getRecordFromWallet(processData.wallets, earnJsonData.coin);
  processData.walletHistories.push(updateWalletRecordByAddingCoin(coinWallet, earnJsonData.amount, new Decimal(0), row.utcTime));
};

function createEarnJsonData(data: string): EarnJsonDataI {
  const obj = JSON.parse(data);

  let amount = new Decimal(obj.amount);

  if (obj.fee !== undefined) {
    amount = amount.minus(new Decimal(obj.fee));
  }

  return {
    amount: amount,
    coin: obj.coin,
  };
}
