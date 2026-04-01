"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy, Search, FileText, Presentation, BookOpen, Sparkles } from "lucide-react";
import { REPORT_TEMPLATES, type ReportTemplate } from "@/lib/report-templates";

const CATEGORIES = ["전체", ...Array.from(new Set(REPORT_TEMPLATES.map((t) => t.category)))];

const OUTPUT_ICONS: Record<string, React.ReactNode> = {
  summary: <FileText size={10} />,
  report: <BookOpen size={10} />,
  slides: <Presentation size={10} />,
};
const OUTPUT_LABELS: Record<string, string> = {
  summary: "요약",
  report: "보고서",
  slides: "슬라이드",
};

function MiniPreview({ template }: { template: ReportTemplate }) {
  const { style } = template;
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: style.bg }}>
      {/* 헤더 바 */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: style.accent }} />
      {/* 제목 */}
      <div
        className="absolute top-4 left-3 right-3 text-[7px] font-bold truncate"
        style={{ color: style.heading }}
      >
        {template.name}
      </div>
      {/* 본문 라인 */}
      <div className="absolute top-8 left-3 right-3 space-y-1">
        {[80, 65, 50].map((w, i) => (
          <div key={i} className="h-[2px] rounded" style={{ width: `${w}%`, backgroundColor: style.text + "20" }} />
        ))}
      </div>
      {/* 액센트 블록 */}
      <div className="absolute bottom-3 left-3 w-6 h-3 rounded-sm" style={{ backgroundColor: style.accent + "30" }} />
      <div className="absolute bottom-3 left-10 w-4 h-3 rounded-sm" style={{ backgroundColor: style.accent + "18" }} />
    </div>
  );
}

function DetailModal({
  template,
  onClose,
  onCopy,
}: {
  template: ReportTemplate;
  onClose: () => void;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 프리뷰 헤더 */}
        <div className="relative h-36 rounded-t-2xl overflow-hidden" style={{ backgroundColor: template.style.bg }}>
          <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: template.style.accent }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <h2 className="text-lg font-bold" style={{ color: template.style.heading }}>
              {template.name}
            </h2>
            <p className="text-[11px] mt-1 text-center" style={{ color: template.style.text }}>
              {template.description}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* 산출물 타입 */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-1.5">산출물</h3>
            <div className="flex gap-2">
              {template.outputType.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-700"
                >
                  {OUTPUT_ICONS[t]}
                  {OUTPUT_LABELS[t]}
                </span>
              ))}
            </div>
          </div>

          {/* 컬러 팔레트 */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-1.5">컬러 팔레트</h3>
            <div className="flex gap-3">
              {[
                { label: "배경", color: template.style.bg },
                { label: "본문", color: template.style.text },
                { label: "제목", color: template.style.heading },
                { label: "포인트", color: template.style.accent },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded border border-zinc-200" style={{ backgroundColor: color }} />
                  <div>
                    <div className="text-[9px] text-zinc-400">{label}</div>
                    <div className="text-[10px] font-mono text-zinc-500">{color}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 프롬프트 힌트 */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-1">프롬프트 가이드</h3>
            <p className="text-sm text-zinc-600 bg-zinc-50 rounded-lg p-2.5">{template.promptHint}</p>
          </div>

          {/* 레이아웃 가이드 */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-1">보고서 구조</h3>
            <p className="text-sm text-zinc-600">{template.layoutGuide}</p>
          </div>

          {/* 폰트 */}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-xs font-semibold text-zinc-500">폰트:</span>
            <span>{template.style.font}</span>
          </div>

          {/* 복사 버튼 */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all text-white"
            style={{ backgroundColor: copied ? "#22C55E" : template.style.accent }}
          >
            {copied ? (
              <>
                <Check size={16} /> 복사됨!
              </>
            ) : (
              <>
                <Copy size={16} /> 템플릿 설정 복사
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return REPORT_TEMPLATES.filter((t) => {
      const matchCategory = selectedCategory === "전체" || t.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.promptHint.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyTemplate = (template: ReportTemplate) => {
    const data = {
      id: template.id,
      name: template.name,
      style: template.style,
      outputType: template.outputType,
      promptHint: template.promptHint,
      layoutGuide: template.layoutGuide,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const handleQuickCopy = (e: React.MouseEvent, template: ReportTemplate) => {
    e.stopPropagation();
    handleCopyTemplate(template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-indigo-500" />
          <h1 className="text-2xl font-bold">보고서 템플릿</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {REPORT_TEMPLATES.length}개의 회의 보고서 디자인 중 선택하세요
        </p>
      </div>

      {/* 검색 */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="템플릿 검색 (이름, 설명, 키워드...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 카운트 */}
      <p className="text-sm text-zinc-500">{filteredTemplates.length}개 템플릿</p>

      {/* 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="group cursor-pointer rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all hover:-translate-y-0.5"
          >
            {/* 프리뷰 */}
            <div className="relative h-20 overflow-hidden">
              <MiniPreview template={template} />
              <button
                onClick={(e) => handleQuickCopy(e, template)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
              >
                {copiedId === template.id ? <Check size={10} /> : <Copy size={10} />}
              </button>
            </div>
            {/* 정보 */}
            <div className="p-2.5">
              <div className="text-xs font-medium text-zinc-800 truncate">{template.name}</div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">{template.description}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[9px] text-zinc-400">{template.category}</span>
                <span className="text-zinc-300">·</span>
                <div className="flex gap-0.5">
                  {template.outputType.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-1 py-0.5 text-[8px] rounded bg-zinc-100 text-zinc-500"
                    >
                      {OUTPUT_LABELS[t]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          <Search size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">검색 결과가 없습니다</p>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedTemplate && (
        <DetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onCopy={() => handleCopyTemplate(selectedTemplate)}
        />
      )}
    </div>
  );
}
