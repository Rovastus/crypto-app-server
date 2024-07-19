-- CreateEnum
CREATE TYPE "TaxMethodEnum" AS ENUM ('AVCO');

-- CreateEnum
CREATE TYPE "FiatEnum" AS ENUM ('EUR');

-- CreateEnum
CREATE TYPE "TransactionTaxEventTypeEnum" AS ENUM ('FEE', 'BUY');

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "taxMethod" "TaxMethodEnum" NOT NULL,
    "fiat" "FiatEnum" NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "jsonData" TEXT NOT NULL,
    "portfolioId" BIGINT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" BIGSERIAL NOT NULL,
    "coin" TEXT NOT NULL,
    "amount" DECIMAL(65,20) NOT NULL,
    "avcoFiatPerUnit" DECIMAL(65,20) NOT NULL,
    "totalFiat" DECIMAL(65,20) NOT NULL,
    "portfolioId" BIGINT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletHistory" (
    "id" BIGSERIAL NOT NULL,
    "coin" TEXT NOT NULL,
    "oldAmount" DECIMAL(65,20) NOT NULL,
    "oldAvcoFiatPerUnit" DECIMAL(65,20) NOT NULL,
    "oldTotalFiat" DECIMAL(65,20) NOT NULL,
    "newAmount" DECIMAL(65,20) NOT NULL,
    "newAvcoFiatPerUnit" DECIMAL(65,20) NOT NULL,
    "newTotalFiat" DECIMAL(65,20) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "portfolioId" BIGINT NOT NULL,

    CONSTRAINT "WalletHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGSERIAL NOT NULL,
    "buy" DECIMAL(65,20) NOT NULL,
    "buyCoin" TEXT NOT NULL,
    "price" DECIMAL(65,20) NOT NULL,
    "priceCoin" TEXT NOT NULL,
    "fee" DECIMAL(65,20) NOT NULL,
    "feeCoin" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "fileId" BIGINT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionTaxEvent" (
    "id" BIGSERIAL NOT NULL,
    "type" "TransactionTaxEventTypeEnum" NOT NULL,
    "gainInFiat" DECIMAL(65,20) NOT NULL,
    "expensesInFiat" DECIMAL(65,20) NOT NULL,
    "transactionId" BIGINT NOT NULL,

    CONSTRAINT "TransactionTaxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" BIGSERIAL NOT NULL,
    "fee" DECIMAL(65,20) NOT NULL,
    "feeCoin" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "fileId" BIGINT NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earn" (
    "id" BIGSERIAL NOT NULL,
    "amount" DECIMAL(65,20) NOT NULL,
    "amountCoin" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "fileId" BIGINT NOT NULL,

    CONSTRAINT "Earn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPairPriceHistoryKraken" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "openPrice" DECIMAL(65,20) NOT NULL,
    "closePrice" DECIMAL(65,20) NOT NULL,
    "coinPair" TEXT NOT NULL,

    CONSTRAINT "CoinPairPriceHistoryKraken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPairPriceHistory" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,20) NOT NULL,
    "url" TEXT NOT NULL,
    "coinPairId" BIGINT NOT NULL,

    CONSTRAINT "CoinPairPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPair" (
    "id" BIGSERIAL NOT NULL,
    "pair" TEXT NOT NULL,

    CONSTRAINT "CoinPair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_name_key" ON "Portfolio"("name");

-- CreateIndex
CREATE UNIQUE INDEX "File_name_key" ON "File"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_portfolioId_coin_key" ON "Wallet"("portfolioId", "coin");

-- CreateIndex
CREATE UNIQUE INDEX "CoinPairPriceHistory_time_coinPairId_key" ON "CoinPairPriceHistory"("time", "coinPairId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinPair_pair_key" ON "CoinPair"("pair");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletHistory" ADD CONSTRAINT "WalletHistory_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTaxEvent" ADD CONSTRAINT "TransactionTaxEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earn" ADD CONSTRAINT "Earn_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinPairPriceHistory" ADD CONSTRAINT "CoinPairPriceHistory_coinPairId_fkey" FOREIGN KEY ("coinPairId") REFERENCES "CoinPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
