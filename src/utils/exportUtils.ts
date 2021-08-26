import * as PrismaTypes from '.prisma/client'
import * as NexusTypes from 'nexus-typegen'
import * as moment from 'moment'
import { getPricePerCoinInFiat } from './binanceApi'
import { Decimal } from '@prisma/client/runtime'

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
    switch (data[i].operation) {
      case 'ETH 2.0 staking purchase':
        processedData.transactions.push(
          await createTransactionCreateInput(
            createTransactionsRecordForEth(data[i]),
            portpholio,
            prisma,
          ),
        )
        break
      case 'ETH 2.0 staking interest':
        processedData.earns.push(
          await createEarnCreateInput(data[i], portpholio, prisma),
        )
        break
      case 'POS savings purchase':
      case 'Savings purchase':
      case 'POS savings redemption':
      case 'Savings Principal redemption':
        break
      case 'POS savings interest':
      case 'Savings Interest':
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
        throw new Error(`${data[i].operation} operation not supported.`)
    }
  }

  return processedData
}

/*
-------------------
  ETH 2.0 Staking
-------------------
*/
function createTransactionsRecordForEth(data: {
  coin: string
  change: number
  operation: string
  utcTime: string
}): {
  coin: string
  change: number
  operation: string
  utcTime: string
}[] {
  const transactionRecordsEth = new Array()
  transactionRecordsEth.push({
    coin: 'ETH',
    change: data.change,
    operation: 'Transaction Related',
    utcTime: data.utcTime,
  })
  transactionRecordsEth.push({
    coin: 'BETH',
    change: data.change,
    operation: 'Buy',
    utcTime: data.utcTime,
  })
  transactionRecordsEth.push({
    coin: 'EUR',
    change: 0,
    operation: 'Fee',
    utcTime: data.utcTime,
  })
  return transactionRecordsEth
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
    data[0].utcTime !== data[1].utcTime ||
    data[0].utcTime !== data[2].utcTime
  ) {
    throw new Error('Different UTC_Time for transaction. Check export data.')
  }

  const buyRecord = getRecordByOperation(data, 'Buy')
  const transactionRelatedRecord = getRecordByOperation(
    data,
    'Transaction Related',
  )
  transactionRelatedRecord.change = Math.abs(transactionRelatedRecord.change)
  const feeRecord = getRecordByOperation(data, 'Fee')
  feeRecord.change = Math.abs(feeRecord.change)
  const time = moment.utc(buyRecord.utcTime).toDate()
  const expensesInFiat = await calucateExpensesInFiat(
    transactionRelatedRecord,
    feeRecord,
    portpholio,
    time,
    prisma,
  )
  const cryptoCoinInWallet: PrismaTypes.Prisma.CryptoCoinInWalletCreateNestedOneWithoutEarnInput = {
    create: {
      amount: buyRecord.change,
      amountCoin: buyRecord.coin,
      expensesInFiat: expensesInFiat,
      remainAmount: buyRecord.change,
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
    buy: buyRecord.change,
    buyCoin: buyRecord.coin,
    price: transactionRelatedRecord.change,
    priceCoin: transactionRelatedRecord.coin,
    fee: feeRecord.change,
    feeCoin: feeRecord.coin,
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
): Promise<Decimal> {
  const transactionRelatedPriceInFiat =
    transactionRelatedRecord.coin === portpholio.fiat
      ? new Decimal(transactionRelatedRecord.change)
      : (
          await getPricePerCoinInFiat(
            transactionRelatedRecord.coin,
            portpholio.fiat,
            time,
            prisma,
          )
        ).mul(transactionRelatedRecord.change)
  const feePriceInFiat =
    feeRecord.coin === portpholio.fiat
      ? new Decimal(feeRecord.change)
      : (
          await getPricePerCoinInFiat(
            feeRecord.coin,
            portpholio.fiat,
            time,
            prisma,
          )
        ).mul(feeRecord.change)
  return transactionRelatedPriceInFiat.plus(feePriceInFiat).toDecimalPlaces(8)
}

function getRecordByOperation(
  data: Array<NexusTypes.NexusGenInputs['ProcessExportInput']>,
  operation: string,
): NexusTypes.NexusGenInputs['ProcessExportInput'] {
  const record = data.filter((record) => {
    return record.operation === operation
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
  const time = moment.utc(data.utcTime).toDate()
  const amount = data.change
  const amountCoin = data.coin
  const pricePerCoinInFiat = await getPricePerCoinInFiat(
    amountCoin,
    portpholio.fiat,
    time,
    prisma,
  )

  const priceInFiat = pricePerCoinInFiat.mul(data.change).toDecimalPlaces(8)
  const earnTaxEvent: PrismaTypes.Prisma.EarnTaxEventCreateNestedOneWithoutEarnInput = {
    create: {
      gainInFiat: priceInFiat,
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
    amount: data.change,
    amountCoin: data.coin,
    time: moment.utc(data.utcTime).toDate(),
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
    amount: data.change,
    amountCoin: data.coin,
    time: moment.utc(data.utcTime).toDate(),
  }

  return depositObj
}
