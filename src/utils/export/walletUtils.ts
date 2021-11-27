import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime'

export const getRecordFromWallet = function getRecordFromWallet(
  wallet: Array<PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput>,
  coin: string,
): PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput {
  const record: Array<PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput> = wallet.filter(
    (obj) => obj.coin === coin,
  )

  if (record.length === 0) {
    const newRecord: PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput = {
      coin: coin,
      amount: new Decimal(0),
      avcoFiatPerUnit: new Decimal(0),
      totalFiat: new Decimal(0),
    }
    wallet.push(newRecord)
    return newRecord
  }

  return record[0]
}

// take update operation
export const updateWalletRecordByTakingCoin = function updateWalletRecordByTakingCoin(
  record: PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput,
  amountToTake: Decimal,
  totalToTake: Decimal,
  time: Date,
): PrismaTypes.Prisma.WalletHistoryCreateWithoutPortpholioInput {
  // store old values
  const oldAmount = record.amount
  const oldAvcoFiatPerUnit = record.avcoFiatPerUnit
  const oldTotalFiat = record.totalFiat

  // calculate new values only for amount, totalFiat as avcoFiatPerUnit is same
  record.amount = new Decimal(record.amount)
    .minus(amountToTake)
    .toDecimalPlaces(8)

  // based of new amount value, update totalFiat and avcoFiatPerUnit
  if (record.amount.greaterThan(0)) {
    record.totalFiat = new Decimal(record.totalFiat)
      .minus(totalToTake)
      .toDecimalPlaces(8)
  } else {
    record.avcoFiatPerUnit = new Decimal(0)
    record.totalFiat = new Decimal(0)
  }

  // create WalletHistoryCreateWithoutPortpholioInput object
  return {
    coin: record.coin,
    oldAmount: oldAmount,
    oldAvcoFiatPerUnit: oldAvcoFiatPerUnit,
    oldTotalFiat: oldTotalFiat,
    newAmount: record.amount,
    newAvcoFiatPerUnit: record.avcoFiatPerUnit,
    newTotalFiat: record.totalFiat,
    time: time,
  }
}

// add update operation
export const updateWalletRecordByAddingCoin = function updateWalletRecordByAddingCoin(
  record: PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput,
  amountToAdd: Decimal,
  totalToAdd: Decimal,
  time: Date,
): PrismaTypes.Prisma.WalletHistoryCreateWithoutPortpholioInput {
  // store old values
  const oldAmount = record.amount
  const oldAvcoFiatPerUnit = record.avcoFiatPerUnit
  const oldTotalFiat = record.totalFiat

  // calculate new values for amount, totalFiat and avcoFiatPerUnit
  record.amount = new Decimal(record.amount)
    .plus(amountToAdd)
    .toDecimalPlaces(8)
  record.totalFiat = new Decimal(record.totalFiat)
    .plus(totalToAdd)
    .toDecimalPlaces(8)

  if (record.totalFiat.greaterThan(0)) {
    record.avcoFiatPerUnit = record.totalFiat
      .div(record.amount)
      .toDecimalPlaces(8)
  } else {
    record.avcoFiatPerUnit = new Decimal(0)
  }

  // create WalletHistoryCreateWithoutPortpholioInput object
  return {
    coin: record.coin,
    oldAmount: oldAmount,
    oldAvcoFiatPerUnit: oldAvcoFiatPerUnit,
    oldTotalFiat: oldTotalFiat,
    newAmount: record.amount,
    newAvcoFiatPerUnit: record.avcoFiatPerUnit,
    newTotalFiat: record.totalFiat,
    time: time,
  }
}
