-- CreateTable
CREATE TABLE "CustomerPortalLoginChallenge" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "phoneHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "returnReference" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPortalLoginChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPortalSession" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPortalSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerPortalLoginChallenge_phoneHash_createdAt_idx" ON "CustomerPortalLoginChallenge"("phoneHash", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerPortalLoginChallenge_ipHash_createdAt_idx" ON "CustomerPortalLoginChallenge"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerPortalLoginChallenge_expiresAt_idx" ON "CustomerPortalLoginChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPortalSession_tokenHash_key" ON "CustomerPortalSession"("tokenHash");

-- CreateIndex
CREATE INDEX "CustomerPortalSession_clientId_expiresAt_idx" ON "CustomerPortalSession"("clientId", "expiresAt");

-- CreateIndex
CREATE INDEX "CustomerPortalSession_expiresAt_idx" ON "CustomerPortalSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "CustomerPortalLoginChallenge" ADD CONSTRAINT "CustomerPortalLoginChallenge_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPortalSession" ADD CONSTRAINT "CustomerPortalSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
