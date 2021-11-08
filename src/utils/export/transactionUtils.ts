import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime'
import { FiatEnum } from '../../schema/types/enum/fiatEnum'
import { getPricePerCoinInFiat } from '../binanceApi'
import { ExportData } from './exportUtils'
import {
  getRecordFromWallet,
  updateWalletRecordByAddingCoin,
  updateWalletRecordByTakingCoin,
} from './walletUtils'

const BUY_OPERATION: string = 'Buy'
const TRANSACTION_RELATED_OPERATION: string = 'Transaction Related'
const FEE_OPERATION: string = 'Fee'
const BNB: string = 'BNB'

export const processTransaction = async function processTransaction(
  wallet: Array<PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput>,
  walletHistory: Array<PrismaTypes.Prisma.WalletHistoryCreateWithoutPortpholioInput>,
  transactions: Array<PrismaTypes.Prisma.TransactionCreateWithoutExportInput>,
  data: Array<ExportData>,
  prisma: PrismaTypes.PrismaClient,
): Promise<void> {
  // check data
  checkData(data)

  // get data records by operations from data list
  const buyRecord = getRecordByOperation(data, BUY_OPERATION)
  const transactionRelatedRecord = getRecordByOperation(
    data,
    TRANSACTION_RELATED_OPERATION,
  )
  transactionRelatedRecord.change = transactionRelatedRecord.change.abs()
  const feeRecord = getRecordByOperation(data, FEE_OPERATION)
  feeRecord.change = feeRecord.change.abs()

  let buyWallet:
    | undefined
    | PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput = undefined
  let priceWallet:
    | undefined
    | PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput = undefined
  let feeWallet:
    | undefined
    | PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput = undefined

  if (!isCoinFiat(buyRecord.coin)) {
    buyWallet = getRecordFromWallet(wallet, buyRecord.coin)
  }
  if (!isCoinFiat(transactionRelatedRecord.coin)) {
    priceWallet = getRecordFromWallet(wallet, transactionRelatedRecord.coin)
  }
  if (!isCoinFiat(feeRecord.coin)) {
    feeWallet = getRecordFromWallet(wallet, feeRecord.coin)
  }

  const transactionTaxEvents = new Array<PrismaTypes.Prisma.TransactionTaxEventCreateWithoutTransactionInput>()
  if (
    needToPayTax(
      buyRecord.coin,
      feeRecord.coin,
      PrismaTypes.TransactionTaxEventType.BUY,
    ) &&
    priceWallet
  ) {
    await createTransactionBuyTaxEvent(
      priceWallet,
      transactionTaxEvents,
      buyRecord,
      transactionRelatedRecord,
      feeRecord,
      prisma,
    )
  }
  if (
    needToPayTax(
      buyRecord.coin,
      feeRecord.coin,
      PrismaTypes.TransactionTaxEventType.FEE,
    ) &&
    feeWallet
  ) {
    await createTransactionFeeTaxEvent(
      feeWallet,
      transactionTaxEvents,
      feeRecord,
      prisma,
    )
  }

  // create new transaction
  transactions.push({
    buy: buyRecord.change,
    buyCoin: buyRecord.coin,
    price: transactionRelatedRecord.change,
    priceCoin: transactionRelatedRecord.coin,
    fee: feeRecord.change,
    feeCoin: feeRecord.coin,
    time: buyRecord.utcTime,
    transactionTaxEvent: {
      create: transactionTaxEvents,
    },
  })

  // update wallet records
  if (buyWallet) {
    let amountToAdd = buyRecord.change
    if (buyRecord.coin === feeRecord.coin) {
      amountToAdd = amountToAdd.minus(feeRecord.change)
    }

    let gainInFiat = new Decimal(0)
    if (isCoinFiat(transactionRelatedRecord.coin)) {
      gainInFiat = transactionRelatedRecord.change
    } else {
      const pricePerCoinInFiat = await getPricePerCoinInFiat(
        buyRecord.coin,
        PrismaTypes.Fiat.EUR,
        buyRecord.utcTime,
        prisma,
      )
      gainInFiat = amountToAdd.mul(pricePerCoinInFiat).toDecimalPlaces(8)
    }

    walletHistory.push(
      updateWalletRecordByAddingCoin(
        buyWallet,
        amountToAdd,
        gainInFiat,
        buyRecord.utcTime,
      ),
    )
  }

  if (priceWallet) {
    const amountToTake = transactionRelatedRecord.change
    const totalToTake = amountToTake
      .mul(priceWallet.avcoFiatPerUnit)
      .toDecimalPlaces(8)
    walletHistory.push(
      updateWalletRecordByTakingCoin(
        priceWallet,
        amountToTake,
        totalToTake,
        buyRecord.utcTime,
      ),
    )
  }

  if (feeWallet) {
    if (feeRecord.coin === BNB && buyRecord.coin !== BNB) {
      const amountToTake = feeRecord.change
      const totalToTake = amountToTake
        .mul(feeWallet.avcoFiatPerUnit)
        .toDecimalPlaces(8)
      walletHistory.push(
        updateWalletRecordByTakingCoin(
          feeWallet,
          amountToTake,
          totalToTake,
          buyRecord.utcTime,
        ),
      )
    }
  }
}

