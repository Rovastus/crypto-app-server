import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { getPricePerCoinInFiat } from './binanceApi'

export const calculateTaxesForTransactions =
  async function calculateTaxesForTransactions(
    portpholio: PrismaTypes.Portpholio,
    transactions: PrismaTypes.Transaction[],
    prisma: PrismaTypes.PrismaClient,
  ) {
    const cryptoCoinInWalletList = await prisma.cryptoCoinInWallet.findMany({
      where: {
        AND: [
          { portpholioId: portpholio.id },
          {
            NOT: {
              remainAmount: 0.0,
            },
          },
        ],
      },
      orderBy: {
        time: 'asc',
      },
    })

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]
      console.log(transaction, i)
      const needToPayTaxFromFee = needToPayTaxFromTransaction(
        transaction,
        portpholio,
        PrismaTypes.TransactionTaxEventType.FEE,
      )
      const needToPayTaxFromBuy = needToPayTaxFromTransaction(
        transaction,
        portpholio,
        PrismaTypes.TransactionTaxEventType.BUY,
      )
      if (needToPayTaxFromFee || needToPayTaxFromBuy) {
        const prismaPromises: PrismaTypes.PrismaPromise<any>[] = new Array()

        // Fee
        if (needToPayTaxFromFee) {
          const expensesDetails = await calculateExpensesInFiat(
            cryptoCoinInWalletList,
            transaction,
            PrismaTypes.TransactionTaxEventType.FEE,
          )
          console.log(expensesDetails)
          const transactionTaxEvent: PrismaTypes.Prisma.TransactionTaxEventCreateInput =
            {
              gainInFiat: await calculateTransactionGainInFiat(
                transaction,
                portpholio,
                PrismaTypes.TransactionTaxEventType.FEE,
                prisma,
              ),
              type: PrismaTypes.TransactionTaxEventType.FEE,
              expensesInFiat: expensesDetails.expensesInFiat,
              transaction: { connect: { id: transaction.id } },
              transactionExpensesDetail: {
                create: expensesDetails.transactionExpensesDetails,
              },
            }
          expensesDetails.cryptoCoinInWalletUpdated.forEach((record) => {
            console.log(record.id, record.remainAmount)
            prismaPromises.push(
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
          prismaPromises.push(
            prisma.transactionTaxEvent.create({ data: transactionTaxEvent }),
          )
        }

        // Buy
        if (needToPayTaxFromBuy) {
          const expensesDetails = await calculateExpensesInFiat(
            cryptoCoinInWalletList,
            transaction,
            PrismaTypes.TransactionTaxEventType.BUY,
          )
          console.log(expensesDetails)
          const transactionTaxEvent: PrismaTypes.Prisma.TransactionTaxEventCreateInput =
            {
              gainInFiat: await calculateTransactionGainInFiat(
                transaction,
                portpholio,
                PrismaTypes.TransactionTaxEventType.BUY,
                prisma,
              ),
              type: PrismaTypes.TransactionTaxEventType.BUY,
              expensesInFiat: expensesDetails.expensesInFiat,
              transaction: { connect: { id: transaction.id } },
              transactionExpensesDetail: {
                create: expensesDetails.transactionExpensesDetails,
              },
            }
          expensesDetails.cryptoCoinInWalletUpdated.forEach((record) => {
            console.log(record.id, record.remainAmount)
            prismaPromises.push(
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
          prismaPromises.push(
            prisma.transactionTaxEvent.create({ data: transactionTaxEvent }),
          )
        }

        await prisma.$transaction([...prismaPromises])
      }
    }
  }

function needToPayTaxFromTransaction(
  transaction: PrismaTypes.Transaction,
  portpholio: PrismaTypes.Portpholio,
  type: PrismaTypes.TransactionTaxEventType,
) {
  let coin =
    type === PrismaTypes.TransactionTaxEventType.FEE
      ? transaction.feeCoin
      : transaction.priceCoin

  if (coin === portpholio.fiat) {
    // not need to pay taxes -> BUY action (e.g. EUR -> BTC)
    return false
  }
  // need to pay taxes -> SELL action (e.g. BTC -> EUR) or crypto crypto trade (e.g. BTC -> DOT)
  return true
}

async function calculateTransactionGainInFiat(
  transaction: PrismaTypes.Transaction,
  portpholio: PrismaTypes.Portpholio,
  type: PrismaTypes.TransactionTaxEventType,
  prisma: PrismaTypes.PrismaClient,
): Promise<Decimal> {
  return type === PrismaTypes.TransactionTaxEventType.FEE
    ? await getCoinGainInFiat(
        transaction.feeCoin,
        portpholio.fiat,
        transaction.fee,
        transaction.time,
        true,
        prisma,
      )
    : await getCoinGainInFiat(
        transaction.buyCoin,
        portpholio.fiat,
        transaction.buy,
        transaction.time,
        false,
        prisma,
      )
}

async function getCoinGainInFiat(
  coin: string,
  fiat: string,
  amount: Decimal,
  time: Date,
  isFee: boolean,
  prisma: PrismaTypes.PrismaClient,
): Promise<Decimal> {
  if (coin === fiat) {
    // you don't have gain when fee is fiat as no crypto (BNB) -> fiat transaction
    return isFee ? new Decimal(0) : amount
  } else {
    const pricePerCoinInFiat = await getPricePerCoinInFiat(
      coin,
      fiat,
      time,
      prisma,
    )

    return pricePerCoinInFiat.mul(amount).toDecimalPlaces(8)
  }
}

async function calculateExpensesInFiat(
  cryptoCoinInWalletList: PrismaTypes.CryptoCoinInWallet[],
  transaction: PrismaTypes.Transaction,
  type: PrismaTypes.TransactionTaxEventType,
): Promise<{
  expensesInFiat: Decimal
  transactionExpensesDetails: PrismaTypes.Prisma.TransactionExpensesDetailCreateWithoutTransactionTaxEventInput[]
  cryptoCoinInWalletUpdated: { id: bigint; remainAmount: Decimal }[]
}> {
  let amount =
    type === PrismaTypes.TransactionTaxEventType.FEE
      ? transaction.fee
      : transaction.price
  const coin =
    type === PrismaTypes.TransactionTaxEventType.FEE
      ? transaction.feeCoin
      : transaction.priceCoin
  let totalExpensesInFiat = new Decimal(0)
  const transactionExpensesDetails: Array<PrismaTypes.Prisma.TransactionExpensesDetailCreateWithoutTransactionTaxEventInput> =
    new Array()
  const cryptoCoinInWalletUpdatedList: Array<{
    id: bigint
    remainAmount: Decimal
  }> = new Array()

  for (let i = 0; i < cryptoCoinInWalletList.length; i++) {
    if (
      cryptoCoinInWalletList[i].amountCoin === coin &&
      cryptoCoinInWalletList[i].remainAmount.greaterThan(0)
    ) {
      if (amount.greaterThan(cryptoCoinInWalletList[i].remainAmount)) {
        amount = amount.minus(cryptoCoinInWalletList[i].remainAmount)
        const tmpExpensesInFiat = cryptoCoinInWalletList[i].expensesInFiat
          .mul(
            cryptoCoinInWalletList[i].remainAmount.div(
              cryptoCoinInWalletList[i].amount,
            ),
          )
          .toDecimalPlaces(8)
        totalExpensesInFiat = totalExpensesInFiat
          .plus(tmpExpensesInFiat)
          .toDecimalPlaces(8)

        transactionExpensesDetails.push({
          amount: cryptoCoinInWalletList[i].remainAmount,
          cryptoCoinInWallet: { connect: { id: cryptoCoinInWalletList[i].id } },
          expensesInFiat: tmpExpensesInFiat,
        })
        cryptoCoinInWalletList[i].remainAmount = new Decimal(0)
        cryptoCoinInWalletUpdatedList.push({
          id: cryptoCoinInWalletList[i].id,
          remainAmount: cryptoCoinInWalletList[i].remainAmount,
        })
        continue
      }

      const tmpExpensesInFiat = cryptoCoinInWalletList[i].expensesInFiat
        .mul(amount.div(cryptoCoinInWalletList[i].amount))
        .toDecimalPlaces(8)
      totalExpensesInFiat = totalExpensesInFiat.plus(tmpExpensesInFiat)

      transactionExpensesDetails.push({
        amount: amount,
        cryptoCoinInWallet: { connect: { id: cryptoCoinInWalletList[i].id } },
        expensesInFiat: tmpExpensesInFiat,
      })
      cryptoCoinInWalletList[i].remainAmount =
        cryptoCoinInWalletList[i].remainAmount.minus(amount)
      cryptoCoinInWalletUpdatedList.push({
        id: cryptoCoinInWalletList[i].id,
        remainAmount: cryptoCoinInWalletList[i].remainAmount,
      })
      amount = new Decimal(0)
      break
    }
  }

  if (amount.greaterThan(0)) {
    throw new Error(
      `Calculate expenses in fiat failed, not enough ${coin} coins in wallet. Missing ${amount}.`,
    )
  }

  return {
    expensesInFiat: totalExpensesInFiat,
    transactionExpensesDetails: transactionExpensesDetails,
    cryptoCoinInWalletUpdated: cryptoCoinInWalletUpdatedList,
  }
}
