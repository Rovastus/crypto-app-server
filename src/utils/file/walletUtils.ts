import { Decimal } from '@prisma/client/runtime/library';
import { WalletHistoryI, WalletI } from './fileUtils';

export const getRecordFromWallet = function getRecordFromWallet(wallets: Array<WalletI>, coin: string): WalletI {
  const record: WalletI | undefined = wallets.find((obj) => obj.coin === coin);

  if (!record) {
    const newRecord: WalletI = {
      coin: coin,
      amount: new Decimal(0),
      avcoFiatPerUnit: new Decimal(0),
      totalFiat: new Decimal(0),
    };
    wallets.push(newRecord);
    return newRecord;
  }

  return record;
};

// take update operation
export const updateWalletRecordByTakingCoin = function updateWalletRecordByTakingCoin(
  record: WalletI,
  amountToTake: Decimal,
  totalFiatToTake: Decimal,
  time: Date,
): WalletHistoryI {
  // store old values
  const oldAmount = record.amount;
  const oldAvcoFiatPerUnit = record.avcoFiatPerUnit;
  const oldTotalFiat = record.totalFiat;

  // calculate new values only for amount, totalFiat as avcoFiatPerUnit is same
  record.amount = record.amount.minus(amountToTake);

  // based of new amount value, update totalFiat and avcoFiatPerUnit
  if (record.amount.greaterThan(0)) {
    record.totalFiat = record.totalFiat.minus(totalFiatToTake);
  } else {
    record.avcoFiatPerUnit = new Decimal(0);
    record.totalFiat = new Decimal(0);
  }

  // create WalletHistoryCreateWithoutPortfolioInput object
  return {
    coin: record.coin,
    oldAmount: oldAmount,
    oldAvcoFiatPerUnit: oldAvcoFiatPerUnit,
    oldTotalFiat: oldTotalFiat,
    newAmount: record.amount,
    newAvcoFiatPerUnit: record.avcoFiatPerUnit,
    newTotalFiat: record.totalFiat,
    time: time,
  };
};

// add update operation
export const updateWalletRecordByAddingCoin = function updateWalletRecordByAddingCoin(
  record: WalletI,
  amountToAdd: Decimal,
  fiatPriceToAdd: Decimal,
  time: Date,
): WalletHistoryI {
  // store old values
  const oldAmount = record.amount;
  const oldAvcoFiatPerUnit = record.avcoFiatPerUnit;
  const oldTotalFiat = record.totalFiat;

  // calculate new values for amount, totalFiat and avcoFiatPerUnit
  record.amount = record.amount.plus(amountToAdd);
  record.totalFiat = record.totalFiat.plus(fiatPriceToAdd);

  if (record.totalFiat.greaterThan(0)) {
    record.avcoFiatPerUnit = record.totalFiat.div(record.amount);
  } else {
    record.avcoFiatPerUnit = new Decimal(0);
  }

  // create WalletHistoryCreateWithoutPortfolioInput object
  return {
    coin: record.coin,
    oldAmount: oldAmount,
    oldAvcoFiatPerUnit: oldAvcoFiatPerUnit,
    oldTotalFiat: oldTotalFiat,
    newAmount: record.amount,
    newAvcoFiatPerUnit: record.avcoFiatPerUnit,
    newTotalFiat: record.totalFiat,
    time: time,
  };
};
