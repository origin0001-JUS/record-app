import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const presets = await prisma.preset.findMany({
    orderBy: { createdAt: "asc" },
  });
  return Response.json(presets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.meetingType || !body.outputFormats || !body.promptTemplate) {
    return Response.json(
      { error: "name, meetingType, outputFormats, promptTemplate은 필수 항목입니다" },
      { status: 400 }
    );
  }

  const preset = await prisma.preset.create({
    data: {
      name: body.name,
      meetingType: body.meetingType,
      outputFormats: JSON.stringify(body.outputFormats),
      promptTemplate: body.promptTemplate,
      reportTemplate: body.reportTemplate || "briefing",
      slideFormat: body.slideFormat || "detailed",
      isDefault: body.isDefault || false,
    },
  });
  return Response.json(preset, { status: 201 });
}
