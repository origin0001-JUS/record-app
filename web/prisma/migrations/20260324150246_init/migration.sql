-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Preset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "meetingType" TEXT NOT NULL,
    "outputFormats" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "reportTemplate" TEXT NOT NULL DEFAULT 'briefing',
    "slideFormat" TEXT NOT NULL DEFAULT 'detailed',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "statusMessage" TEXT,
    "originalFileName" TEXT NOT NULL,
    "uploadedFilePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "notebookId" TEXT,
    "sourceId" TEXT,
    "summaryText" TEXT,
    "reportPath" TEXT,
    "slidesPath" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Preset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
