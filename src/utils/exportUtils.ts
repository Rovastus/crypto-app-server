import * as PrismaTypes from '.prisma/client'
import * as NexusTypes from 'nexus-typegen'
import * as moment from 'moment'
import { getPricePerCoinInFiat } from './binanceApi'

export const processExportData = async function processExportData(
  data: NexusTypes.NexusGenInputs['ProcessExportInput'][],
  portpholio: PrismaTypes.Portpholio,
  prisma: PrismaTypes.PrismaClient,
): Promise<{
  earns: Array<PrismaTypes.Prisma.EarnCreateWithoutExportInput>
  transactions: Array<PrismaTypes.Prisma.TransactionCreateWithoutExportInput>
  withdraws: Array<PrismaTypes.Prisma.WithdrawCreateWithoutExportInput>
  deposits: Array<PrismaTypes.Prisma.DepositCreateWithoutExportInput>
}> {
  const processedData = {
    earns: new Array(),
    transactions: new Array(),
    withdraws: new Array(),
    deposits: new Array(),
  }

  for (let i = 0; i < data.length; i++) {
    switch (data[i].Operation) {
      case 'POS savings purchase':
        break
      case 'POS savings interest':
        processedData.earns.push(
          await createEarnCreateInput(data[i], portpholio, prisma),
        )
        break
      case 'Buy':
      case 'Transaction Related':
      case 'Fee':
        const transactionRecords = new Array()
        transactionRecords.push(data[i])
        transactionRecords.push(data[++i])
        transactionRecords.push(data[++i])
        processedData.transactions.push(
          await createTransactionCreateInput(
            transactionRecords,
            portpholio,
            prisma,
          ),
        )
        break
      case 'Deposit':
        processedData.deposits.push(createDepositCreateInput(data[i]))
        break
      case 'Withdraw':
        processedData.withdraws.push(createWithdrawCreateInput(data[i]))
        break
      default:
        throw new Error(`${data[i].Operation} operation not supported.`)
    }
  }

  return processedData
}

/*
-------------------
  Transaction
-------------------
*/

async function createTransactionCreateInput(
  data: Array<NexusTypes.NexusGenInputs['ProcessExportInput']>,
  portpholio: PrismaTypes.Portpholio,
  prisma: PrismaTypes.PrismaClient,
): Promise<PrismaTypes.Prisma.TransactionCreateWithoutExportInput> {
  if (
    data[0].UTC_Time !== data[1].UTC_Time ||
    data[0].UTC_Time !== data[2].UTC_Time
  ) {
    throw new Error('Different UTC_Time for transaction. Check export data.')
  }

  const buyRecord = getRecordByOperation(data, 'Buy')
  const transactionRelatedRecord = getRecordByOperation(
    data,
    'Transaction Related',
  )
  transactionRelatedRecord.Change = Math.abs(transactionRelatedRecord.Change)
  const feeRecord = getRecordByOperation(data, 'Fee')
  feeRecord.Change = Math.abs(feeRecord.Change)
  const time = moment.utc(buyRecord.UTC_Time).toDate()
  const expensesInFiat = await calucateExpensesInFiat(
    transactionRelatedRecord,
    feeRecord,
    portpholio,
    time,
    prisma,
  )
  const cryptoCoinInWallet: PrismaTypes.Prisma.CryptoCoinInWalletCreateNestedOneWithoutEarnInput = {
    create: {
      amount: buyRecord.Change,
      amountCoin: buyRecord.Coin,
      expensesInFiat: expensesInFiat,
      remainAmount: buyRecord.Change,
      time: time,
      portpholio: {
        connect: {
          id: portpholio.id,
        },
      },
    },
  }

  const transactionObj: PrismaTypes.Prisma.TransactionCreateWithoutExportInput = {
    time: time,
    buy: buyRecord.Change,
    buyCoin: buyRecord.Coin,
    price: transactionRelatedRecord.Change,
    priceCoin: transactionRelatedRecord.Coin,
    fee: feeRecord.Change,
    feeCoin: feeRecord.Coin,
    cryptoCoinInWallet: cryptoCoinInWallet,
  }

  return transactionObj
}

