// Registry of every subject shown in the app. To add a subject: put its JSON in ./subjects, import it here and add one entry.
// Keep `id` and `contentVersion` stable: they key saved progress. Bump `contentVersion` by 1 after changing answers/content.
import vnrChubedan from "./subjects/FE_VNR_ChuBeDan.json";
import vnrNhunghoang from "./subjects/FE_VNR_NhungHoang.json";
import hcm202FeNhunghoang from "./subjects/hcm202_fe_nhunghoang.json";
import mln131FeNhunghoang from "./subjects/MLN131_FE_NhungHoang.json";
import mln111Fe from "./subjects/FE_MLN111.json";
import hcm202FeChubedan from "./subjects/hcm202_fe_chubedan.json";
import hcm202Pt from "./subjects/hcm202_pt.json";
import pmg201c from "./subjects/pmg201c.json";
import feSwd392 from "./subjects/fe-swd392.json";
import mln122 from "./subjects/mln122.json";
import mma301 from "./subjects/mma301.json";
import swd392 from "./subjects/swd392.json";
import { adaptExtractedBank } from "@/domain/subjects/extracted-bank-adapter";
import { adaptFeSwd392 } from "@/domain/subjects/fe-swd392-adapter";
import { adaptMln122 } from "@/domain/subjects/mln122-adapter";
import { adaptMma301 } from "@/domain/subjects/mma301-adapter";
import { adaptPmg201c } from "@/domain/subjects/pmg201c-adapter";
import { subjectSchema } from "@/domain/subjects/schemas";
import type { Subject } from "@/domain/subjects/types";

export const subjects: Subject[] = [
  adaptExtractedBank(vnrChubedan, { id: "vnr-fe-chubedan", name: "VNR - Final Exam - Chu Be Dan", description: (n) => `Bộ ${n} câu hỏi có đáp án Final Exam môn VNR - Chu Be Dan.` }),
  adaptExtractedBank(vnrNhunghoang, { id: "vnr-fe-nhunghoang", name: "VNR - Final Exam - Nhung Hoang", description: (n) => `Bộ ${n} câu hỏi có đáp án Final Exam môn VNR - Nhung Hoang.` }),
  adaptExtractedBank(hcm202FeNhunghoang, { id: "hcm202-fe-nhunghoang", name: "HCM202 - Tư tưởng Hồ Chí Minh - Final Exam - Nhung Hoang", description: (n) => `Bộ ${n} câu hỏi Final Exam môn Tư tưởng Hồ Chí Minh - Nhung Hoang.` }),
  adaptExtractedBank(mln131FeNhunghoang, { id: "mln131-fe-nhunghoang", name: "MLN131 - Chủ nghĩa xã hội khoa học - Final Exam - Nhung Hoang", description: (n) => `Bộ ${n} câu hỏi Final Exam môn Chủ nghĩa xã hội khoa học - Nhung Hoang.` }),
  adaptExtractedBank(mln111Fe, { id: "mln111-fe", name: "MLN111 - Triết học Mác - Lênin - Final Exam", description: (n) => `Bộ ${n} câu hỏi Final Exam môn Triết học Mác - Lênin.` }),
  adaptExtractedBank(hcm202FeChubedan, { id: "hcm202-fe-chubedan", name: "HCM202 - Tư tưởng Hồ Chí Minh - Final Exam - Chu Be Dan", description: (n) => `Bộ ${n} câu hỏi Final Exam môn Tư tưởng Hồ Chí Minh - Chu Be Dan.` }),
  adaptExtractedBank(hcm202Pt, { id: "hcm202-pt", name: "HCM202 - Tư tưởng Hồ Chí Minh - Progress Test", description: (n) => `Bộ ${n} câu hỏi Progress Test môn Tư tưởng Hồ Chí Minh.` }),
  adaptPmg201c(pmg201c),
  adaptFeSwd392(feSwd392),
  adaptMln122(mln122),
  adaptMma301(mma301),
  subjectSchema.parse(swd392)
];

for (const key of ["id", "slug"] as const) {
  const seen = new Set<string>();
  for (const subject of subjects) {
    if (seen.has(subject[key])) throw new Error(`Duplicate subject ${key}: ${subject[key]}`);
    seen.add(subject[key]);
  }
}

export const subjectsBySlug = Object.fromEntries(subjects.map((subject) => [subject.slug, subject])) as Record<string, Subject>;
export const subjectSlugs = subjects.map((subject) => subject.slug);
export const getSubject = (slug: string) => subjectsBySlug[slug];
