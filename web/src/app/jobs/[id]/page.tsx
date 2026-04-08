"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { Job, JobStatus, OutputFormat } from "@/types";
import { JOB_STATUS_LABELS, OUTPUT_FORMAT_LABELS } from "@/types";
import { authFetch } from "@/lib/api";

const STATUS_STEPS: JobStatus[] = [
  "pending",
  "uploading",
  "processing",
  "generating_summary",
  "generating_report",
  "generating_slides",
  "complete",
];

function getProgress(status: string): number {
  const idx = STATUS_STEPS.indexOf(status as JobStatus);
  if (status === "complete") return 100;
  if (status === "error") return 0;
  if (idx === -1) return 0;
  return Math.round((idx / (STATUS_STEPS.length - 1)) * 100);
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "complete") return "default";
  if (status === "error") return "destructive";
  if (status === "pending") return "outline";
  return "secondary";
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDownload = useCallback(async (type: string, filename: string) => {
    const res = await authFetch(`/api/jobs/${id}/download/${type}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchJob = async () => {
      const res = await authFetch(`/api/jobs/${id}`);
      const data = await res.json();
      setJob(data);
      setLoading(false);

      if (data.status === "complete" || data.status === "error") {
        clearInterval(interval);
      }
    };

    fetchJob();
    interval = setInterval(fetchJob, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">작업을 찾을 수 없습니다</p>
      </div>
    );
  }

  const outputFormats: OutputFormat[] = job.preset
    ? JSON.parse(job.preset.outputFormats)
    : [];
  const isTerminal = job.status === "complete" || job.status === "error";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="text-muted-foreground hover:text-foreground text-sm">
          &larr; 작업 목록
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{job.originalFileName}</h1>
        <Badge variant={statusVariant(job.status)}>
          {JOB_STATUS_LABELS[job.status as JobStatus] || job.status}
        </Badge>
      </div>

      {/* Progress */}
      {!isTerminal && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>{job.statusMessage || "처리 중..."}</span>
              <span>{getProgress(job.status)}%</span>
            </div>
            <Progress value={getProgress(job.status)} />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {job.status === "error" && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{job.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Results (show even on error if partial results exist) */}
      {(job.status === "complete" || job.summaryText || job.reportPath || job.slidesPath) && (
        <Card>
          <CardHeader>
            <CardTitle>결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            {job.summaryText && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm">요약</h3>
                <div
                  className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: job.summaryText
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/^\* /gm, "• ")
                      .replace(/^### (.*)/gm, '<h4 class="font-semibold mt-3 mb-1">$1</h4>')
                      .replace(/^## (.*)/gm, '<h3 class="font-bold mt-4 mb-2">$1</h3>')
                      .replace(/\n/g, "<br/>"),
                  }}
                />
                <button
                  onClick={() => handleDownload("summary", `${job.originalFileName}-요약.txt`)}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-7 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground transition-colors"
                >
                  요약 다운로드 (.txt)
                </button>
              </div>
            )}

            {job.summaryText && (job.reportPath || job.slidesPath) && <Separator />}

            {/* Downloads */}
            <div className="flex gap-3">
              {job.reportPath && (
                <button
                  onClick={() => handleDownload("report", `${job.originalFileName}-보고서.txt`)}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
                >
                  보고서 다운로드
                </button>
              )}
              {job.slidesPath ? (
                <button
                  onClick={() => handleDownload("slides", `${job.originalFileName}-슬라이드.pdf`)}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
                >
                  슬라이드 다운로드 (.pdf)
                </button>
              ) : outputFormats.includes("slides") ? (
                <span className="inline-flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 px-2.5 h-8 text-sm text-muted-foreground">
                  슬라이드 생성 중...
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">작업 정보</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">프리셋</span>
            <span>{job.preset?.name}</span>
          </div>
          {(() => {
            const tmpl = job.templateConfig ? JSON.parse(job.templateConfig) : null;
            if (!tmpl) return null;
            return (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">디자인 템플릿</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded-sm border border-border"
                    style={{ backgroundColor: tmpl.style?.accent }}
                  />
                  {tmpl.name}
                </span>
              </div>
            );
          })()}
          <div className="flex justify-between">
            <span className="text-muted-foreground">산출물</span>
            <span>{outputFormats.map((f) => OUTPUT_FORMAT_LABELS[f]).join(", ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">생성일</span>
            <span>{new Date(job.createdAt).toLocaleString("ko-KR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">파일 타입</span>
            <span>{job.fileType}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
