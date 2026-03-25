import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS, type JobStatus, MEETING_TYPE_LABELS, type MeetingType } from "@/types";
import { WORKER_URL } from "@/lib/constants";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "complete") return "default";
  if (status === "error") return "destructive";
  if (status === "pending") return "outline";
  return "secondary";
}

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  let jobs: Array<{
    id: string;
    originalFileName: string;
    status: string;
    statusMessage: string | null;
    createdAt: string;
    preset?: { name: string; meetingType: string };
  }> = [];

  try {
    const res = await fetch(`${WORKER_URL}/api/jobs?page=1&limit=100`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      jobs = data.jobs || [];
    }
  } catch {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">작업 목록</h1>
        <Link href="/upload">
          <Button>새 회의록 처리</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            아직 작업이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{job.originalFileName}</span>
                    <span className="text-sm text-muted-foreground">
                      {job.preset?.name} &middot;{" "}
                      {MEETING_TYPE_LABELS[job.preset?.meetingType as MeetingType] || ""} &middot;{" "}
                      {new Date(job.createdAt).toLocaleString("ko-KR")}
                    </span>
                    {job.statusMessage && (
                      <span className="text-xs text-muted-foreground">{job.statusMessage}</span>
                    )}
                  </div>
                  <Badge variant={statusVariant(job.status)}>
                    {JOB_STATUS_LABELS[job.status as JobStatus] || job.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
