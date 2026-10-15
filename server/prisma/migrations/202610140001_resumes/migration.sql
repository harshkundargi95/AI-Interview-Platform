CREATE TABLE "Resume" (
 "id" UUID NOT NULL, "ownerId" TEXT NOT NULL, "objectKey" TEXT NOT NULL,
 "state" TEXT NOT NULL DEFAULT 'pending', "filename" TEXT NOT NULL, "type" TEXT NOT NULL, "text" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Resume_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "Resume_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Resume_objectKey_key" ON "Resume"("objectKey");
CREATE INDEX "Resume_ownerId_expiresAt_idx" ON "Resume"("ownerId", "expiresAt");
