import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "..", "..", "data", "app.db");
const adapter = new PrismaBetterSqlite3({ url: "file:" + dbPath });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PRESETS = [
  {
    id: "preset-weekly-summary",
    name: "주간회의 - 요약만",
    meetingType: "weekly",
    outputFormats: JSON.stringify(["summary"]),
    promptTemplate:
      "이 주간회의 녹취록을 한국어로 요약해주세요. 다음 항목으로 구분해서 정리해주세요:\n1. 주요 논의사항\n2. 결정사항\n3. 액션아이템 (담당자, 기한 포함)\n4. 다음 회의 안건",
    reportTemplate: "briefing",
    slideFormat: "detailed",
    isDefault: true,
  },
  {
    id: "preset-weekly-full",
    name: "주간회의 - 요약+보고서",
    meetingType: "weekly",
    outputFormats: JSON.stringify(["summary", "report"]),
    promptTemplate:
      "이 주간회의 녹취록을 한국어로 요약해주세요. 다음 항목으로 구분해서 정리해주세요:\n1. 주요 논의사항\n2. 결정사항\n3. 액션아이템 (담당자, 기한 포함)\n4. 다음 회의 안건",
    reportTemplate: "briefing",
    slideFormat: "detailed",
    isDefault: false,
  },
  {
    id: "preset-brainstorming",
    name: "브레인스토밍 - 전체",
    meetingType: "brainstorming",
    outputFormats: JSON.stringify(["summary", "report", "slides"]),
    promptTemplate:
      "이 브레인스토밍 세션의 내용을 한국어로 정리해주세요:\n1. 제안된 아이디어 목록 (카테고리별 분류)\n2. 핵심 인사이트\n3. 실행 가능한 아이디어 (우선순위 포함)\n4. 추가 논의 필요 사항",
    reportTemplate: "briefing",
    slideFormat: "detailed",
    isDefault: false,
  },
  {
    id: "preset-client-meeting",
    name: "고객미팅 - 요약+보고서",
    meetingType: "client",
    outputFormats: JSON.stringify(["summary", "report"]),
    promptTemplate:
      "이 고객 미팅 내용을 한국어로 정리해주세요:\n1. 미팅 개요 (참석자, 목적)\n2. 고객 요구사항 및 피드백\n3. 합의사항\n4. 후속 조치 (담당자, 기한)\n5. 주의사항 및 리스크",
    reportTemplate: "briefing",
    slideFormat: "detailed",
    isDefault: false,
  },
  {
    id: "preset-reporting",
    name: "보고회의 - 전체",
    meetingType: "reporting",
    outputFormats: JSON.stringify(["summary", "report", "slides"]),
    promptTemplate:
      "이 보고 회의 내용을 한국어로 구조화해주세요:\n1. 보고 요약\n2. 주요 성과 및 진행상황\n3. 이슈 및 리스크\n4. 의사결정 사항\n5. 향후 계획 및 일정",
    reportTemplate: "briefing",
    slideFormat: "detailed",
    isDefault: false,
  },
];

async function main() {
  console.log("Seeding default presets...");

  for (const preset of DEFAULT_PRESETS) {
    await prisma.preset.upsert({
      where: { id: preset.id },
      update: preset,
      create: preset,
    });
    console.log(`  ✓ ${preset.name}`);
  }

  await prisma.user.upsert({
    where: { id: "dev-user" },
    update: {},
    create: {
      id: "dev-user",
      email: "dev@record-app.local",
      name: "개발자",
    },
  });
  console.log("  ✓ Default dev user created");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
