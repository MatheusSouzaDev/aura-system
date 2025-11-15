-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'EXECUTED');

-- CreateEnum
CREATE TYPE "TransactionFulfillmentType" AS ENUM ('IMMEDIATE', 'FORECAST', 'INSTALLMENT');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "fulfillmentType" "TransactionFulfillmentType" NOT NULL DEFAULT 'IMMEDIATE',
ADD COLUMN     "installmentCount" INTEGER,
ADD COLUMN     "installmentIndex" INTEGER,
ADD COLUMN     "parentTransactionId" TEXT,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "includeInBalance" BOOLEAN NOT NULL DEFAULT true,
    "includeInCashFlow" BOOLEAN NOT NULL DEFAULT true,
    "includeInInvestments" BOOLEAN NOT NULL DEFAULT true,
    "includeInAiReports" BOOLEAN NOT NULL DEFAULT true,
    "includeInOverview" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_parentTransactionId_fkey" FOREIGN KEY ("parentTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
