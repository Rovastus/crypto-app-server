import * as PrismaTypes from '.prisma/client'
import * as NexusTypes from 'nexus-typegen'
import * as moment from 'moment'
import { getPricePerCoinInFiat } from './binanceApi'

export const calculateTaxesForTransactions = async function calculateTaxesForTransactions(
  portpholio: PrismaTypes.Portpholio,
  exportObj: PrismaTypes.Export,
  transactions: PrismaTypes.Transaction[],
  prisma: PrismaTypes.PrismaClient,
) {
  const cryptoCoinInWalletList = await prisma.cryptoCoinInWallet.findMany({
    where: {
      NOT: {
        remainAmount: 0.0,
      },
    },
  })

  transactions.forEach((transaction) => {
    if (needToPayTaxFromTransaction(transaction, portpholio)) {
      const transactionTaxEvent: PrismaTypes.Prisma.TransactionTaxEventCreateInput = {
        profitInFiat: 0,
        expensesInFiat: 0,
        transaction: { connect: { id: transaction.id } },
        transactionExpensesDetail: undefined,
      }
      prisma.transactionTaxEvent.create({ data: transactionTaxEvent })
    }
  })
}

function needToPayTaxFromTransaction(
  transaction: PrismaTypes.Transaction,
  portpholio: PrismaTypes.Portpholio,
) {
  if (transaction.priceCoin === portpholio.fiat) {
    // not need to pay taxes -> BUY action (e.g. EUR -> BTC)
    return false
  }
  // need to pay taxes -> SELL action (e.g. BTC -> EUR) or crypto crypto trade (e.g. BTC -> DOT)
  return true
}
