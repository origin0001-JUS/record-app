import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { MAX_FILE_SIZE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const jobId = formData.get("jobId") as string | null;

  if (!file || !jobId) {
    return Response.json({ error: "file과 jobId가 필요합니다" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "파일 크기가 200MB를 초과합니다" }, { status: 400 });
  }

  const uploadDir = path.resolve(process.cwd(), "..", "storage", "uploads", jobId);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, file.name);
  await writeFile(filePath, buffer);

  return Response.json({ filePath, fileName: file.name, size: file.size });
}