function checkData(data: Array<ExportData>) {
  if (
    data[0].utcTime.getTime() !== data[1].utcTime.getTime() ||
    data[0].utcTime.getTime() !== data[2].utcTime.getTime()
  ) {
    throw new Error('Different UTC_Time for transaction. Check export data.')
  }
}

function getRecordByOperation(
  data: Array<ExportData>,
  operation: string,
): ExportData {
  const records = data.filter((record) => {
    return record.operation === operation
  })

  // expecting only one record per operation
  if (records.length !== 1) {
    console.log(records)
    throw new Error(
      `${operation} operation missing or there are more than one record with that operation.`,
    )
  }

  return records[0]
}

function isCoinFiat(coin: string) {
  return PrismaTypes.Fiat.EUR === coin
}

async function createTransactionBuyTaxEvent(
  priceWallet: PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput,
  transactionTaxEvents: Array<PrismaTypes.Prisma.TransactionTaxEventCreateWithoutTransactionInput>,
  buyRecord: ExportData,
  transactionRelatedRecord: ExportData,
  feeRecord: ExportData,
  prisma: PrismaTypes.PrismaClient,
): Promise<void> {
  let gainInFiat = new Decimal(0)
  if (isCoinFiat(buyRecord.coin)) {
    // Gain in fiat (e.g. EUR)
    gainInFiat = buyRecord.change
  } else {
    // Gain in coin (e.g. BTC)
    const fiatPricePerCoin = await getPricePerCoinInFiat(
      buyRecord.coin,
      PrismaTypes.Fiat.EUR,
      buyRecord.utcTime,
      prisma,
    )
    gainInFiat = buyRecord.change.mul(fiatPricePerCoin).toDecimalPlaces(8)
  }

  let expensesInFiat = new Decimal(0)
  if (isCoinFiat(feeRecord.coin)) {
    // expenses buy (coin amount * wallet coin avcoFiatPerCoin) + Fee in fiat
    expensesInFiat = transactionRelatedRecord.change
      .mul(priceWallet.avcoFiatPerUnit)
      .toDecimalPlaces(8)
      .plus(feeRecord.change)
      .toDecimalPlaces(8)
  } else {
    // expenses buy (coin amount * wallet coin avcoFiatPerCoin) + (Fee * curent fee price)
    const fiatPricePerFeeCoin = await getPricePerCoinInFiat(
      feeRecord.coin,
      PrismaTypes.Fiat.EUR,
      feeRecord.utcTime,
      prisma,
    )
    const totalFiatPriceFee = fiatPricePerFeeCoin
      .mul(feeRecord.change)
      .toDecimalPlaces(8)
    expensesInFiat = transactionRelatedRecord.change
      .mul(priceWallet.avcoFiatPerUnit)
      .toDecimalPlaces(8)
      .plus(totalFiatPriceFee)
      .toDecimalPlaces(8)
  }

  transactionTaxEvents.push({
    type: PrismaTypes.TransactionTaxEventType.BUY,
    gainInFiat: gainInFiat,
    expensesInFiat: expensesInFiat,
  })
}

// this method should be executed only when Fee is paid in BNB and buy coin was diffrent than BNB
async function createTransactionFeeTaxEvent(
  feeWallet: PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput,
  transactionTaxEvents: Array<PrismaTypes.Prisma.TransactionTaxEventCreateWithoutTransactionInput>,
  feeRecord: ExportData,
  prisma: PrismaTypes.PrismaClient,
): Promise<void> {
  const fiatPricePerCoin = await getPricePerCoinInFiat(
    feeRecord.coin,
    PrismaTypes.Fiat.EUR,
    feeRecord.utcTime,
    prisma,
  )
  const gainInFiat = feeRecord.change.mul(fiatPricePerCoin).toDecimalPlaces(8)

  const expensesInFiat = feeRecord.change
    .mul(feeWallet.avcoFiatPerUnit)
    .toDecimalPlaces(8)

  transactionTaxEvents.push({
    type: PrismaTypes.TransactionTaxEventType.FEE,
    gainInFiat: gainInFiat,
    expensesInFiat: expensesInFiat,
  })
}

function needToPayTax(
  coinBuy: string,
  coinFee: string,
  type: PrismaTypes.TransactionTaxEventType,
): boolean {
  if (type === PrismaTypes.TransactionTaxEventType.FEE) {
    // need to pay taxes if fee was paid in BNB and buy coin wasn't BNB
    return coinFee === BNB && coinBuy !== BNB
  }

  if (coinBuy === PrismaTypes.Fiat.EUR) {
    // not need to pay taxes (e.g. EUR -> BTC)
    return false
  }
  // need to pay taxes (e.g. BTC -> EUR) or crypto crypto trade (e.g. BTC -> DOT)
  return true
}