async function calucateExpensesInFiat(
  transactionRelatedRecord: NexusTypes.NexusGenInputs['ProcessExportInput'],
  feeRecord: NexusTypes.NexusGenInputs['ProcessExportInput'],
  portpholio: PrismaTypes.Portpholio,
  time: Date,
  prisma: PrismaTypes.PrismaClient,
): Promise<number> {
  const transactionRelatedPriceInFiat =
    transactionRelatedRecord.Coin === portpholio.fiat
      ? transactionRelatedRecord.Change
      : transactionRelatedRecord.Change *
        (await getPricePerCoinInFiat(
          transactionRelatedRecord.Coin,
          portpholio.fiat,
          time,
          prisma,
        ))
  const feePriceInFiat =
    feeRecord.Coin === portpholio.fiat
      ? feeRecord.Change
      : feeRecord.Change *
        (await getPricePerCoinInFiat(
          feeRecord.Coin,
          portpholio.fiat,
          time,
          prisma,
        ))
  return transactionRelatedPriceInFiat + feePriceInFiat
}

function getRecordByOperation(
  data: Array<NexusTypes.NexusGenInputs['ProcessExportInput']>,
  operation: string,
): NexusTypes.NexusGenInputs['ProcessExportInput'] {
  const record = data.filter((record) => {
    return record.Operation === operation
  })
  if (record.length !== 1) {
    console.log(record)
    throw new Error(
      `${operation} operation missing or there are more than one record with that operation.`,
    )
  }
  return record[0]
}

/*
-------------------
  Earn
-------------------
*/

async function createEarnCreateInput(
  data: NexusTypes.NexusGenInputs['ProcessExportInput'],
  portpholio: PrismaTypes.Portpholio,
  prisma: PrismaTypes.PrismaClient,
): Promise<PrismaTypes.Prisma.EarnCreateWithoutExportInput> {
  const time = moment.utc(data.UTC_Time).toDate()
  const amount = data.Change
  const amountCoin = data.Coin
  const pricePerCoinInFiat = await getPricePerCoinInFiat(
    amountCoin,
    portpholio.fiat,
    time,
    prisma,
  )
  const priceInFiat = pricePerCoinInFiat * data.Change
  const earnTaxEvent: PrismaTypes.Prisma.EarnTaxEventCreateNestedOneWithoutEarnInput = {
    create: {
      profitInFiat: priceInFiat,
    },
  }
  const cryptoCoinInWallet: PrismaTypes.Prisma.CryptoCoinInWalletCreateNestedOneWithoutEarnInput = {
    create: {
      amount: amount,
      amountCoin: amountCoin,
      expensesInFiat: priceInFiat,
      remainAmount: amount,
      time: time,
      portpholio: {
        connect: {
          id: portpholio.id,
        },
      },
    },
  }
  const earnObj: PrismaTypes.Prisma.EarnCreateWithoutExportInput = {
    time: time,
    amount: amount,
    amountCoin: amountCoin,
    earnTaxEvent: earnTaxEvent,
    cryptoCoinInWallet: cryptoCoinInWallet,
  }

  return earnObj
}

/*
-------------------
  Deposit
-------------------
*/

function createDepositCreateInput(
  data: NexusTypes.NexusGenInputs['ProcessExportInput'],
): PrismaTypes.Prisma.DepositCreateWithoutExportInput {
  const depositObj: PrismaTypes.Prisma.DepositCreateWithoutExportInput = {
    amount: data.Change,
    amountCoin: data.Coin,
    time: moment.utc(data.UTC_Time).toDate(),
  }

  return depositObj
}

/*
-------------------
  Withdraw
-------------------
*/
function createWithdrawCreateInput(
  data: NexusTypes.NexusGenInputs['ProcessExportInput'],
): PrismaTypes.Prisma.WithdrawCreateWithoutExportInput {
  const depositObj: PrismaTypes.Prisma.WithdrawCreateWithoutExportInput = {
    amount: data.Change,
    amountCoin: data.Coin,
    time: moment.utc(data.UTC_Time).toDate(),
  }

  return depositObj
}
