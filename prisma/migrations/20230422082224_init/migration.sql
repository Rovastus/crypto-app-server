-- CreateEnum
CREATE TYPE "TaxMethod" AS ENUM ('AVCO');

-- CreateEnum
CREATE TYPE "Fiat" AS ENUM ('EUR');

-- CreateTable
CREATE TABLE "Portpholio" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "taxMethod" "TaxMethod" NOT NULL,
    "fiat" "Fiat" NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "jsonData" TEXT NOT NULL,
    "portpholioId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" BIGSERIAL NOT NULL,
    "coin" TEXT NOT NULL,
    "amount" DECIMAL(65,20) NOT NULL,
    "avcoFiatPerUnit" DECIMAL(65,20) NOT NULL,
    "totalFiat" DECIMAL(65,20) NOT NULL,
    "portpholioId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
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
    "portpholioId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
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

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionTaxEvent" (
    "id" BIGSERIAL NOT NULL,
    "gainInFiat" DECIMAL(65,20) NOT NULL,
    "expensesInFiat" DECIMAL(65,20) NOT NULL,
    "transactionId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" BIGSERIAL NOT NULL,
    "fee" DECIMAL(65,20) NOT NULL,
    "feeCoin" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "fileId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earn" (
    "id" BIGSERIAL NOT NULL,
    "amount" DECIMAL(65,20) NOT NULL,
    "amountCoin" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "fileId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPairPriceHistoryKraken" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "openPrice" DECIMAL(65,20) NOT NULL,
    "closePrice" DECIMAL(65,20) NOT NULL,
    "coinPair" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPairPriceHistory" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,20) NOT NULL,
    "url" TEXT NOT NULL,
    "coinPairId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPair" (
    "id" BIGSERIAL NOT NULL,
    "pair" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portpholio.name_unique" ON "Portpholio"("name");

-- CreateIndex
CREATE UNIQUE INDEX "File.name_unique" ON "File"("name");

-- CreateIndex
CREATE UNIQUE INDEX "portpholioId_coin_unique" ON "Wallet"("portpholioId", "coin");

-- CreateIndex
CREATE UNIQUE INDEX "time_coinPairId_unique" ON "CoinPairPriceHistory"("time", "coinPairId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinPair.pair_unique" ON "CoinPair"("pair");

-- AddForeignKey
ALTER TABLE "File" ADD FOREIGN KEY ("portpholioId") REFERENCES "Portpholio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD FOREIGN KEY ("portpholioId") REFERENCES "Portpholio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletHistory" ADD FOREIGN KEY ("portpholioId") REFERENCES "Portpholio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTaxEvent" ADD FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earn" ADD FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinPairPriceHistory" ADD FOREIGN KEY ("coinPairId") REFERENCES "CoinPair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
