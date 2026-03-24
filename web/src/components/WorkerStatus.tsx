"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  worker: boolean;
  notebooklm: boolean;
  activeJobs: number;
}

export function WorkerStatus() {
  const [status, setStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const check = () =>
      fetch("/api/health")
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => setStatus({ worker: false, notebooklm: false, activeJobs: 0 }));

    check();
    const interval = setInterval(check, 30000); // 30초마다 확인
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            status.worker ? "bg-green-500" : "bg-red-500"
          }`}
        />
        Worker {status.worker ? "연결됨" : "끊김"}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            status.notebooklm ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        NotebookLM {status.notebooklm ? "인증됨" : "미인증"}
      </span>
      {status.activeJobs > 0 && (
        <span className="text-muted-foreground">
          진행 중: {status.activeJobs}건
        </span>
      )}
    </div>
  );
}
