export const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";
export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
export const ACCEPTED_FILE_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "video/mp4",
  "video/webm",
  "text/plain",
  "text/markdown",
  "application/pdf",
];
export const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".webm", ".mp4", ".txt", ".md", ".pdf"];
