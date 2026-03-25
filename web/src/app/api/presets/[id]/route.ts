import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await workerFetch(`/api/presets/${id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await workerFetch(`/api/presets/${id}`, { method: "DELETE" });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
