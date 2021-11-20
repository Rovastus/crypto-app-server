import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime'
import {
  processEthStakingInterest,
  processEthStakingPurchase,
} from './stakingEthUtils'
import { processStakingInterest } from './stakingUtils'
import { processDeposit } from './depositUtils'
import { processWithdraw } from './withdrawUtils'
import { processTransaction } from './transactionUtils'

export interface ExportData {
  coin: string
  change: Decimal
  operation: string
  utcTime: Date
}

export const processExportData = async function processExportData(
  exportData: ExportData[],
  wallet: Array<PrismaTypes.Wallet>,
  prisma: PrismaTypes.PrismaClient,
): Promise<{
  earns: Array<PrismaTypes.Prisma.EarnCreateWithoutExportInput>
  transactions: Array<PrismaTypes.Prisma.TransactionCreateWithoutExportInput>
  withdraws: Array<PrismaTypes.Prisma.WithdrawCreateWithoutExportInput>
  deposits: Array<PrismaTypes.Prisma.DepositCreateWithoutExportInput>
  wallet: Array<PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput>
  walletHistory: Array<PrismaTypes.Prisma.WalletHistoryCreateWithoutPortpholioInput>
}> {
  const processedData = {
    earns: new Array<PrismaTypes.Prisma.EarnCreateWithoutExportInput>(),
    transactions: new Array<PrismaTypes.Prisma.TransactionCreateWithoutExportInput>(),
    withdraws: new Array<PrismaTypes.Prisma.WithdrawCreateWithoutExportInput>(),
    deposits: new Array<PrismaTypes.Prisma.DepositCreateWithoutExportInput>(),
    wallet: Array.from(wallet, (obj) => {
      const walletCreateWithoutPortpholioInput: PrismaTypes.Prisma.WalletCreateWithoutPortpholioInput = obj
      return walletCreateWithoutPortpholioInput
    }),
    walletHistory: new Array<PrismaTypes.Prisma.WalletHistoryCreateWithoutPortpholioInput>(),
  }

  for (let i = 0; i < exportData.length; i++) {
    switch (exportData[i].operation) {
      case 'ETH 2.0 Staking':
        if (exportData[i].coin === 'BETH') {
          await processEthStakingPurchase(
            processedData.wallet,
            processedData.walletHistory,
            processedData.transactions,
            exportData[i],
            prisma,
          )
        }
        break
      case 'ETH 2.0 Staking Rewards':
        processEthStakingInterest(
          processedData.wallet,
          processedData.walletHistory,
          processedData.earns,
          exportData[i],
        )
        break
      case 'POS savings purchase':
      case 'Savings purchase':
      case 'POS savings redemption':
      case 'Savings Principal redemption':
        break
      case 'POS savings interest':
      case 'Savings Interest':
        processStakingInterest(
          processedData.wallet,
          processedData.walletHistory,
          processedData.earns,
          exportData[i],
        )
        break
      case 'Buy':
      case 'Sell':
      case 'Transaction Related':
      case 'Fee':
        const transactionExportDataRecords = new Array<ExportData>()
        transactionExportDataRecords.push(exportData[i])
        transactionExportDataRecords.push(exportData[++i])
        transactionExportDataRecords.push(exportData[++i])
        await processTransaction(
          processedData.wallet,
          processedData.walletHistory,
          processedData.transactions,
          transactionExportDataRecords,
          prisma,
        )
        break
      case 'Deposit':
        processDeposit(processedData.deposits, exportData[i])
        break
      case 'Withdraw':
        processWithdraw(processedData.withdraws, exportData[i])
        break
      default:
        throw new Error(`${exportData[i].operation} operation not supported.`)
    }
  }

  return processedData
}
