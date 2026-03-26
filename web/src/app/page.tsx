import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS, type JobStatus } from "@/types";
import { WorkerStatus } from "@/components/WorkerStatus";
import { WORKER_URL } from "@/lib/constants";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "complete") return "default";
  if (status === "error") return "destructive";
  if (status === "pending") return "outline";
  return "secondary";
}

export const dynamic = "force-dynamic";

async function fetchFromWorker(path: string) {
  try {
    const res = await fetch(`${WORKER_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const [presetsData, jobsData] = await Promise.all([
    fetchFromWorker("/api/presets"),
    fetchFromWorker("/api/jobs?page=1&limit=5"),
  ]);

  const presets = presetsData || [];
  const recentJobs = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;
  const totalPresets = presets.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Link href="/upload">
          <Button>새 회의록 처리</Button>
        </Link>
      </div>

      <WorkerStatus />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">전체 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">프리셋</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPresets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">완료된 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {recentJobs.filter((j: { status: string }) => j.status === "complete").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 작업</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              아직 작업이 없습니다.{" "}
              <Link href="/upload" className="underline">
                첫 회의록을 처리해보세요
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job: { id: string; originalFileName: string; status: string; createdAt: string; preset?: { name: string } }) => (
                <a
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{job.originalFileName}</span>
                    <span className="text-xs text-muted-foreground">
                      {job.preset?.name} &middot;{" "}
                      {new Date(job.createdAt).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <Badge variant={statusVariant(job.status)}>
                    {JOB_STATUS_LABELS[job.status as JobStatus] || job.status}
                  </Badge>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
