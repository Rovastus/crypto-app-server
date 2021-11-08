import sys
import re
import requests
import pandas as pd
import numpy as np

SELL_OPERATION = 'Sell'
BUY_OPERATION = 'Buy'
TRANSACTION_RELATED_OPERATION = 'Transaction Related'
FEE_OPERATION = 'Fee'

def get_index_by_operation(df, indexes, operation):
    for i in indexes: 
        if df['Operation'][i] == operation:
            return i
    raise Exception(indexes, operation)   
    
def get_index_by_operation_and_price(df, indexes, operation, price, coin):
    price_float = float(price)
    if operation == TRANSACTION_RELATED_OPERATION or operation == FEE_OPERATION:
        price_float = price_float * -1

    for i in indexes: 
        if df['Operation'][i] == operation and float(df['Change'][i]) == price_float and df['Coin'][i] == coin:
            return i
    raise Exception(indexes, operation, price, coin)

#get pairs from binance
response = requests.get("https://api.binance.com/api/v1/exchangeInfo")
pairs = {}
for record in response.json()['symbols']:
    pairs[record['symbol']] = [record['baseAsset'], record['quoteAsset']]

#load csv files
export = pd.read_csv(sys.argv[1])
transactions = pd.read_csv(sys.argv[2])

#update Sell -> Buy
export['Operation'] = np.where(export['Operation'] == SELL_OPERATION, BUY_OPERATION, export['Operation']) 

#update Buy -> Transaction Related if change is lower than 0
export['Operation'] = np.where((export['Operation'] == BUY_OPERATION) & (export['Change'] < 0), TRANSACTION_RELATED_OPERATION, export['Operation']) 

export_copy = export.copy()
indexes_temp = []
indexes_sorted_temp = []
time_temp = ""

#sort buy, transaction related, fee operations
for i in export.index:
    if time_temp != export['UTC_Time'][i] or i == export.index.stop - 1:
        if i == export.index.stop - 1:
            if export['Operation'][i] == BUY_OPERATION or export['Operation'][i] == TRANSACTION_RELATED_OPERATION or export['Operation'][i] == FEE_OPERATION:
                indexes_temp.append(i)
    
        if len(indexes_temp) > 0:
            #sort indexes
            if len(indexes_temp) == 3: 
                indexes_sorted_temp.append(get_index_by_operation(export, indexes_temp, BUY_OPERATION))
                indexes_sorted_temp.append(get_index_by_operation(export, indexes_temp, TRANSACTION_RELATED_OPERATION))
                indexes_sorted_temp.append(get_index_by_operation(export, indexes_temp, FEE_OPERATION))
            else:
                filtered_transaction = transactions.loc[transactions['Date(UTC)'] == time_temp]
                for j in filtered_transaction.index:
                    pair_base = pairs[filtered_transaction['Pair'][j]][0]
                    pair_quote = pairs[filtered_transaction['Pair'][j]][1]
                    if filtered_transaction['Side'][j] == 'BUY':
                        buy_price = filtered_transaction['Executed'][j].replace(pair_base, '')
                        buy_coin = pair_base
                        transaction_related_price = filtered_transaction['Amount'][j].replace(pair_quote, '')
                        transaction_related_coin = pair_quote
                        fee_price = filtered_transaction['Fee'][j].endswith('00BNB') and filtered_transaction['Fee'][j].replace('BNB', '') or filtered_transaction['Fee'][j].replace(pair_base, '')
                        fee_coin = filtered_transaction['Fee'][j].endswith('00BNB') and 'BNB' or pair_base
                        indexes_sorted_temp.append(get_index_by_operation_and_price(export, indexes_temp, BUY_OPERATION, buy_price, buy_coin))
                        indexes_sorted_temp.append(get_index_by_operation_and_price(export, indexes_temp, TRANSACTION_RELATED_OPERATION, transaction_related_price, transaction_related_coin))
                        indexes_sorted_temp.append(get_index_by_operation_and_price(export, indexes_temp, FEE_OPERATION, fee_price, fee_coin))
                    elif filtered_transaction['Side'][j] == 'SELL':
                        buy_price = filtered_transaction['Amount'][j].replace(pair_quote, '')
                        buy_coin = pair_quote
                        transaction_related_price = filtered_transaction['Executed'][j].replace(pair_base, '')
                        transaction_related_coin = pair_base
                        fee_price = filtered_transaction['Fee'][j].endswith('00BNB') and filtered_transaction['Fee'][j].replace('BNB', '') or filtered_transaction['Fee'][j].replace(pair_quote, '')
                        fee_coin = filtered_transaction['Fee'][j].endswith('00BNB') and 'BNB' or pair_quote
                        indexes_sorted_temp.append(get_index_by_operation_and_price(export, indexes_temp, BUY_OPERATION, buy_price, buy_coin))
                        indexes_sorted_temp.append(get_index_by_operation_and_price(export, indexes_temp, TRANSACTION_RELATED_OPERATION, transaction_related_price, transaction_related_coin))
                        indexes_sorted_temp.append(get_index_by_operation_and_price(export, indexes_temp, FEE_OPERATION, fee_price, fee_coin))
                    else: 
                        raise Exception(j, filtered_transaction['Side'][j])

            print(indexes_temp)
            print(indexes_sorted_temp)
            for idx, value in enumerate(indexes_temp):
                export.iloc[value] = export_copy.iloc[indexes_sorted_temp[idx]]
            
            indexes_temp = []
            indexes_sorted_temp = []

    time_temp = export['UTC_Time'][i]
        
    if export['Operation'][i] == BUY_OPERATION or export['Operation'][i] == TRANSACTION_RELATED_OPERATION or export['Operation'][i] == FEE_OPERATION:
        indexes_temp.append(i)

export.to_csv(sys.argv[1], index=False)