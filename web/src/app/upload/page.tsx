"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  internal_report: "내부 보고",
  executive_report: "임원 보고",
  directives: "지시사항 정리",
  external: "외부/협력",
  tech: "기술/개발",
  seminar: "강연/세미나",
  brainstorming: "브레인스토밍",
  project: "프로젝트 관리",
  general: null,
};

const PRESET_DISPLAY_ORDER: string[] = [
  "internal_report", "executive_report", "directives",
  "regular", "strategy", "external",
  "tech", "project", "seminar",
  "brainstorming", "general",
];

interface AnalysisResult {
  type: string;
  topic: string;
  summary: string;
  suggestedPresets: string[];
}

export default function UploadPage() {
  const router = useRouter();

  // Step 1: File
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");

  // Step 2: Preset (shown immediately after upload)
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [showAllPresets, setShowAllPresets] = useState(false);

  // AI Analysis (background)
  const [jobId, setJobId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3: Template
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load presets on mount
  useEffect(() => {
    authFetch("/api/presets")
      .then((res) => res.json())
      .then((data: Preset[]) => {
        data.sort((a, b) => {
          const ai = PRESET_DISPLAY_ORDER.indexOf(a.meetingType);
          const bi = PRESET_DISPLAY_ORDER.indexOf(b.meetingType);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });
        setPresets(data);
      });
  }, []);

  // Reset template when preset changes
  useEffect(() => {
    setSelectedTemplate(null);
  }, [selectedPresetId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

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

  // Phase 1: Upload + Analyze (background)
  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobId", `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      const uploadRes = await authFetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("파일 업로드에 실패했습니다");
      const { filePath, fileName } = await uploadRes.json();

      // Start analysis (Phase 1)
      const analyzeRes = await authFetch("/api/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, fileName, fileType: detectFileType(file) }),
      });
      if (!analyzeRes.ok) throw new Error("분석 시작에 실패했습니다");
      const job = await analyzeRes.json();
      setJobId(job.id);

      // Poll for analysis result
      pollingRef.current = setInterval(async () => {
        try {
          const res = await authFetch(`/api/jobs/${job.id}`);
          if (!res.ok) return; // polling error, retry next interval
          const data = await res.json();
          if (data.status === "analyzed" && data.analysisResult) {
            const result = JSON.parse(data.analysisResult);
            setAnalysis(result);
            setIsAnalyzing(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
          } else if (data.status === "error") {
            setIsAnalyzing(false);
            setAnalysis({ type: "general", topic: "분석 실패", summary: data.errorMessage || "", suggestedPresets: ["general"] });
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        } catch {
          // polling error, keep trying
        }
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setFileError("업로드에 실패했습니다. 다시 시도해주세요.");
      setIsAnalyzing(false);
    }
  };

  // Phase 2: Generate
  const handleGenerate = async () => {
    if (!jobId || !selectedPresetId) return;
    setIsSubmitting(true);

    try {
      const genRes = await authFetch(`/api/jobs/${jobId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: selectedPresetId,
          templateConfig: selectedTemplate ? {
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            style: selectedTemplate.style,
            description: selectedTemplate.description,
            layoutGuide: selectedTemplate.layoutGuide,
          } : null,
        }),
      });
      if (!genRes.ok) throw new Error("처리 시작에 실패했습니다");
      router.push(`/jobs/${jobId}`);
    } catch (error) {
      console.error("Generate error:", error);
      setFileError(error instanceof Error ? error.message : "처리 시작에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const selectedFormats: OutputFormat[] = selectedPreset
    ? JSON.parse(selectedPreset.outputFormats)
    : [];
  const hasSlides = selectedFormats.includes("slides");

  const filteredTemplates = useMemo(() => {
    if (!selectedPreset) return [];
    const category = MEETING_TYPE_TO_CATEGORY[selectedPreset.meetingType as string];
    if (category === null) return REPORT_TEMPLATES;
    if (category === undefined) return REPORT_TEMPLATES;
    return REPORT_TEMPLATES.filter((t) => t.category === category);
  }, [selectedPreset]);

  // Determine which presets to show (recommended vs all)
  const suggestedMeetingTypes = analysis?.suggestedPresets || [];
  const recommendedPresets = presets.filter((p) => suggestedMeetingTypes.includes(p.meetingType));
  const otherPresets = presets.filter((p) => !suggestedMeetingTypes.includes(p.meetingType));

  // Phase check: has the file been uploaded?
  const isUploaded = !!jobId;

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
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
                {!isUploaded && (
                  <p className="text-xs text-muted-foreground">클릭하거나 드래그하여 파일 변경</p>
                )}
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
          {fileError && <p className="text-destructive text-sm mt-2">{fileError}</p>}

          {file && !isUploaded && (
            <Button
              onClick={handleUploadAndAnalyze}
              className="w-full mt-4"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "업로드 중..." : "업로드 및 분석 시작"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Preset Selection (shown after upload) */}
      {isUploaded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. 정리 방식 선택</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              어떤 관점으로 자료를 정리할지 선택합니다
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Analysis result card */}
            {isAnalyzing && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-muted-foreground">AI가 자료를 분석하고 있습니다... 완료되면 추천 프리셋이 표시됩니다</span>
              </div>
            )}
            {analysis && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
                <p className="font-medium">{analysis.topic}</p>
                <p className="text-xs text-muted-foreground">
                  유형: {MEETING_TYPE_LABELS[analysis.type as MeetingType] || analysis.type}
                </p>
              </div>
            )}

            {/* Recommended presets */}
            <div className="grid grid-cols-1 gap-3">
              {(analysis ? recommendedPresets : presets.slice(0, 4)).map((preset) => {
                const formats: OutputFormat[] = JSON.parse(preset.outputFormats);
                const isSelected = selectedPresetId === preset.id;
                const isRecommended = suggestedMeetingTypes.includes(preset.meetingType);
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
                        <div className="flex items-center gap-2">
                          {isRecommended && <span className="text-yellow-500 text-sm">&#11088;</span>}
                          <p className="font-medium">{preset.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {MEETING_TYPE_DESCRIPTIONS[preset.meetingType as MeetingType] || ""}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
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

            {/* Show more toggle */}
            {analysis && otherPresets.length > 0 && (
              <>
                <button
                  onClick={() => setShowAllPresets(!showAllPresets)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center py-2"
                >
                  {showAllPresets ? "▲ 접기" : `▼ 다른 프리셋 더 보기 (${otherPresets.length}개)`}
                </button>
                {showAllPresets && (
                  <div className="grid grid-cols-1 gap-3">
                    {otherPresets.map((preset) => {
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
                                {MEETING_TYPE_DESCRIPTIONS[preset.meetingType as MeetingType] || ""}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
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
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Template Selection (only for presets with slides) */}
      {isUploaded && selectedPreset && hasSlides && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. 슬라이드 스타일</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              선택한 스타일이 슬라이드 디자인에 반영됩니다
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className={`p-3 rounded-lg border-2 transition-colors text-center ${
                  selectedTemplate === null
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                }`}
              >
                <p className="text-sm font-medium">기본</p>
                <p className="text-xs text-muted-foreground mt-1">기본 스타일</p>
              </button>
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className="flex justify-center gap-1 mb-2">
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: template.style.accent }} />
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: template.style.bg }} />
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: template.style.heading }} />
                    </div>
                    <p className="text-xs font-medium truncate">{template.name}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm & Start */}
      {isUploaded && selectedPreset && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {hasSlides ? "4" : "3"}. 확인 및 시작
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">파일:</span> {file?.name}</p>
              <p><span className="text-muted-foreground">정리 방식:</span> {selectedPreset.name}</p>
              {hasSlides && (
                <p><span className="text-muted-foreground">슬라이드 스타일:</span> {selectedTemplate ? selectedTemplate.name : "기본"}</p>
              )}
              <p>
                <span className="text-muted-foreground">산출물:</span>{" "}
                {selectedFormats.map((f) => OUTPUT_FORMAT_LABELS[f]).join(", ")}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "처리 시작 중..." : "처리 시작"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
