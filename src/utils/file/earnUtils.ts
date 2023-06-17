import { FileJsonDataI } from '../../schema/types/file';
import { Decimal } from '@prisma/client/runtime/library';
import { getRecordFromWallet, updateWalletRecordByAddingCoin } from './walletUtils';
import { ProcessDataOutputI } from './fileUtils';

export interface EarnJsonDataI {
	amount: Decimal;
	coin: string;
}

export interface EarnI {
	amount: Decimal;
	amountCoin: string;
	time: Date;
}

export const processEarn = function processEarn(row: FileJsonDataI, processData: ProcessDataOutputI): void {
	const earnJsonData = createEarnJsonData(row.data);

	// create earn record
	processData.earns.push({
		amount: earnJsonData.amount,
		amountCoin: earnJsonData.coin,
		time: row.utcTime,
	});

	// get wallet record + update wallet history
	const coinWallet = getRecordFromWallet(processData.wallets, earnJsonData.coin);
	processData.walletHistories.push(updateWalletRecordByAddingCoin(coinWallet, earnJsonData.amount, new Decimal(0), row.utcTime));
};

function createEarnJsonData(data: string): EarnJsonDataI {
	const obj = JSON.parse(data);

	return {
		amount: new Decimal(obj.amount),
		coin: obj.coin,
	};
}
