-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_authorId_fkey";

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "authorClientId" TEXT,
ADD COLUMN     "visibleToClient" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "authorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorClientId_fkey" FOREIGN KEY ("authorClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
