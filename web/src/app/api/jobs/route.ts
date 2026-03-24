import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { WORKER_URL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { preset: true },
    }),
    prisma.job.count(),
  ]);

  return Response.json({ jobs, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { presetId, filePath, fileName, fileType } = body;

  if (!presetId || !filePath || !fileName || !fileType) {
    return Response.json(
      { error: "presetId, filePath, fileName, fileType은 필수 항목입니다" },
      { status: 400 }
    );
  }

  const preset = await prisma.preset.findUnique({ where: { id: presetId } });
  if (!preset) {
    return Response.json({ error: "프리셋을 찾을 수 없습니다" }, { status: 400 });
  }

  const job = await prisma.job.create({
    data: {
      userId: "dev-user",
      presetId,
      originalFileName: fileName,
      uploadedFilePath: filePath,
      fileType,
      status: "pending",
    },
  });

  // Dispatch to Python worker
  try {
    await fetch(`${WORKER_URL}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: job.id,
        file_path: filePath,
        file_type: fileType,
        preset_config: {
          promptTemplate: preset.promptTemplate,
          outputFormats: preset.outputFormats,
          reportTemplate: preset.reportTemplate,
          slideFormat: preset.slideFormat,
          meetingType: preset.meetingType,
        },
      }),
    });
  } catch {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "error",
        errorMessage: "Worker 서버에 연결할 수 없습니다. Worker가 실행 중인지 확인하세요.",
      },
    });
  }

  return Response.json(job, { status: 201 });
}
