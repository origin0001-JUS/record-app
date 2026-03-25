// Custom start script for Render deployment
// Copies static files and starts the standalone server
const { execSync } = require("child_process");
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
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize DB if it doesn't exist
const dbPath = path.join(dataDir, "app.db");
if (!fs.existsSync(dbPath)) {
  console.log("Initializing database...");
  try {
    execSync("npx prisma migrate deploy", { cwd: __dirname, stdio: "inherit" });
    execSync("npx tsx prisma/seed.ts", { cwd: __dirname, stdio: "inherit" });
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
