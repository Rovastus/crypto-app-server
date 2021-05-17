import * as axios from 'axios'
import * as PrismaTypes from '.prisma/client'
import { Decimal } from '@prisma/client/runtime'
import { CoinPair } from '../schema/types/coinPair'
import { time } from 'faker'
import { assertWrappingType } from 'graphql'

export const getBinanceCoinPairs = async function getBinanceCoinPairs(): Promise<
  Array<PrismaTypes.Prisma.CoinPairCreateInput>
> {
  const list: Array<PrismaTypes.Prisma.CoinPairCreateInput> = new Array()
  const response = await axios.default.get(
    'https://api.binance.com/api/v1/exchangeInfo',
  )
  response.data['symbols'].forEach((record) => {
    const pair: PrismaTypes.Prisma.CoinPairCreateInput = {
      pair: record['symbol'],
    }
    list.push(pair)
  })
  return list
}

export const getPricePerCoinInFiat = async function getPricePerCoinInFiat(
  fromCoin: string,
  toFiat: string,
  time: Date,
  prisma: PrismaTypes.PrismaClient,
): Promise<number> {
  const symbol = await getSymbol(fromCoin + toFiat, prisma)
  if (symbol) {
    // pair to fiat found
    return await getCoinPriceFromBinanceApi(symbol, time, prisma)
  }

  // pair to fiat not found, calculate via USDT
  const symbolUsdt = await getSymbol(fromCoin + 'USDT', prisma)
  const symbolFiat = await getSymbol(toFiat + 'USDT', prisma)

  if (!symbolUsdt || !symbolFiat) {
    throw new Error(`${symbolUsdt} or ${symbolFiat} coin pair not exists.`)
  }

  const coinUSDTPrice = await getCoinPriceFromBinanceApi(
    symbolUsdt,
    time,
    prisma,
  )

  const fiatUSDTPrice = await getCoinPriceFromBinanceApi(
    symbolFiat,
    time,
    prisma,
  )

  return coinUSDTPrice * fiatUSDTPrice
}

async function getSymbol(
  symbol: string,
  prisma: PrismaTypes.PrismaClient,
): Promise<PrismaTypes.CoinPair | null> {
  const coinPair: PrismaTypes.CoinPair | null = await prisma.coinPair.findUnique(
    { where: { pair: symbol } },
  )
  return coinPair
}

async function getCoinPairPriceHistory(
  coinPairId: bigint,
  time: Date,
  prisma: PrismaTypes.PrismaClient,
): Promise<PrismaTypes.CoinPairPriceHistory | null> {
  return await prisma.coinPairPriceHistory.findUnique({
    where: {
      time_coinPairId_unique: {
        coinPairId: coinPairId,
        time: time,
      },
    },
  })
}

async function getCoinPriceFromBinanceApi(
  symbol: PrismaTypes.CoinPair,
  time: Date,
  prisma: PrismaTypes.PrismaClient,
): Promise<number> {
  // check if record is already in DB
  const coinPairPriceHistory = await getCoinPairPriceHistory(
    symbol.id,
    time,
    prisma,
  )
  if (coinPairPriceHistory) {
    return coinPairPriceHistory.price.toNumber()
  }

  // Binance API call
  const startTime = time.valueOf()
  const endTime = time.valueOf() + 59999.0
  const url = `https://www.binance.com/api/v3/klines?symbol=${symbol.pair}&interval=1m&startTime=${startTime}&endTime=${endTime}`
  const response = await axios.default.get(url)
  const price = response.data[0][4]

  await prisma.coinPairPriceHistory.create({
    data: { price: price, time: time, url: url, coinPairId: symbol.id },
  })

  return price
}
