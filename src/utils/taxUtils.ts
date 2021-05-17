import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime'
import { getPricePerCoinInFiat } from './binanceApi'

export const calculateTaxesForTransactions = async function calculateTaxesForTransactions(
  portpholio: PrismaTypes.Portpholio,
  transactions: PrismaTypes.Transaction[],
  prisma: PrismaTypes.PrismaClient,
) {
  const cryptoCoinInWalletList = await prisma.cryptoCoinInWallet.findMany({
    where: {
      NOT: {
        remainAmount: 0.0,
      },
    },
    orderBy: {
      time: 'asc',
    },
  })
  console.log(cryptoCoinInWalletList)
  transactions.forEach(async (transaction) => {
    console.log(
      transaction,
      needToPayTaxFromTransaction(transaction, portpholio),
    )
    if (needToPayTaxFromTransaction(transaction, portpholio)) {
      const expensesDetails = await calculateExpensesInFiat(
        cryptoCoinInWalletList,
        transaction,
      )
      const transactionTaxEvent: PrismaTypes.Prisma.TransactionTaxEventCreateInput = {
        gainInFiat: await calculateGainInFiat(transaction, portpholio, prisma),
        expensesInFiat: expensesDetails.expensesInFiat,
        transaction: { connect: { id: transaction.id } },
        transactionExpensesDetail: {
          create: expensesDetails.transactionExpensesDetails,
        },
      }
      console.log(expensesDetails.cryptoCoinInWalletUpdated)
      const cryptoCoinInWalletUpdates: PrismaTypes.PrismaPromise<any>[] = new Array()
      expensesDetails.cryptoCoinInWalletUpdated.forEach((record) => {
        cryptoCoinInWalletUpdates.push(
          prisma.cryptoCoinInWallet.update({
            where: {
              id: record.id,
            },
            data: {
              remainAmount: record.remainAmount,
            },
          }),
        )
      })

      await prisma.$transaction([
        prisma.transactionTaxEvent.create({ data: transactionTaxEvent }),
        ...cryptoCoinInWalletUpdates,
      ])
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

async function calculateGainInFiat(
  transaction: PrismaTypes.Transaction,
  portpholio: PrismaTypes.Portpholio,
  prisma: PrismaTypes.PrismaClient,
): Promise<number> {
  if (transaction.buyCoin === portpholio.fiat) {
    return transaction.buy.toNumber()
  }

  const pricePerCoinInFiat = await getPricePerCoinInFiat(
    transaction.buyCoin,
    portpholio.fiat,
    transaction.time,
    prisma,
  )

  return pricePerCoinInFiat * transaction.buy.toNumber()
}

async function calculateExpensesInFiat(
  cryptoCoinInWalletList: PrismaTypes.CryptoCoinInWallet[],
  transaction: PrismaTypes.Transaction,
): Promise<{
  expensesInFiat: number
  transactionExpensesDetails: PrismaTypes.Prisma.TransactionExpensesDetailCreateWithoutTransactionTaxEventInput[]
  cryptoCoinInWalletUpdated: { id: bigint; remainAmount: number }[]
}> {
  let price = transaction.price.toNumber()
  let totalExpensesInFiat = 0
  const transactionExpensesDetails: Array<PrismaTypes.Prisma.TransactionExpensesDetailCreateWithoutTransactionTaxEventInput> = new Array()
  const cryptoCoinInWalletUpdatedList: Array<{
    id: bigint
    remainAmount: number
  }> = new Array()

  for (let i = 0; i < cryptoCoinInWalletList.length; i++) {
    if (
      cryptoCoinInWalletList[i].amountCoin === transaction.priceCoin &&
      cryptoCoinInWalletList[i].remainAmount.toNumber() > 0.0
    ) {
      if (price > cryptoCoinInWalletList[i].remainAmount.toNumber()) {
        price = price - cryptoCoinInWalletList[i].remainAmount.toNumber()
        totalExpensesInFiat =
          totalExpensesInFiat +
          cryptoCoinInWalletList[i].expensesInFiat.toNumber() *
            (cryptoCoinInWalletList[i].remainAmount.toNumber() /
              cryptoCoinInWalletList[i].amount.toNumber())

        cryptoCoinInWalletList[i].remainAmount = new Decimal(0)
        cryptoCoinInWalletUpdatedList.push({
          id: cryptoCoinInWalletList[i].id,
          remainAmount: cryptoCoinInWalletList[i].remainAmount.toNumber(),
        })
        transactionExpensesDetails.push({
          amount: cryptoCoinInWalletList[i].remainAmount,
          cryptoCoinInWallet: { connect: { id: cryptoCoinInWalletList[i].id } },
          expensesInFiat: cryptoCoinInWalletList[i].expensesInFiat,
        })
        continue
      }

      const tmpExpensesInFiat =
        cryptoCoinInWalletList[i].expensesInFiat.toNumber() *
        (price / cryptoCoinInWalletList[i].amount.toNumber())
      totalExpensesInFiat = totalExpensesInFiat + tmpExpensesInFiat
      cryptoCoinInWalletList[i].remainAmount = new Decimal(
        cryptoCoinInWalletList[i].remainAmount.toNumber() - price,
      )
      cryptoCoinInWalletUpdatedList.push({
        id: cryptoCoinInWalletList[i].id,
        remainAmount: cryptoCoinInWalletList[i].remainAmount.toNumber(),
      })
      transactionExpensesDetails.push({
        amount: price,
        cryptoCoinInWallet: { connect: { id: cryptoCoinInWalletList[i].id } },
        expensesInFiat: tmpExpensesInFiat,
      })
      price = 0.0
      break
    }
  }

  if (price > 0.0) {
    throw new Error(
      `Calculate expenses in fiat failed, not enough coins in wallet. Missing ${price}.`,
    )
  }

  return {
    expensesInFiat: totalExpensesInFiat,
    transactionExpensesDetails: transactionExpensesDetails,
    cryptoCoinInWalletUpdated: cryptoCoinInWalletUpdatedList,
  }
}
