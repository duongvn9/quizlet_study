import { describe, expect, it } from "vitest";
import hcmFeChubedanData from "@/data/subjects/hcm202_fe_chubedan.json";
import hcmPtData from "@/data/subjects/hcm202_pt.json";
import { adaptHcm202FeChubedan } from "@/domain/subjects/hcm202-fe-chubedan-adapter";
import { adaptHcm202Pt } from "@/domain/subjects/hcm202-pt-adapter";
import feSwdData from "@/data/subjects/fe-swd392.json";
import data from "@/data/subjects/swd392.json";
import mmaData from "@/data/subjects/mma301.json";
import mlnData from "@/data/subjects/mln122.json";
import pmgData from "@/data/subjects/pmg201c.json";
import { subjects, subjectsBySlug } from "@/data/generated/subjects.generated";
import { adaptFeSwd392 } from "@/domain/subjects/fe-swd392-adapter";
import { adaptMln122, mln122RawSchema } from "@/domain/subjects/mln122-adapter";
import { adaptMma301 } from "@/domain/subjects/mma301-adapter";
import { adaptPmg201c } from "@/domain/subjects/pmg201c-adapter";
import { subjectSchema } from "@/domain/subjects/schemas";

const duplicatePromptGroups = [[1, 2], [30, 31], [34, 35], [55, 56], [98, 99], [105, 107], [147, 148]];

