import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const preset = await prisma.preset.findUnique({ where: { id } });
  if (!preset) {
    return Response.json({ error: "프리셋을 찾을 수 없습니다" }, { status: 404 });
  }
  return Response.json(preset);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const preset = await prisma.preset.update({
    where: { id },
    data: {
      name: body.name,
      meetingType: body.meetingType,
      outputFormats: typeof body.outputFormats === "string"
        ? body.outputFormats
        : JSON.stringify(body.outputFormats),
      promptTemplate: body.promptTemplate,
      reportTemplate: body.reportTemplate,
      slideFormat: body.slideFormat,
      isDefault: body.isDefault,
    },
  });
  return Response.json(preset);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.preset.delete({ where: { id } });
  return Response.json({ success: true });
}
