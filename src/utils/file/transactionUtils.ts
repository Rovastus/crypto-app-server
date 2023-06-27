import * as PrismaTypes from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FileJsonDataI } from '../../schema/types/file';
import { getBinancePricePerCoinInFiat } from '../binanceApi';
import { getCoinPairPriceKraken } from '../db/krakenPriceUtils';
import { ProcessDataOutputI, WalletI } from './fileUtils';
import { getRecordFromWallet, updateWalletRecordByAddingCoin, updateWalletRecordByTakingCoin } from './walletUtils';

export interface TransactionJsonDataI {
  buy: Decimal;
  buyCoin: string;
  price: Decimal;
  priceCoin: string;
  fee: Decimal;
  feeCoin: string;
  description: string;
}

export interface TransactionI {
  buy: Decimal;
  buyCoin: string;
  price: Decimal;
  priceCoin: string;
  fee: Decimal;
  feeCoin: string;
  time: Date;
  transactionTaxEvents?: PrismaTypes.Prisma.TransactionTaxEventCreateNestedManyWithoutTransactionInput;
}

export interface TransactionTaxEventI {
  type: PrismaTypes.TransactionTaxEventTypeEnum;
  gainInFiat: Decimal;
  expensesInFiat: Decimal;
}

export const processTransaction = async function processTransaction(
  row: FileJsonDataI,
  processData: ProcessDataOutputI,
  prisma: PrismaTypes.PrismaClient,
): Promise<void> {
  const transactionJsonData = createTransactionJsonData(row.data);

  const buyWallet: undefined | WalletI = getWalletIfCoinNotFiat(processData.wallets, transactionJsonData.buyCoin);
  const priceWallet: undefined | WalletI = getWalletIfCoinNotFiat(processData.wallets, transactionJsonData.priceCoin);
  const feeWallet: undefined | WalletI = getWalletIfCoinNotFiat(processData.wallets, transactionJsonData.feeCoin);

  const transactionTaxEvents = new Array<TransactionTaxEventI>();
  if (needToPayTaxForFee(transactionJsonData) && feeWallet) {
    await pushTransactionFeeTaxEvent(feeWallet, transactionTaxEvents, transactionJsonData, row.utcTime, prisma);
  }

  if (needToPayTaxForBuy(transactionJsonData) && priceWallet) {
    await pushTransactionBuyTaxEvent(priceWallet, transactionTaxEvents, transactionJsonData, row.utcTime, prisma);
  }

  // create new transaction
  processData.transactions.push({
    buy: transactionJsonData.buy,
    buyCoin: transactionJsonData.buyCoin,
    price: transactionJsonData.price,
    priceCoin: transactionJsonData.priceCoin,
    fee: transactionJsonData.price,
    feeCoin: transactionJsonData.feeCoin,
    time: row.utcTime,
    transactionTaxEvents: {
      create: transactionTaxEvents,
    },
  });

  let totalBuy = transactionJsonData.buy;
  let totalPrice = transactionJsonData.price;
  let totalFee: undefined | Decimal = transactionJsonData.fee;

  // put fee to buy or price if it is possible
  if (transactionJsonData.feeCoin === transactionJsonData.buyCoin) {
    totalBuy = totalBuy.minus(totalFee);
    totalFee = undefined;
  } else if (transactionJsonData.priceCoin === transactionJsonData.buyCoin) {
    totalPrice = totalPrice.plus(totalFee);
    totalFee = undefined;
  }

  // update wallet records
  if (buyWallet) {
    let priceFiatValue = new Decimal(0);
    if (isCoinFiat(transactionJsonData.priceCoin)) {
      priceFiatValue = totalPrice;
    } else {
      const priceCoinInFiat = await getPricePerCoinInFiat(transactionJsonData.priceCoin, PrismaTypes.FiatEnum.EUR, row.utcTime, prisma);
      priceFiatValue = totalPrice.mul(priceCoinInFiat);
    }

    processData.walletHistories.push(updateWalletRecordByAddingCoin(buyWallet, totalBuy, priceFiatValue, row.utcTime));
  }

  if (priceWallet) {
    const amountToTake = totalPrice;
    const fiatToTake = amountToTake.mul(priceWallet.avcoFiatPerUnit);
    processData.walletHistories.push(updateWalletRecordByTakingCoin(priceWallet, amountToTake, fiatToTake, row.utcTime));
  }

  if (feeWallet && totalFee) {
    const amountToTake = totalFee;
    const fiatToTake = amountToTake.mul(feeWallet.avcoFiatPerUnit);
    processData.walletHistories.push(updateWalletRecordByTakingCoin(feeWallet, amountToTake, fiatToTake, row.utcTime));
  }
};

