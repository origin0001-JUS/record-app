"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Preset, OutputFormat } from "@/types";
import { MEETING_TYPE_LABELS, MEETING_TYPE_DESCRIPTIONS, OUTPUT_FORMAT_LABELS, type MeetingType } from "@/types";
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/constants";
import { authFetch } from "@/lib/api";
import { REPORT_TEMPLATES, type ReportTemplate } from "@/lib/report-templates";

const MEETING_TYPE_TO_CATEGORY: Record<string, string | null> = {
  regular: "정기회의",
  strategy: "전략/의사결정",
  external: "외부/협력",
  tech: "기술/개발",
  seminar: "강연/세미나",
  brainstorming: "브레인스토밍",
  project: "프로젝트 관리",
  general: null, // show all
};

const OUTPUT_TYPE_LABELS: Record<string, string> = {
  summary: "요약",
  report: "보고서",
  slides: "슬라이드",
};

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string>("");

  useEffect(() => {
    authFetch("/api/presets")
      .then((res) => res.json())
      .then(setPresets);
  }, []);

  // Reset template when preset changes
  useEffect(() => {
    setSelectedTemplate(null);
  }, [selectedPresetId]);

  const validateAndSetFile = (f: File) => {
    setFileError("");
    if (f.size > MAX_FILE_SIZE) {
      setFileError(`파일 크기가 200MB를 초과합니다 (${(f.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const detectFileType = (file: File): string => {
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type.startsWith("video/")) return "video";
    if (file.name.endsWith(".txt") || file.name.endsWith(".md")) return "stt_text";
    return "text";
  };

  const handleSubmit = async () => {
    if (!file || !selectedPresetId) return;
    setIsSubmitting(true);

    try {
      // Generate a temporary job ID
      const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Step 1: Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobId", jobId);
      const uploadRes = await authFetch("/api/upload", { method: "POST", body: formData });
      const { filePath, fileName } = await uploadRes.json();

      // Step 2: Create job
      const jobRes = await authFetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: selectedPresetId,
          filePath,
          fileName,
          fileType: detectFileType(file),
          templateConfig: selectedTemplate ? {
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            style: selectedTemplate.style,
            description: selectedTemplate.description,
            layoutGuide: selectedTemplate.layoutGuide,
          } : null,
        }),
      });
      const job = await jobRes.json();

      // Navigate to job detail
      router.push(`/jobs/${job.id}`);
    } catch (error) {
      console.error("Submit error:", error);
      setFileError("처리 시작에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const selectedFormats: OutputFormat[] = selectedPreset
    ? JSON.parse(selectedPreset.outputFormats)
    : [];

  const filteredTemplates = useMemo(() => {
    if (!selectedPreset) return [];
    const category = MEETING_TYPE_TO_CATEGORY[selectedPreset.meetingType as string];
    if (category === null) return REPORT_TEMPLATES; // general → show all
    if (category === undefined) return REPORT_TEMPLATES; // unknown → show all
    return REPORT_TEMPLATES.filter((t) => t.category === category);
  }, [selectedPreset]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">새 회의록 처리</h1>

      {/* Step 1: File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. 파일 업로드</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : file
                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="space-y-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                <p className="text-xs text-muted-foreground">
                  클릭하거나 드래그하여 파일 변경
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-muted-foreground">
                  MP3, WAV, MP4, TXT, MD, PDF 지원 (최대 200MB)
                </p>
              </div>
            )}
          </div>
          {fileError && (
            <p className="text-destructive text-sm mt-2">{fileError}</p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Preset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. 프리셋 선택</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            회의 유형에 맞는 요약 구조와 생성할 산출물을 결정합니다
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {presets.map((preset) => {
              const formats: OutputFormat[] = JSON.parse(preset.outputFormats);
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {MEETING_TYPE_DESCRIPTIONS[preset.meetingType as MeetingType] || MEETING_TYPE_LABELS[preset.meetingType as MeetingType] || preset.meetingType}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {formats.map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs">
                          {OUTPUT_FORMAT_LABELS[f] || f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Template Selection */}
      {selectedPreset && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. 디자인 템플릿 선택</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              선택한 템플릿의 색상·레이아웃이 슬라이드와 보고서에 반영됩니다
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {/* No template option */}
              <button
                onClick={() => setSelectedTemplate(null)}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedTemplate === null
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                }`}
              >
                <p className="font-medium">선택 안 함</p>
                <p className="text-xs text-muted-foreground mt-1">
                  기본 스타일로 생성합니다
                </p>
              </button>

              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`text-left rounded-lg border-2 transition-colors overflow-hidden ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className="flex">
                      {/* Color accent bar */}
                      <div
                        className="w-1.5 shrink-0"
                        style={{ backgroundColor: template.style.accent }}
                      />
                      <div className="p-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {template.outputType.map((t) => (
                              <Badge key={t} variant="outline" className="text-xs">
                                {OUTPUT_TYPE_LABELS[t] || t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {file && selectedPreset && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. 확인 및 시작</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">파일:</span> {file.name}
              </p>
              <p>
                <span className="text-muted-foreground">프리셋:</span> {selectedPreset.name}
              </p>
              <p>
                <span className="text-muted-foreground">템플릿:</span>{" "}
                {selectedTemplate ? selectedTemplate.name : "기본 스타일"}
              </p>
              <p>
                <span className="text-muted-foreground">생성할 산출물:</span>{" "}
                {selectedFormats.map((f) => OUTPUT_FORMAT_LABELS[f]).join(", ")}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "처리 시작 중..." : "회의록 처리 시작"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
