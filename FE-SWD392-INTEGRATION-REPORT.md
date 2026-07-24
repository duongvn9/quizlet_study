# FE SWD392 Integration Report

## 1. Tóm tắt phạm vi thay đổi

Đã tích hợp FE SWD392 thành môn học độc lập thứ tư bằng subject registry, dynamic routes, study mode, test mode, question list, summary, storage và design system dùng chung. Môn SWD392 hiện tại không bị đổi tên, ghi đè hoặc gộp dữ liệu.

## 2. File tạo mới

- `src/data/subjects/fe-swd392.json`
- `src/domain/subjects/fe-swd392-adapter.ts`
- `FE-SWD392-INTEGRATION-REPORT.md`

## 3. File chỉnh sửa

- `scripts/generate-subject-registry.ts`
- `scripts/validate-subjects.ts`
- `src/data/generated/subjects.generated.ts`
- `tests/data/subject-validation.test.ts`
- `e2e/study-flow.spec.ts`

## 4. Vị trí file dữ liệu

Nguồn duy nhất: `src/data/subjects/fe-swd392.json`. File được đổi tên từ `FE_SWD.json` theo convention lowercase/slug; nội dung câu hỏi, lựa chọn, đáp án và review metadata không bị sửa.

## 5. Cách adapter hoạt động

`adaptFeSwd392(rawData)` validate schema nguồn bằng Zod, gồm metadata nguồn, đúng 263 câu, ID liên tục 1–263, type hợp lệ, 2–4 lựa chọn, option key duy nhất, nội dung không rỗng và đáp án tham chiếu option tồn tại. Adapter ánh xạ metadata nguồn sang runtime `fe-swd392` / `FE SWD392`, type `single_choice` thành `single-choice`, `true_false` thành `true-false`, `options.key` thành `options.id`, và `correctAnswer` thành `correctAnswers`. Runtime ID ổn định từ `fe-swd392-001` đến `fe-swd392-263`. `explanation` là `null`; `source`, `needsReview` và `reviewNotes` được giữ nguyên.

## 6. Subject registry

Generator đăng ký bốn adapter/file: `fe-swd392`, `mln122`, `mma301`, `swd392`. Generator vẫn từ chối JSON chưa đăng ký, kiểm tra filename/slug và chống trùng ID/slug. Registry generated chứa đủ bốn môn và FE SWD392 có ID riêng, không ghi đè SWD392.

## 7. Route

Dynamic route hiện có tạo và phục vụ:

- `/subjects/fe-swd392`
- `/subjects/fe-swd392/study?mode=learn`
- `/subjects/fe-swd392/study?mode=test`
- `/subjects/fe-swd392/study?mode=questions`
- `/subjects/fe-swd392/summary`

Production build xác nhận detail và summary được prerender cho `fe-swd392`; study/questions/test dùng route động dùng chung.

## 8. Tổng câu hỏi

- Source questions: 263
- Runtime questions: 263
- Thứ tự: 1–263
- Runtime IDs: `fe-swd392-001`–`fe-swd392-263`

## 9. Phân bố question type

- `single-choice`: 261
- `true-false`: 2

## 10. Phân bố số lựa chọn

- 2 lựa chọn: 2
- 3 lựa chọn: 2
- 4 lựa chọn: 259

## 11. Phân bố đáp án

- A: 61
- B: 75
- C: 82
- D: 45

## 12. Lưu tiến độ

Storage dùng subject runtime ID nên tự namespace riêng:

- Study: `study-flow:v1:subject:fe-swd392`
- Test: `study-flow:v1:test:fe-swd392`

Resume, reset, retry, mastery, option/question shuffle và test persistence tiếp tục dùng implementation chung.

## 13. Cách tránh ghi đè SWD392

FE SWD392 dùng `id` và `slug` là `fe-swd392`; SWD392 cũ giữ `id` và `slug` là `swd392`. Registry kiểm tra trùng ID/slug, storage key lấy theo subject ID và route lấy theo slug nên dữ liệu, route và tiến độ hoàn toàn tách biệt.

## 14. Tests bổ sung/cập nhật

- Adapter không mutate nguồn và không làm mất dữ liệu.
- Source/runtime count và runtime ID liên tục.
- Type, option và answer distributions.
- Câu đầu/cuối và đáp án.
- Các duplicate prompt 21/162, 100/239, 170/180.
- Review metadata, đặc biệt câu 133 và 257; tổng review là 8.
- Reject metadata/count/ID/blank/duplicate option/missing answer không hợp lệ.
- Registry chứa đủ bốn môn và FE không ghi đè SWD392.
- E2E selector phân biệt SWD392 với FE SWD392 bằng route chính xác.
- E2E confirm flow dùng confirm dialog hiện tại.
- Existing study/test domain và component suites xác nhận scoring theo option ID, shuffle, retry, mastery, resume, true-false-compatible single selection, multiple-choice regression và storage isolation.

## 15. Lint

PASS — `npm run lint`.

## 16. Type-check

PASS — `npm run typecheck`.

## 17. Validation

PASS — `npm run data:validate`.

Kết quả:

- FE SWD392: 263 câu, 8 review, content version 1.
- MLN122: 478 câu.
- MMA301: 182 runtime questions.
- SWD392: 249 câu.

## 18. Tests

PASS — `npm test`: 9 test files, 110 tests.

PASS — `npm run test:e2e`: 17 Playwright tests, bao gồm responsive tại 360, 390, 768, 1024 và 1440 px.

## 19. Build

PASS — `npm run build` với Next.js 16.2.11. Production build compile, TypeScript, page data và static generation đều thành công.

PASS — `npm run check`.

PASS — `npm run data:generate` tạo registry cho 4 môn.

PASS — `git diff --check`.

## 20. Trạng thái Git

Không tạo commit. Working tree có các file modified/new thuộc phạm vi tích hợp:

- Modified: `e2e/study-flow.spec.ts`
- Modified: `scripts/generate-subject-registry.ts`
- Modified: `scripts/validate-subjects.ts`
- Modified: `src/data/generated/subjects.generated.ts`
- Modified: `tests/data/subject-validation.test.ts`
- New: `src/data/subjects/fe-swd392.json`
- New: `src/domain/subjects/fe-swd392-adapter.ts`
- New: `FE-SWD392-INTEGRATION-REPORT.md`

## 21. Cảnh báo còn lại

- Validator tiếp tục phát ba cảnh báo nguồn đã có của MMA301 tại câu 50, 93 và 101; không liên quan FE SWD392 và dữ liệu nguồn được bảo toàn.
- Git cảnh báo LF có thể được chuyển thành CRLF trên Windows khi Git chạm lại một số file; `git diff --check` vẫn PASS.
