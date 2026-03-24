import { WORKER_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${WORKER_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Worker responded ${res.status}`);
    const data = await res.json();
    return Response.json({
      worker: true,
      notebooklm: data.notebooklm_authenticated ?? false,
      activeJobs: data.active_jobs ?? 0,
    });
  } catch {
    return Response.json({
      worker: false,
      notebooklm: false,
      activeJobs: 0,
    });
  }
}
