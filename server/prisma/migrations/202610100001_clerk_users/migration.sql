-- Preserve existing Phase 4 records without assigning them to a real sign-in.
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "clerkUserId" TEXT,
  "legacy" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
INSERT INTO "User" ("id", "legacy")
SELECT DISTINCT "ownerId", true FROM "Interview";
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
