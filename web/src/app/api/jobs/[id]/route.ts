import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { preset: true },
  });
  if (!job) {
    return Response.json({ error: "Job을 찾을 수 없습니다" }, { status: 404 });
  }
  return Response.json(job);
}
