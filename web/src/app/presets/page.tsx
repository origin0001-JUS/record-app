"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Preset, MeetingType, OutputFormat } from "@/types";
import { MEETING_TYPE_LABELS, OUTPUT_FORMAT_LABELS } from "@/types";
import { authFetch } from "@/lib/api";

const MEETING_TYPES: MeetingType[] = ["weekly", "brainstorming", "client", "reporting", "custom"];
const OUTPUT_FORMATS: OutputFormat[] = ["summary", "report", "slides"];

function PresetForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Preset;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [meetingType, setMeetingType] = useState<string>(initial?.meetingType || "weekly");
  const [formats, setFormats] = useState<OutputFormat[]>(
    initial ? JSON.parse(initial.outputFormats) : ["summary"]
  );
  const [promptTemplate, setPromptTemplate] = useState(initial?.promptTemplate || "");

  const toggleFormat = (f: OutputFormat) => {
    setFormats((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="주간회의 - 요약+보고서"
        />
      </div>
      <div>
        <label className="text-sm font-medium">회의 유형</label>
        <Select value={meetingType} onValueChange={(v) => v && setMeetingType(v)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEETING_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {MEETING_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">산출물</label>
        <div className="flex gap-2 mt-1">
          {OUTPUT_FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => toggleFormat(f)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                formats.includes(f)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              {OUTPUT_FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">프롬프트 템플릿</label>
        <Textarea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          rows={5}
          className="mt-1"
          placeholder="이 회의 내용을 한국어로 요약해주세요..."
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button
          onClick={() =>
            onSave({ name, meetingType, outputFormats: formats, promptTemplate })
          }
          disabled={!name || formats.length === 0}
        >
          저장
        </Button>
      </div>
    </div>
  );
}

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPresets = () => {
    authFetch("/api/presets")
      .then((res) => res.json())
      .then(setPresets);
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleCreate = async (data: Record<string, unknown>) => {
    await authFetch("/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowCreate(false);
    fetchPresets();
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    await authFetch(`/api/presets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingId(null);
    fetchPresets();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 프리셋을 삭제하시겠습니까?")) return;
    await authFetch(`/api/presets/${id}`, { method: "DELETE" });
    fetchPresets();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">프리셋 관리</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger>
            <Button>새 프리셋</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 프리셋 만들기</DialogTitle>
            </DialogHeader>
            <PresetForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {presets.map((preset) => {
          const formats: OutputFormat[] = JSON.parse(preset.outputFormats);
          if (editingId === preset.id) {
            return (
              <Card key={preset.id}>
                <CardHeader>
                  <CardTitle className="text-base">프리셋 수정</CardTitle>
                </CardHeader>
                <CardContent>
                  <PresetForm
                    initial={preset}
                    onSave={(data) => handleUpdate(preset.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={preset.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{preset.name}</span>
                    {preset.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        기본
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {MEETING_TYPE_LABELS[preset.meetingType as MeetingType] || preset.meetingType}
                  </span>
                  <div className="flex gap-1 mt-1">
                    {formats.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs">
                        {OUTPUT_FORMAT_LABELS[f]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(preset.id)}>
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(preset.id)}
                  >
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
