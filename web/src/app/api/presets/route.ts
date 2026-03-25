import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";

export async function GET() {
  const res = await workerFetch("/api/presets");
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await workerFetch("/api/presets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