describe("subject data", () => {
  it("registers HCM202 PT and preserves every active source record without mutation", () => {
    const before = structuredClone(hcmPtData);
    const subject = adaptHcm202Pt(hcmPtData);
    const active = hcmPtData.questions.filter((question) => question.status === "active");
    expect(hcmPtData.questions).toHaveLength(270);
    expect(subject).toMatchObject({ id: "hcm202-pt", slug: "hcm202-pt", code: "HCM202", assessment: "Progress Test", language: "vi", questionCount: active.length });
    expect(subjectsBySlug["hcm202-pt"]).toEqual(subject);
    expect(subject.source).toMatchObject(hcmPtData.source);
    expect(subject.questions).toHaveLength(active.length);
    expect(subject.questions.map((question) => question.id)).toEqual(active.map((question) => question.id));
    for (const [index, raw] of active.entries()) {
      expect(subject.questions[index]).toMatchObject({
        id: raw.id, number: raw.number, type: raw.type === "multiple_choice" ? "multiple-choice" : "single-choice",
        question: raw.question, correctAnswers: raw.correctAnswers, correctAnswer: raw.correctAnswers[0],
        explanation: raw.explanation.trim() ? raw.explanation : null, source: raw.source,
        sourcePages: raw.sourcePages, answerTextFromSource: raw.answerTextFromSource,
        needsReview: raw.needsReview, reviewNotes: raw.reviewNotes
      });
      expect(subject.questions[index].options).toEqual(raw.options.map(({ key, ...option }) => ({ id: key, ...option })));
    }
    expect(subject.dataQuality).toMatchObject({ needsReviewCount: active.filter((question) => question.needsReview).length, duplicatePromptGroups: hcmPtData.dataQuality.duplicatePromptGroups, reviewBasis: hcmPtData.dataQuality.reviewBasis });
    expect(hcmPtData).toEqual(before);
  });

  it.each([{ sourceNotes: "Source annotation only" }, { sourceNotes: ["Source annotation only"] }])("keeps HCM202 PT sourceNotes as metadata and derives active counts: $sourceNotes", ({ sourceNotes }) => {
    const first = { ...structuredClone(hcmPtData.questions[0]), id: "original-41", number: 41, needsReview: true, reviewNotes: ["Keep this review"], sourceNotes };
    const second = { ...structuredClone(first), id: "original-73", number: 73, needsReview: false, reviewNotes: [], explanation: "  Original explanation  " };
    const input = { ...structuredClone(hcmPtData), questions: [first, { id: "inactive", status: "deleted" }, second, { status: "empty", options: null }], dataQuality: { ...hcmPtData.dataQuality, duplicatePromptGroups: [[41, 73], [41, 99]] } };
    const before = structuredClone(input);
    const subject = adaptHcm202Pt(input);
    expect(subject.questionCount).toBe(2);
    expect(subject.description).toContain("2 câu hỏi");
    expect(subject.questions.map((question) => question.id)).toEqual(["original-41", "original-73"]);
    expect(subject.questions.map((question) => question.number)).toEqual([41, 73]);
    expect(subject.questions.map((question) => question.question)).toEqual([first.question, first.question]);
    expect(subject.questions.map((question) => question.explanation)).toEqual([null, second.explanation]);
    expect(subject.questions.map((question) => question.sourceNotes)).toEqual([sourceNotes, sourceNotes]);
    expect(subject.questions.map((question) => question.reviewNotes)).toEqual([first.reviewNotes, []]);
    expect(subject.dataQuality).toMatchObject({ needsReviewCount: 1, duplicatePromptGroups: [[41, 73]] });
    expect(input).toEqual(before);
  });

  it("registers HCM202 Final Exam Chu Be Dan as an independent bank without mutation or content loss", () => {
    const before = structuredClone(hcmFeChubedanData);
    const subject = adaptHcm202FeChubedan(hcmFeChubedanData);
    const active = hcmFeChubedanData.questions.filter((question) => question.status === "active");
    expect(subject).toMatchObject({ id: "hcm202-fe-chubedan", slug: "hcm202-fe-chubedan", code: "HCM202", name: "HCM202 - Tư tưởng Hồ Chí Minh - Final Exam - Chu Be Dan", assessment: "Final Exam", language: "vi", questionCount: active.length });
    expect(subjectsBySlug["hcm202-fe-chubedan"]).toEqual(subject);
    expect(subject.id).not.toBe(subjectsBySlug["hcm202-pt"].id);
    expect(subject.questions).toHaveLength(311);
    expect(subject.questions.filter((question) => question.type === "single-choice")).toHaveLength(307);
    expect(subject.questions.filter((question) => question.type === "multiple-choice")).toHaveLength(4);
    expect(subject.questions.filter((question) => question.options.length === 3)).toHaveLength(49);
    expect(subject.questions.filter((question) => question.options.length === 4)).toHaveLength(262);
    expect(subject.dataQuality).toMatchObject({ needsReviewCount: 2, duplicatePromptGroups: [[135, 261]], reviewBasis: hcmFeChubedanData.dataQuality.reviewBasis });
    expect(subject.questions.find((question) => question.number === 135)?.question).toBe(subject.questions.find((question) => question.number === 261)?.question);
    for (const [index, raw] of active.entries()) {
      expect(subject.questions[index]).toMatchObject({ id: raw.id, number: raw.number, question: raw.question, correctAnswers: raw.correctAnswers, sourcePages: raw.sourcePages, answerTextFromSource: raw.answerTextFromSource, needsReview: raw.needsReview, reviewNotes: raw.reviewNotes });
      expect(subject.questions[index].options).toEqual(raw.options.map(({ key, ...option }) => ({ id: key, ...option })));
      expect(subject.questions[index].source).toMatchObject(raw.source);
    }
    expect(hcmFeChubedanData).toEqual(before);
  });

  it("validates the corrected canonical SWD392 dataset", () => {
    const subject = subjectSchema.parse(data);
    const ids = subject.questions.map((question) => question.id);
    const numbers = subject.questions.map((question) => question.number);
    const fiveOptionNumbers = subject.questions.filter((question) => question.options.length === 5).map((question) => question.number);

    expect(subject.contentVersion).toBe(2);
    expect(subject.questions).toHaveLength(249);
    expect(subject.questions.filter((question) => question.options.length === 4)).toHaveLength(246);
    expect(fiveOptionNumbers).toEqual([19, 39, 42]);
    expect(subject.questions.filter((question) => question.needsReview)).toHaveLength(14);
    expect(subject.questions.filter((question) => question.explanation !== null)).toHaveLength(22);
    expect(new Set(ids).size).toBe(249);
    expect(new Set(numbers).size).toBe(249);
    expect(ids).toEqual(Array.from({ length: 249 }, (_, index) => `swd392-${String(index + 1).padStart(3, "0")}`));
    expect(numbers).toEqual(Array.from({ length: 249 }, (_, index) => index + 1));
    expect(subject.questions.every((question) => question.options.some((option) => option.id === question.correctAnswer))).toBe(true);
    expect(subject.dataQuality.duplicatePromptGroups).toEqual(duplicatePromptGroups);
    expect(subject.dataQuality.answerCorrectionCount).toBe(21);
    expect(subject.dataQuality.correctedAnswerNumbers).toEqual([3, 5, 8, 14, 20, 22, 33, 38, 39, 41, 45, 51, 61, 99, 149, 153, 173, 205, 242, 243, 244]);
  });

  it("strictly adapts FE SWD392 without mutation or loss", () => {
    const before = structuredClone(feSwdData);
    const subject = adaptFeSwd392(feSwdData);
    expect(subject).toMatchObject({ id: "fe-swd392", slug: "fe-swd392", code: "FE SWD392", name: "FE SWD392", language: "en", questionCount: 263 });
    expect(subject.questions).toHaveLength(263);
    expect(subject.questions.map((question) => question.id)).toEqual(Array.from({ length: 263 }, (_, index) => `fe-swd392-${String(index + 1).padStart(3, "0")}`));
    expect(subject.questions.map((question) => question.number)).toEqual(Array.from({ length: 263 }, (_, index) => index + 1));
    expect(Object.fromEntries(["single-choice", "true-false"].map((type) => [type, subject.questions.filter((question) => question.type === type).length]))).toEqual({ "single-choice": 261, "true-false": 2 });
    expect(Object.fromEntries([2, 3, 4].map((count) => [count, subject.questions.filter((question) => question.options.length === count).length]))).toEqual({ 2: 2, 3: 2, 4: 259 });
    expect(Object.fromEntries(["A", "B", "C", "D"].map((answer) => [answer, subject.questions.filter((question) => question.correctAnswer === answer).length]))).toEqual({ A: 62, B: 74, C: 82, D: 45 });
    expect(subject.questions[0]).toMatchObject({ question: "What is inheritance?", correctAnswer: "B" });
    expect(subject.questions[262]).toMatchObject({ question: "Which of the following is NOT a case of event synchronization?", correctAnswer: "D" });
    for (const [first, second] of [[21, 162], [100, 239], [170, 180]]) expect(subject.questions[first - 1].question).toBe(subject.questions[second - 1].question);
    expect(subject.dataQuality).toMatchObject({ needsReviewCount: 8, duplicatePromptGroups: [[21, 162], [100, 239], [170, 180]] });
    for (const number of [133, 257]) expect(subject.questions[number - 1]).toMatchObject({ source: feSwdData.questions[number - 1].source, needsReview: feSwdData.questions[number - 1].needsReview, reviewNotes: feSwdData.questions[number - 1].reviewNotes });
    expect(subject.questions.every((question) => question.options.some((option) => option.id === question.correctAnswer))).toBe(true);
    expect(feSwdData).toEqual(before);
  });

  it("rejects invalid FE SWD392 metadata, IDs, options, and answers", () => {
    expect(() => adaptFeSwd392({ ...feSwdData, totalQuestions: 262 })).toThrow();
    const id = structuredClone(feSwdData); id.questions[1].id = 1;
    const blank = structuredClone(feSwdData); blank.questions[0].question = "   ";
    const duplicate = structuredClone(feSwdData); duplicate.questions[0].options[1].key = duplicate.questions[0].options[0].key;
    const missing = structuredClone(feSwdData); missing.questions[0].correctAnswer = "D"; missing.questions[0].options = missing.questions[0].options.filter((option) => option.key !== "D");
    expect(() => adaptFeSwd392(id)).toThrow(/Question 1: expected ID 2/);
    expect(() => adaptFeSwd392(blank)).toThrow();
    expect(() => adaptFeSwd392(duplicate)).toThrow(/Question 1: option keys must be unique/);
    expect(() => adaptFeSwd392(missing)).toThrow(/Question 1: correctAnswer must reference an option/);
  });

  it("adapts the corrected canonical MMA301 dataset without mutating raw source", () => {
    const before = structuredClone(mmaData);
    const mma = adaptMma301(mmaData);
    const active = mmaData.questions.filter((question) => question.status === "active");
    expect(mma).toMatchObject({ id: "mma301", slug: "mma301", code: "MMA301", contentVersion: 2, questionCount: 182 });
    expect(mmaData.questions).toHaveLength(184);
    expect(active).toHaveLength(182);
    expect(mmaData.questions.filter((question) => question.status !== "active").map((question) => question.number)).toEqual([64, 96]);
    expect(mma.questions.some((question) => [64, 96].includes(question.number))).toBe(false);
    expect(active.filter((question) => question.type === "single_choice")).toHaveLength(91);
    expect(active.filter((question) => question.type === "multiple_choice")).toHaveLength(61);
    expect(active.filter((question) => question.type === "true_false")).toHaveLength(30);
    expect(mmaData.statistics).toMatchObject({ totalEntries: 184, activeQuestions: 182, deletedOrEmptyEntries: 2, singleChoice: 91, multipleChoice: 61, trueFalse: 30, correctedAnswerEntries: 9, repairedContentEntries: 11 });
    expect(mmaData.review.correctedAnswerQuestions).toEqual([50, 88, 93, 101, 118, 141, 166, 176, 179]);
    expect(mmaData.review.repairedOptionOrQuestionQuestions).toEqual([36, 72, 82, 86, 103, 114, 121, 145, 150, 154, 180]);
    expect(mmaData.source.preserveSourceAnswers).toBe(false);
    expect(new Set(mma.questions.map((question) => question.id)).size).toBe(182);
    expect(new Set(mma.questions.map((question) => question.number)).size).toBe(182);
    expect(mma.questions.every((question) => question.correctAnswers.every((answer) => question.options.some((option) => option.id === answer)))).toBe(true);
    for (const [number, answers] of [[50, ["A", "C"]], [88, ["B"]], [93, ["A", "B"]], [101, ["A", "B", "D"]], [118, ["B"]], [141, ["B"]], [166, ["B"]], [176, ["A", "B"]], [179, ["A"]]] as const) expect(mma.questions.find((question) => question.number === number)?.correctAnswers).toEqual(answers);
    expect(mma.questions.find((question) => question.number === 88)?.type).toBe("multiple-choice");
    expect(mma.questions.find((question) => question.number === 176)?.type).toBe("multiple-choice");
    expect(mmaData).toEqual(before);
  });

  it("strictly adapts MLN122 without mutation or loss", () => {
    const before = structuredClone(mlnData);
    const subject = adaptMln122(mlnData);
    expect(subject).toMatchObject({ id: "mln122", slug: "mln122", code: "MLN122", name: "Kinh tế chính trị Mác - Lênin", language: "vi", contentVersion: 2, questionCount: 475, description: "Bộ 475 câu hỏi Kinh tế chính trị Mác - Lênin.", source: { file: "mln122.json", pageCount: 0 } });
    expect(mlnData.questions).toHaveLength(478);
    expect(mlnData.questions.filter((question) => question.disabled)).toHaveLength(3);
    expect(mlnData.questions.filter((question) => question.disabled).every((question) => question.correctAnswer === null)).toBe(true);
    expect(subject.questions).toHaveLength(475);
    expect(subject.questions.map((question) => question.id)).toEqual(mlnData.questions.filter((question) => !question.disabled).map((question) => `mln122-${String(question.id).padStart(3, "0")}`));
    expect(subject.questions.map((question) => question.number)).toEqual(mlnData.questions.filter((question) => !question.disabled).map((question) => question.id));
    expect(Object.fromEntries([3, 4, 5, 6].map((count) => [count, subject.questions.filter((question) => question.options.length === count).length]))).toEqual({ 3: 125, 4: 335, 5: 14, 6: 1 });
    expect(Object.fromEntries(["A", "B", "C", "D", "E", "F"].map((answer) => [answer, subject.questions.filter((question) => question.correctAnswer === answer).length]))).toEqual({ A: 198, B: 100, C: 90, D: 72, E: 14, F: 1 });
    expect(subject.questions[0]).toMatchObject({ correctAnswers: ["C"], explanation: expect.stringContaining("xu hướng khu vực hóa") });
    expect(subject.questions.find((question) => question.number === 30)).toMatchObject({ correctAnswers: ["A"], explanation: expect.stringContaining("Chủ nghĩa trọng thương") });
    expect(subject.questions.find((question) => question.number === 42)).toMatchObject({ correctAnswers: ["E"], options: expect.arrayContaining([{ id: "E", text: "ABC" }]) });
    expect(subject.questions.find((question) => question.number === 45)).toMatchObject({ correctAnswers: ["B"], explanation: expect.stringContaining("quan hệ xã hội, mang tính lịch sử") });
    expect(subject.questions.find((question) => question.number === 125)).toMatchObject({ correctAnswers: ["B"], explanation: expect.stringContaining("Bốn cuộc cách mạng công nghiệp") });
    expect(subject.questions.find((question) => question.number === 126)).toMatchObject({ correctAnswers: ["F"], options: expect.arrayContaining([{ id: "F", text: "BDE" }]) });
    expect(subject.questions.find((question) => question.number === 160)).toMatchObject({ id: "mln122-160", verificationStatus: "verified", source: { file: "GIÁO TRÌNH FULL.pdf", pages: [62, 61], pdfPages: [60, 59], basis: "Supplied textbook only" } });
    expect(subject.questions.find((question) => question.number === 466)).toMatchObject({ id: "mln122-466", verificationStatus: "corrected_against_review", reviewNotes: expect.any(Array) });
    expect(mlnData.questions.filter((question) => question.disabled).map((question) => question.id)).toEqual([23, 254, 269]);
    expect(subject.questions.some((question) => [23, 254, 269].includes(question.number))).toBe(false);
    expect(subject.dataQuality.duplicatePromptGroups).toEqual([[51, 307], [158, 288], [187, 296], [283, 450]]);
    expect(subject.questions.every((question) => question.type === "single-choice" && question.options.some((option) => option.id === question.correctAnswer))).toBe(true);
    expect(mlnData).toEqual(before);
    expect(subjects.map((item) => item.slug)).toEqual(["hcm202-fe-chubedan", "hcm202-pt", "pmg201c", "fe-swd392", "mln122", "mma301", "swd392"]);
    expect(subjectsBySlug.mln122).toEqual(subject);
    expect(subjectsBySlug["fe-swd392"]).toEqual(adaptFeSwd392(feSwdData));
    expect(subjectsBySlug["fe-swd392"].id).not.toBe(subjectsBySlug.swd392.id);
  });

  it("strictly adapts PMG201c detail metadata and answer shapes", () => {
    const before = structuredClone(pmgData);
    const subject = adaptPmg201c(pmgData);
    const question221 = subject.questions.find((question) => question.number === 221)!;
    expect(subject).toMatchObject({ id: "pmg201c", slug: "pmg201c", code: "PMG201c", contentVersion: 1, questionCount: 333, dataQuality: { needsReviewCount: 146, duplicatePromptGroups: expect.any(Array), reviewBasis: expect.stringContaining("Conflicting duplicate groups: 9") } });
    expect(subject.questions).toHaveLength(333);
    expect(subject.dataQuality.duplicatePromptGroups).toHaveLength(66);
    expect(subject.questions.filter((question) => question.needsReview)).toHaveLength(146);
    expect(subject.questions.filter((question) => question.options.length === 6)).toHaveLength(8);
    expect(subject.questions.filter((question) => question.type === "multiple-choice").map((question) => question.number)).toEqual([90, 93, 220, 333]);
    expect(subject.questions.find((question) => question.number === 90)?.correctAnswers).toEqual(["C", "D"]);
    expect(subject.questions.find((question) => question.number === 93)?.correctAnswers).toEqual(["A", "B"]);
    expect(subject.questions.find((question) => question.number === 220)?.correctAnswers).toEqual(["A", "B"]);
    expect(question221).toMatchObject({ id: "pmg201c-221", number: 221, needsReview: true, source: { file: "src_fe_pmg_part2(1).pdf", basis: expect.stringContaining("Part 2, source question 111") }, reviewNotes: ["Duplicate question prompt also appears at global question(s): 281."] });
    expect(subject.questions.filter((question) => question.needsReview).every((question) => question.reviewNotes.length > 0)).toBe(true);
    expect(pmgData).toEqual(before);
  });

  it("rejects invalid PMG201c counts, identity, options, answers, source ranges, and review metadata", () => {
    const invalid = (change: (copy: typeof pmgData) => void) => { const copy = structuredClone(pmgData); change(copy); return () => adaptPmg201c(copy); };
    expect(invalid((copy) => { copy.statistics.totalEntries = 332; })).toThrow();
    expect(invalid((copy) => { copy.questions.splice(1, 1); })).toThrow();
    expect(invalid((copy) => { copy.questions[1].id = copy.questions[0].id; })).toThrow(/duplicate question ID|expected ID/);
    expect(invalid((copy) => { copy.questions[0].options[1].key = copy.questions[0].options[0].key; })).toThrow(/option keys must be unique/);
    expect(invalid((copy) => { copy.questions[0].correctAnswers = ["X"]; })).toThrow(/correctAnswers must reference options/);
    expect(invalid((copy) => { copy.questions[89].correctAnswers = ["C"]; })).toThrow(/at least two answers|correct answers must be C, D/);
    expect(invalid((copy) => { copy.questions[110].source.sourceQuestionNumber = 112; })).toThrow(/Part 2 source question numbers/);
    expect(invalid((copy) => { copy.questions[221].source.sourceQuestionNumber = 113; })).toThrow(/Part 3 source question numbers/);
    expect(invalid((copy) => { copy.dataQuality.needsReviewCount = 145; })).toThrow();
    expect(invalid((copy) => { copy.dataQuality.duplicatePromptGroups.pop(); })).toThrow();
    expect(invalid((copy) => { copy.dataQuality.conflictingDuplicatePromptGroups.pop(); })).toThrow();
  });

  it("supports legacy MLN122 metadata and rejects invalid corrected records", () => {
    const legacy = structuredClone(mlnData) as Record<string, unknown>;
    legacy.schemaVersion = "1.0";
    delete legacy.source;
    delete legacy.dataQuality;
    legacy.questions = (legacy.questions as typeof mlnData.questions).map((input) => { const question = { ...input } as Record<string, unknown>; const legacyCorrectAnswer = question.legacyCorrectAnswer ?? question.correctAnswer ?? "A"; for (const key of ["source", "verificationStatus", "needsReview", "reviewNotes", "auditNotes", "disabled", "legacyCorrectAnswer"]) delete question[key]; question.correctAnswer = legacyCorrectAnswer; return question; });
    expect(mln122RawSchema.safeParse(legacy).success).toBe(true);
    expect(() => adaptMln122({ ...mlnData, totalQuestions: 477 })).toThrow();
    const blank = structuredClone(mlnData); blank.questions[0].question = "   ";
    const duplicate = structuredClone(mlnData); duplicate.questions[0].options[1].key = duplicate.questions[0].options[0].key;
    const missing = structuredClone(mlnData); missing.questions[0].correctAnswer = "X";
    const finalMetadata = structuredClone(mlnData) as Record<string, unknown>; delete ((finalMetadata.questions as Record<string, unknown>[])[0]).verificationStatus;
    const disabledDuplicate = structuredClone(mlnData); const disabled = disabledDuplicate.questions.find((question) => question.disabled)!; disabled.options[1].key = disabled.options[0].key;
    const manifestMismatch = structuredClone(mlnData); manifestMismatch.dataQuality.optionsChangedFromOriginalCount--;
    const duplicateManifest = structuredClone(mlnData); duplicateManifest.dataQuality.answerChangedFromOriginalIds[1] = duplicateManifest.dataQuality.answerChangedFromOriginalIds[0];
    expect(() => adaptMln122(blank)).toThrow();
    expect(() => adaptMln122(duplicate)).toThrow();
    expect(() => adaptMln122(missing)).toThrow();
    expect(() => adaptMln122(finalMetadata)).toThrow();
    expect(() => adaptMln122(disabledDuplicate)).toThrow();
    expect(() => adaptMln122(manifestMismatch)).toThrow();
    expect(() => adaptMln122(duplicateManifest)).toThrow();
  });

  it("rejects invalid versions, counts, correction metadata, and answer keys", () => {
    expect(subjectSchema.safeParse({ ...data, contentVersion: 0 }).success).toBe(false);
    expect(subjectSchema.safeParse({ ...data, contentVersion: undefined }).success).toBe(false);
    expect(subjectSchema.safeParse({ ...data, questionCount: 1 }).success).toBe(false);
    expect(subjectSchema.safeParse({ ...data, dataQuality: { ...data.dataQuality, answerCorrectionCount: 20 } }).success).toBe(false);
    const copy = structuredClone(data);
    copy.questions[0].correctAnswer = "X";
    expect(subjectSchema.safeParse(copy).success).toBe(false);
  });
});
