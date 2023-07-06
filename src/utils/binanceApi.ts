import * as PrismaTypes from '.prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as axios from 'axios';
import { setTimeout } from 'timers/promises';

const LIMIT_CALLS = 20;
const WAIT_TIME = 60000;
let callsCount = 0;

export const getBinanceCoinPairs = async function getBinanceCoinPairs(): Promise<Array<PrismaTypes.Prisma.CoinPairCreateInput>> {
  const list: Array<PrismaTypes.Prisma.CoinPairCreateInput> = [];
  const response = await axios.default.get('https://api.binance.com/api/v1/exchangeInfo');
  response.data['symbols'].forEach((record: { symbol: string }) => {
    list.push({ pair: record.symbol });
  });
  return list;
};

export const getBinancePricePerCoinInFiat = async function getBinancePricePerCoinInFiat(
  fromCoin: string,
  toFiat: PrismaTypes.FiatEnum,
  time: Date,
  prisma: PrismaTypes.PrismaClient,
): Promise<Decimal> {
  if ('BETH' === fromCoin) {
    return await getBethPrice(toFiat, time, prisma);
  }

  let symbol = await getSymbol(fromCoin + toFiat, prisma);
  if (symbol) {
    // pair to fiat found e.g (BTC/EUR)
    try {
      return await getCoinPriceFromBinanceApi(symbol, time, prisma);
    } catch (error: unknown) {
      if (!(error as string).startsWith('Binance API call')) {
        throw error;
      }
    }
  }

  symbol = await getSymbol(toFiat + fromCoin, prisma);
  if (symbol) {
    // pair to fiat found e.g (EUR/USDT or EUR/BUSD)
    const fiatPrice = await getCoinPriceFromBinanceApi(symbol, time, prisma);
    // need to divide as we have pair EUR/USDT and not USDT/EUR
    return new Decimal(1).div(fiatPrice).toDecimalPlaces(8);
  }

  // pair to fiat not found, calculate via USDT
  const symbolUsdt = await getSymbol(fromCoin + 'USDT', prisma);
  const symbolFiat = await getSymbol(toFiat + 'USDT', prisma);

  if (!symbolUsdt || !symbolFiat) {
    throw new Error(`${symbolUsdt} (${fromCoin + 'USDT'}) or ${symbolFiat} (${toFiat + 'USDT'})  coin pair not exists.`);
  }

  const coinUSDTPrice = await getCoinPriceFromBinanceApi(symbolUsdt, time, prisma);

  const fiatUSDTPrice = await getCoinPriceFromBinanceApi(symbolFiat, time, prisma);

  // need to divide as we have pair EUR/USDT and not USDT/EUR
  return coinUSDTPrice.div(fiatUSDTPrice).toDecimalPlaces(8);
};

function getSymbol(symbol: string, prisma: PrismaTypes.PrismaClient): Promise<PrismaTypes.CoinPair | null> {
  return prisma.coinPair.findUnique({ where: { pair: symbol } });
}

async function getCoinPairPriceHistory(coinPairId: bigint, time: Date, prisma: PrismaTypes.PrismaClient): Promise<PrismaTypes.CoinPairPriceHistory | null> {
  return await prisma.coinPairPriceHistory.findUnique({
    where: {
      time_coinPairId_unique: {
        coinPairId: coinPairId,
        time: time,
      },
    },
  });
}

async function getCoinPriceFromBinanceApi(symbol: PrismaTypes.CoinPair, time: Date, prisma: PrismaTypes.PrismaClient): Promise<Decimal> {
  // check if record is already in DB
  const coinPairPriceHistory = await getCoinPairPriceHistory(symbol.id, time, prisma);
  if (coinPairPriceHistory) {
    return coinPairPriceHistory.price;
  }

  // limit wait
  if (LIMIT_CALLS === callsCount) {
    await setTimeout(WAIT_TIME);
    callsCount = 0;
  }

  // Binance API call
  const startTime = time.valueOf() - 59999.0;
  const endTime = time.valueOf();
  const url = `https://www.binance.com/api/v3/klines?symbol=${symbol.pair}&interval=1m&startTime=${startTime}&endTime=${endTime}`;
  const response = await axios.default.get(url);

  if (response.data.length === 0) {
    throw `Binance API call ${url} return empty data.`;
  }

  const price = new Decimal(response.data[0][4]).toDecimalPlaces(8);

  await prisma.coinPairPriceHistory.create({
    data: { price: price, time: time, url: url, coinPairId: symbol.id },
  });

  return price;
}

async function getBethPrice(toFiat: PrismaTypes.FiatEnum, time: Date, prisma: PrismaTypes.PrismaClient): Promise<Decimal> {
  // calculate via ETH
  const symbolBeth = await getSymbol('BETHETH', prisma);
  const symbolFiat = await getSymbol('ETH' + toFiat, prisma);

  if (!symbolBeth || !symbolFiat) {
    throw new Error(`${symbolBeth} or ${symbolFiat} coin pair not exists.`);
  }

  const bethEthPrice = await getCoinPriceFromBinanceApi(symbolBeth, time, prisma);

  const fiatEthPrice = await getCoinPriceFromBinanceApi(symbolFiat, time, prisma);

  return bethEthPrice.mul(fiatEthPrice).toDecimalPlaces(8);
}
