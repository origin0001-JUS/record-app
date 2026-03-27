import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorized();

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
