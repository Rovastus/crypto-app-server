/*
  Warnings:

  - Added the required column `type` to the `TransactionTaxEvent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionTaxEventType" AS ENUM ('FEE', 'BUY');

-- AlterTable
ALTER TABLE "TransactionTaxEvent" ADD COLUMN     "type" "TransactionTaxEventType" NOT NULL;
