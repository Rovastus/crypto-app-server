-- CreateEnum
CREATE TYPE "TaxMethod" AS ENUM ('AVCO');

-- CreateEnum
CREATE TYPE "Fiat" AS ENUM ('EUR');

-- CreateEnum
CREATE TYPE "TransactionTaxEventType" AS ENUM ('FEE', 'BUY');

-- CreateTable
CREATE TABLE "Portpholio" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "taxMethod" "TaxMethod" NOT NULL,
    "fiat" "Fiat" NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Export" (
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
    "amount" DECIMAL(65,8) NOT NULL,
    "avcoFiatPerUnit" DECIMAL(65,8) NOT NULL,
    "totalFiat" DECIMAL(65,8) NOT NULL,
    "portpholioId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletHistory" (
    "id" BIGSERIAL NOT NULL,
    "coin" TEXT NOT NULL,
    "oldAmount" DECIMAL(65,8) NOT NULL,
    "oldAvcoFiatPerUnit" DECIMAL(65,8) NOT NULL,
    "oldTotalFiat" DECIMAL(65,8) NOT NULL,
    "newAmount" DECIMAL(65,8) NOT NULL,
    "newAvcoFiatPerUnit" DECIMAL(65,8) NOT NULL,
    "newTotalFiat" DECIMAL(65,8) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "portpholioId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" BIGSERIAL NOT NULL,
    "amount" DECIMAL(65,8) NOT NULL,
    "coin" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "exportId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdraw" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,8) NOT NULL,
    "coin" TEXT NOT NULL,
    "exportId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGSERIAL NOT NULL,
    "buy" DECIMAL(65,8) NOT NULL,
    "buyCoin" TEXT NOT NULL,
    "price" DECIMAL(65,8) NOT NULL,
    "priceCoin" TEXT NOT NULL,
    "fee" DECIMAL(65,8) NOT NULL,
    "feeCoin" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "exportId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionTaxEvent" (
    "id" BIGSERIAL NOT NULL,
    "type" "TransactionTaxEventType" NOT NULL,
    "gainInFiat" DECIMAL(65,8) NOT NULL,
    "expensesInFiat" DECIMAL(65,8) NOT NULL,
    "transactionId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earn" (
    "id" BIGSERIAL NOT NULL,
    "amount" DECIMAL(65,8) NOT NULL,
    "amountCoin" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "exportId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPairPriceHistory" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,8) NOT NULL,
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
CREATE UNIQUE INDEX "Export.name_unique" ON "Export"("name");

-- CreateIndex
CREATE UNIQUE INDEX "portpholioId_coin_unique" ON "Wallet"("portpholioId", "coin");

-- CreateIndex
CREATE UNIQUE INDEX "time_coinPairId_unique" ON "CoinPairPriceHistory"("time", "coinPairId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinPair.pair_unique" ON "CoinPair"("pair");

-- AddForeignKey
ALTER TABLE "Export" ADD FOREIGN KEY ("portpholioId") REFERENCES "Portpholio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD FOREIGN KEY ("portpholioId") REFERENCES "Portpholio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletHistory" ADD FOREIGN KEY ("portpholioId") REFERENCES "Portpholio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD FOREIGN KEY ("exportId") REFERENCES "Export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdraw" ADD FOREIGN KEY ("exportId") REFERENCES "Export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD FOREIGN KEY ("exportId") REFERENCES "Export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTaxEvent" ADD FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earn" ADD FOREIGN KEY ("exportId") REFERENCES "Export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinPairPriceHistory" ADD FOREIGN KEY ("coinPairId") REFERENCES "CoinPair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
