-- CreateEnum
CREATE TYPE "TaxMethod" AS ENUM ('FIFO', 'AVCO');

-- CreateEnum
CREATE TYPE "Fiat" AS ENUM ('EUR', 'USD');

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
CREATE TABLE "CryptoCoinInWallet" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "amountCoin" TEXT NOT NULL,
    "remainAmount" DECIMAL(65,30) NOT NULL,
    "expensesInFiat" DECIMAL(65,30) NOT NULL,
    "portpholioId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "amountCoin" TEXT NOT NULL,
    "exportId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdraw" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "amountCoin" TEXT NOT NULL,
    "exportId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "buy" DECIMAL(65,30) NOT NULL,
    "buyCoin" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "priceCoin" TEXT NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL,
    "feeCoin" TEXT NOT NULL,
    "exportId" BIGINT NOT NULL,
    "cryptoCoinInWalletId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionTaxEvent" (
    "id" BIGSERIAL NOT NULL,
    "profitInFiat" DECIMAL(65,30) NOT NULL,
    "expensesInFiat" DECIMAL(65,30) NOT NULL,
    "transactionId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionExpensesDetail" (
    "id" BIGSERIAL NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "expensesInFiat" DECIMAL(65,30) NOT NULL,
    "cryptoCoinInWalletId" BIGINT NOT NULL,
    "transactionTaxEventId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earn" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "amountCoin" TEXT NOT NULL,
    "exportId" BIGINT NOT NULL,
    "earnTaxEventId" BIGINT NOT NULL,
    "cryptoCoinInWalletId" BIGINT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarnTaxEvent" (
    "id" BIGSERIAL NOT NULL,
    "profitInFiat" DECIMAL(65,30) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinPairPriceHistory" (
    "id" BIGSERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
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
CREATE UNIQUE INDEX "Transaction_cryptoCoinInWalletId_unique" ON "Transaction"("cryptoCoinInWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionTaxEvent_transactionId_unique" ON "TransactionTaxEvent"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Earn_earnTaxEventId_unique" ON "Earn"("earnTaxEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Earn_cryptoCoinInWalletId_unique" ON "Earn"("cryptoCoinInWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "time_coinPairId_unique" ON "CoinPairPriceHistory"("time", "coinPairId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinPair.pair_unique" ON "CoinPair"("pair");

-- AddForeignKey
ALTER TABLE "Export" ADD FOREIGN KEY ("portpholioId") REFERENCES "Portpholio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptoCoinInWallet" ADD FOREIGN KEY ("portpholioId") REFERENCES "Portpholio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD FOREIGN KEY ("exportId") REFERENCES "Export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdraw" ADD FOREIGN KEY ("exportId") REFERENCES "Export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD FOREIGN KEY ("exportId") REFERENCES "Export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD FOREIGN KEY ("cryptoCoinInWalletId") REFERENCES "CryptoCoinInWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTaxEvent" ADD FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionExpensesDetail" ADD FOREIGN KEY ("cryptoCoinInWalletId") REFERENCES "CryptoCoinInWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionExpensesDetail" ADD FOREIGN KEY ("transactionTaxEventId") REFERENCES "TransactionTaxEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earn" ADD FOREIGN KEY ("exportId") REFERENCES "Export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earn" ADD FOREIGN KEY ("earnTaxEventId") REFERENCES "EarnTaxEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earn" ADD FOREIGN KEY ("cryptoCoinInWalletId") REFERENCES "CryptoCoinInWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinPairPriceHistory" ADD FOREIGN KEY ("coinPairId") REFERENCES "CoinPair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
