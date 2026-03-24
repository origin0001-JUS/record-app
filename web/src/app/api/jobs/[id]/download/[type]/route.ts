import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const job = await prisma.job.findUnique({ where: { id } });

  if (!job) {
    return Response.json({ error: "Job을 찾을 수 없습니다" }, { status: 404 });
  }

  const outputDir = path.resolve(process.cwd(), "..", "storage", "outputs", id);
  let filePath: string;
  let contentType: string;
  let fileName: string;

  switch (type) {
    case "summary":
      filePath = path.join(outputDir, "summary.md");
      contentType = "text/markdown; charset=utf-8";
      fileName = `${job.originalFileName}-요약.md`;
      break;
    case "report":
      filePath = job.reportPath || path.join(outputDir, "report.md");
      contentType = "text/markdown; charset=utf-8";
      fileName = `${job.originalFileName}-보고서.md`;
      break;
    case "slides":
      filePath = job.slidesPath || path.join(outputDir, "slides.pdf");
      contentType = filePath.endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      fileName = `${job.originalFileName}-슬라이드${filePath.endsWith(".pdf") ? ".pdf" : ".pptx"}`;
      break;
    default:
      return Response.json({ error: "잘못된 다운로드 타입" }, { status: 400 });
  }

  try {
    const buffer = await readFile(filePath);
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch {
    return Response.json({ error: "파일을 찾을 수 없습니다" }, { status: 404 });
  }
}
