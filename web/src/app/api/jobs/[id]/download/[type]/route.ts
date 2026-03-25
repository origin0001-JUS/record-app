import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const res = await workerFetch(`/api/jobs/${id}/download/${type}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "다운로드 실패" }));
    return Response.json(data, { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  const contentDisposition = res.headers.get("content-disposition");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

  return new Response(buffer, { headers });
}
