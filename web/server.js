// Custom start script for Render deployment
const fs = require("fs");
const path = require("path");

const standaloneDir = path.join(__dirname, ".next", "standalone");
const staticSrc = path.join(__dirname, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(__dirname, "public");
const publicDest = path.join(standaloneDir, "public");

// Copy static files if not already there
if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log("Copied .next/static");
}
if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log("Copied public/");
}

// Ensure data directory exists
const dataDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize DB with raw SQL if it doesn't exist
const dbPath = process.env.DB_PATH || path.join(dataDir, "app.db");
if (!fs.existsSync(dbPath)) {
  console.log("Initializing database with SQL...");
  try {
    const Database = require("better-sqlite3");
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    db.exec(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

      CREATE TABLE IF NOT EXISTS "Preset" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "meetingType" TEXT NOT NULL,
        "outputFormats" TEXT NOT NULL,
        "promptTemplate" TEXT NOT NULL,
        "reportTemplate" TEXT NOT NULL DEFAULT 'briefing',
        "slideFormat" TEXT NOT NULL DEFAULT 'detailed',
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Job" (
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
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id"),
        CONSTRAINT "Job_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Preset" ("id")
      );
    `);

    // Seed default data
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO "User" (id, email, name) VALUES (?, ?, ?)'
    );
    stmt.run("dev-user", "dev@record-app.local", "개발자");

    const presetStmt = db.prepare(
      'INSERT OR IGNORE INTO "Preset" (id, name, meetingType, outputFormats, promptTemplate, isDefault, updatedAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    presetStmt.run("preset-weekly-summary", "주간회의 - 요약만", "weekly", '["summary"]', "이 주간회의 녹취록을 한국어로 요약해주세요.", 1);
    presetStmt.run("preset-weekly-full", "주간회의 - 요약+보고서", "weekly", '["summary","report"]', "이 주간회의 녹취록을 한국어로 요약해주세요.", 0);
    presetStmt.run("preset-brainstorming", "브레인스토밍 - 전체", "brainstorming", '["summary","report","slides"]', "이 브레인스토밍 세션의 내용을 한국어로 정리해주세요.", 0);
    presetStmt.run("preset-client-meeting", "고객미팅 - 요약+보고서", "client", '["summary","report"]', "이 고객 미팅 내용을 한국어로 정리해주세요.", 0);
    presetStmt.run("preset-reporting", "보고회의 - 전체", "reporting", '["summary","report","slides"]', "이 보고 회의 내용을 한국어로 구조화해주세요.", 0);

    db.close();
    console.log("Database initialized successfully");
  } catch (e) {
    console.error("DB init error:", e.message);
  }
}

// Set PORT from environment
const port = process.env.PORT || 3000;
process.env.PORT = String(port);
process.env.HOSTNAME = "0.0.0.0";

// Start standalone server
require(path.join(standaloneDir, "server.js"));
