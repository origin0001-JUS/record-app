import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";
  const res = await workerFetch(`/api/jobs?page=${page}&limit=${limit}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await workerFetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
