import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const res = await workerFetch(`/api/presets/${id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await request.text();
  const res = await workerFetch(`/api/presets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const res = await workerFetch(`/api/presets/${id}`, { method: "DELETE" });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
