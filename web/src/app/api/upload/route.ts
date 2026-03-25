import { NextRequest } from "next/server";
import { WORKER_URL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  // Forward multipart form data to worker
  const res = await fetch(`${WORKER_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
