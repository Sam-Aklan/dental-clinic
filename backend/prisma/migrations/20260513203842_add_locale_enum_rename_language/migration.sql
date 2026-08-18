/*
  Warnings:

  - You are about to drop the column `language` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('EN', 'AR');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "language",
ADD COLUMN     "preferredLocale" "Locale" NOT NULL DEFAULT 'EN';
