import { BigIntResolver, DateTimeResolver } from 'graphql-scalars'

import { asNexusMethod } from 'nexus'

// method
export const GQLDate = asNexusMethod(DateTimeResolver, 'dateTime')
export const GQLBigInt = asNexusMethod(BigIntResolver, 'bigInt')

// object
export * as CoinPair from './coinPair'
export * as CoinPairPriceHistory from './coinPairPriceHistory'
export * as CryptoCoinInWallet from './cryptoCoinInWallet'
export * as Deposit from './deposit'
export * as Earn from './earn'
export * as EarnTaxEvent from './earnTaxEvent'
export * as Export from './export'
export * as Portpholio from './portpholio'
export * as Transaction from './transaction'
export * as TransactionExpensesDetail from './transactionExpensesDetail'
export * as TransactionTaxEvent from './transactionTaxEvent'
export * as Withdraw from './withdraw'

// enum
export * as FiatEnum from './enum/fiatEnum'
export * as TaxMethodEnum from './enum/taxMethodEnum'
export * as TransactionTaxEventType from './enum/transactionTaxEventType'