function createTransactionJsonData(data: string): TransactionJsonDataI {
  const obj = JSON.parse(data);

  return {
    buy: new Decimal(obj.buy),
    buyCoin: obj.buyCoin,
    price: new Decimal(obj.price),
    priceCoin: obj.priceCoin,
    fee: new Decimal(obj.fee),
    feeCoin: obj.feeCoin,
    description: obj.description,
  };
}

function getWalletIfCoinNotFiat(wallets: WalletI[], coin: string) {
  return !isCoinFiat(coin) ? getRecordFromWallet(wallets, coin) : undefined;
}

function isCoinFiat(coin: string) {
  return PrismaTypes.FiatEnum.EUR === coin;
}

function needToPayTaxForFee(transaction: TransactionJsonDataI): boolean {
  return !isCoinFiat(transaction.feeCoin) && transaction.feeCoin !== transaction.buyCoin;
}

function needToPayTaxForBuy(transaction: TransactionJsonDataI): boolean {
  return !isCoinFiat(transaction.priceCoin);
}

async function pushTransactionBuyTaxEvent(
  priceWallet: WalletI,
  transactionTaxEvents: Array<TransactionTaxEventI>,
  transaction: TransactionJsonDataI,
  time: Date,
  prisma: PrismaTypes.PrismaClient,
): Promise<void> {
  // calculate gain
  let gainInFiat = new Decimal(0);
  if (isCoinFiat(transaction.buyCoin)) {
    // Gain in fiat (e.g. EUR)
    gainInFiat = transaction.buy;
  } else {
    // Gain in coin (e.g. BTC)
    const fiatPricePerCoin = await getPricePerCoinInFiat(transaction.buyCoin, PrismaTypes.FiatEnum.EUR, time, prisma);
    gainInFiat = transaction.buy.mul(fiatPricePerCoin);
  }

  //calculate expense
  let feeInFiat = new Decimal(0);
  if (isCoinFiat(transaction.feeCoin)) {
    // fee is fiat
    feeInFiat = transaction.fee;
  } else if (transactionTaxEvents.length === 1) {
    // price of fee can be used from transaction event
    feeInFiat = new Decimal(transactionTaxEvents[0].gainInFiat);
  } else {
    // calculate price of fee
    const fiatPricePerFeeCoin = await getPricePerCoinInFiat(transaction.feeCoin, PrismaTypes.FiatEnum.EUR, time, prisma);
    feeInFiat = fiatPricePerFeeCoin.mul(transaction.fee);
  }

  const expensesInFiat = transaction.price.mul(priceWallet.avcoFiatPerUnit).plus(feeInFiat);

  transactionTaxEvents.push({
    type: PrismaTypes.TransactionTaxEventTypeEnum.BUY,
    gainInFiat: gainInFiat,
    expensesInFiat: expensesInFiat,
  });
}

// this method should be executed only when Fee is paid in BNB and buy coin was diffrent than BNB
async function pushTransactionFeeTaxEvent(
  feeWallet: WalletI,
  transactionTaxEvents: Array<TransactionTaxEventI>,
  transaction: TransactionJsonDataI,
  time: Date,
  prisma: PrismaTypes.PrismaClient,
): Promise<void> {
  const fiatPricePerCoin = await getPricePerCoinInFiat(transaction.feeCoin, PrismaTypes.FiatEnum.EUR, time, prisma);
  const gainInFiat = transaction.fee.mul(fiatPricePerCoin);
  const expensesInFiat = transaction.fee.mul(feeWallet.avcoFiatPerUnit);

  transactionTaxEvents.push({
    type: PrismaTypes.TransactionTaxEventTypeEnum.FEE,
    gainInFiat: gainInFiat,
    expensesInFiat: expensesInFiat,
  });
}

function getPricePerCoinInFiat(coin: string, description: string, time: Date, prisma: PrismaTypes.PrismaClient): Promise<Decimal> {
  if (description.startsWith('Binance')) {
    return getBinancePricePerCoinInFiat(coin, PrismaTypes.FiatEnum.EUR, time, prisma);
  } else if (description.startsWith('Kraken')) {
    return getCoinPairPriceKraken(coin + PrismaTypes.FiatEnum.EUR, time, prisma);
  }

  throw Error(`Description ${description} not supported.`);
}
