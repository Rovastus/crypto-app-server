import { BigIntResolver, DateTimeResolver } from 'graphql-scalars'

import { asNexusMethod } from 'nexus'

// method
export const GQLDate = asNexusMethod(DateTimeResolver, 'dateTime')
export const GQLBigInt = asNexusMethod(BigIntResolver, 'bigInt')

// object
export * as CoinPair from './coinPair'
export * as CoinPairPriceHistory from './coinPairPriceHistory'
export * as CoinPairPriceHistoryKraken from './coinPairPriceHistoryKraken'
export * as Earn from './earn'
export * as File from './file'
export * as Portpholio from './portpholio'
export * as Transaction from './transaction'
export * as TransactionTaxEvent from './transactionTaxEvent'
export * as Wallet from './wallet'
export * as WalletHistory from './walletHistory'

// enum
export * as FiatEnum from './enum/fiatEnum'
export * as TaxMethodEnum from './enum/taxMethodEnum'
export * as TransactionTaxEventTypeEnum from './enum/transactionTaxEventTypeEnum'
