import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const res = await workerFetch(`/api/jobs/${id}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
