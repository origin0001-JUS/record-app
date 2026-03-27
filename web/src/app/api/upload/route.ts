import { NextRequest } from "next/server";
import { WORKER_URL } from "@/lib/constants";
import { verifyAuth, unauthorized } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorized();

  const formData = await request.formData();

  const res = await fetch(`${WORKER_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
