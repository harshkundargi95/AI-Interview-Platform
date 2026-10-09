-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('active', 'completed');

-- CreateTable
CREATE TABLE "Interview" (
    "id" UUID NOT NULL,
    "ownerId" TEXT NOT NULL,
    "requestId" UUID NOT NULL,
    "preferences" JSONB NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'active',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "interviewId" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("interviewId","id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "interviewId" UUID NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("interviewId","questionId")
);

-- CreateTable
CREATE TABLE "FeedbackReport" (
    "id" UUID NOT NULL,
    "interviewId" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "modelVersion" TEXT,
    "rubricVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interview_ownerId_createdAt_idx" ON "Interview"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_ownerId_requestId_key" ON "Interview"("ownerId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_interviewId_position_key" ON "Question"("interviewId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackReport_interviewId_key" ON "FeedbackReport"("interviewId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_interviewId_questionId_fkey" FOREIGN KEY ("interviewId", "questionId") REFERENCES "Question"("interviewId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackReport" ADD CONSTRAINT "FeedbackReport_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
