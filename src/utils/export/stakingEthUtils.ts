import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime'
import { getPricePerCoinInFiat } from '../binanceApi'
import { ExportData } from './exportUtils'
import {
  getRecordFromWallet,
  updateWalletRecordByAddingCoin,
  updateWalletRecordByTakingCoin,
} from './walletUtils'

const ETH: string = 'ETH'
const BETH: string = 'BETH'

export const processEthStakingPurchase = async function processEthStakingPurchase(
  wallet: Array<PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput>,
  walletHistory: Array<PrismaTypes.Prisma.WalletHistoryCreateWithoutPortpholioInput>,
  transactions: Array<PrismaTypes.Prisma.TransactionCreateWithoutExportInput>,
  data: ExportData,
  prisma: PrismaTypes.PrismaClient,
): Promise<void> {
  // get wallet record
  const bethWallet = getRecordFromWallet(wallet, BETH)
  const ethWallet = getRecordFromWallet(wallet, ETH)

  // get BETH and ETH price per Unit
  const bethFiatPricePerUnit: Decimal = await getPricePerCoinInFiat(
    BETH,
    PrismaTypes.Fiat.EUR,
    data.utcTime,
    prisma,
  )
  const ethAvcoFiatPerUnit: Decimal = new Decimal(ethWallet.avcoFiatPerUnit)

  // calculate gain and expenses
  const gainInFiat = data.change.mul(bethFiatPricePerUnit).toDecimalPlaces(8)
  const expensesInFiat = data.change.mul(ethAvcoFiatPerUnit).toDecimalPlaces(8)

  // create new transaction
  transactions.push({
    buy: data.change,
    buyCoin: BETH,
    price: data.change,
    priceCoin: ETH,
    fee: new Decimal(0),
    feeCoin: BETH,
    time: data.utcTime,
    transactionTaxEvent: {
      create: {
        type: PrismaTypes.TransactionTaxEventType.BUY,
        gainInFiat: gainInFiat,
        expensesInFiat: expensesInFiat,
      },
    },
  })

  // update wallet records
  walletHistory.push(
    updateWalletRecordByAddingCoin(
      bethWallet,
      data.change,
      gainInFiat,
      data.utcTime,
    ),
  )
  walletHistory.push(
    updateWalletRecordByTakingCoin(
      ethWallet,
      data.change,
      expensesInFiat,
      data.utcTime,
    ),
  )
}

export const processEthStakingInterest = function processEthStakingInterest(
  wallet: Array<PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput>,
  walletHistory: Array<PrismaTypes.Prisma.WalletHistoryCreateWithoutPortpholioInput>,
  earns: Array<PrismaTypes.Prisma.EarnCreateWithoutExportInput>,
  data: ExportData,
): void {
  // get wallet record
  const bethWallet = getRecordFromWallet(wallet, BETH)

  // create new earn
  earns.push({
    amount: data.change,
    amountCoin: data.coin,
    time: data.utcTime,
  })

  // update wallet records
  walletHistory.push(
    updateWalletRecordByAddingCoin(
      bethWallet,
      data.change,
      new Decimal(0),
      data.utcTime,
    ),
  )
}
