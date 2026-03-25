import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await workerFetch(`/api/jobs/${id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
