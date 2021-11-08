import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime'
import { ExportData } from './exportUtils'
import {
  getRecordFromWallet,
  updateWalletRecordByAddingCoin,
} from './walletUtils'

export const processStakingInterest = function processStakingInterest(
  wallet: Array<PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput>,
  walletHistory: Array<PrismaTypes.Prisma.WalletHistoryCreateWithoutPortpholioInput>,
  earns: Array<PrismaTypes.Prisma.EarnCreateWithoutExportInput>,
  data: ExportData,
): void {
  // get wallet record
  const coinWallet = getRecordFromWallet(wallet, data.coin)

  // create new earn
  earns.push({
    amount: data.change,
    amountCoin: data.coin,
    time: data.utcTime,
  })

  // update wallet records
  walletHistory.push(
    updateWalletRecordByAddingCoin(
      coinWallet,
      data.change,
      new Decimal(0),
      data.utcTime,
    ),
  )
}
