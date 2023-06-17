import { FileJsonDataI } from '../../schema/types/file';
import { Decimal } from '@prisma/client/runtime/library';
import { ProcessDataOutputI } from './fileUtils';
import { getRecordFromWallet, updateWalletRecordByTakingCoin } from './walletUtils';

export interface TranferJsonDataI {
	fee: Decimal;
	coin: string;
}
export interface TransferI {
	fee: Decimal;
	feeCoin: string;
	time: Date;
}

export const processTransfer = function processTransfer(row: FileJsonDataI, processData: ProcessDataOutputI): void {
	const transferJsonData = createTransferJsonData(row.data);

	// create transfer record
	processData.transfers.push({
		fee: transferJsonData.fee,
		feeCoin: transferJsonData.coin,
		time: row.utcTime,
	});

	// get wallet record + update wallet history
	const coinWallet = getRecordFromWallet(processData.wallets, transferJsonData.coin);
	processData.walletHistories.push(updateWalletRecordByTakingCoin(coinWallet, transferJsonData.fee, new Decimal(0), row.utcTime));
};

function createTransferJsonData(data: string): TranferJsonDataI {
	const obj = JSON.parse(data);

	return {
		fee: new Decimal(obj.fee),
		coin: obj.coin,
	};
}
