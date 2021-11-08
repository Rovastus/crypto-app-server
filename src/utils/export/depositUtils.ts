import * as PrismaTypes from '.prisma/client'
import { ExportData } from './exportUtils'

export const processDeposit = function processDeposit(
  deposits: Array<PrismaTypes.Prisma.DepositCreateWithoutExportInput>,
  data: ExportData,
): void {
  // create new deposit
  deposits.push({
    amount: data.change,
    coin: data.coin,
    time: data.utcTime,
  })
}
