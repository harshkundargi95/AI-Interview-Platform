ALTER TABLE "Interview" ADD COLUMN "generation" JSONB;
CREATE TABLE "AiOperation" (
 "id" UUID NOT NULL, "ownerId" TEXT NOT NULL, "key" TEXT NOT NULL,
 "kind" TEXT NOT NULL, "inputHash" TEXT NOT NULL, "status" TEXT NOT NULL,
 "result" JSONB, "model" TEXT NOT NULL, "rubric" TEXT NOT NULL,
 "attempts" INTEGER NOT NULL DEFAULT 0, "inputTokens" INTEGER NOT NULL DEFAULT 0,
 "outputTokens" INTEGER NOT NULL DEFAULT 0, "errorCode" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "AiOperation_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "AiOperation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AiOperation_ownerId_key_key" ON "AiOperation"("ownerId", "key");
CREATE INDEX "AiOperation_ownerId_createdAt_idx" ON "AiOperation"("ownerId", "createdAt");
