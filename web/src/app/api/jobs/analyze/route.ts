import { NextRequest } from "next/server";
import { workerFetch } from "@/lib/api";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorized();

  const body = await request.json();
  body.userId = auth.uid;

  const res = await workerFetch("/api/jobs/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
