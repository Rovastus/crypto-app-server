import * as PrismaTypes from '.prisma/client'
import { ExportData } from './exportUtils'

export const processWithdraw = function processWithdraw(
  withdraws: Array<PrismaTypes.Prisma.WithdrawCreateWithoutExportInput>,
  data: ExportData,
): void {
  // create new withdraws
  withdraws.push({
    amount: data.change,
    coin: data.coin,
    time: data.utcTime,
  })
}
