# Báo cáo tích hợp MMA301 và MLN122

## 1. Phạm vi công việc

Repository đã được mở rộng từ dữ liệu SWD392 hiện có để hỗ trợ thêm hai môn học độc lập trên cùng kiến trúc, route, component học, chế độ kiểm tra và cơ chế lưu tiến độ:

| Môn | Tên | Ngôn ngữ | Số câu runtime |
|---|---|---:|---:|
| SWD392 | Software Architecture and Design | Tiếng Anh | 249 |
| MMA301 | Mobile Application Development | Tiếng Anh | 182 |
| MLN122 | Kinh tế chính trị Mác - Lênin | Tiếng Việt | 478 |

Không tạo màn hình riêng cho từng môn. Cả ba môn dùng chung subject registry, study workspace, test mode, question list, summary và localStorage adapters.

## 2. Trạng thái Git

Tại thời điểm lập báo cáo:

- Working tree chưa được commit.
- Có 23 file tracked đã chỉnh sửa.
- Có 4 file mới chưa được track.
- `git diff --check` không phát hiện whitespace error.
- Git cảnh báo một số file LF có thể được chuyển thành CRLF khi Git xử lý lần tiếp theo trên Windows; đây không phải lỗi nội dung hoặc build.
- Commit gần nhất trước các thay đổi hiện tại: `5f7e006 feat: add paginated question list`.

### File tracked đã chỉnh sửa

- `scripts/generate-subject-registry.ts`
- `scripts/validate-subjects.ts`
- `src/app/globals.css`
- `src/components/study/QuestionList.tsx`
- `src/components/study/StudyShell.tsx`
- `src/components/test/TestResults.tsx`
- `src/components/test/TestRunner.tsx`
- `src/components/test/TestShell.tsx`
- `src/data/generated/subjects.generated.ts`
- `src/domain/study/create-session.ts`
- `src/domain/study/reducer.ts`
- `src/domain/study/types.ts`
- `src/domain/subjects/schemas.ts`
- `src/domain/test/reducer.ts`
- `src/domain/test/scoring.ts`
- `src/domain/test/types.ts`
- `src/lib/storage/local-study-storage.ts`
- `src/lib/storage/schemas.ts`
- `src/lib/storage/test-storage.ts`
- `tests/components/StudyShell.test.tsx`
- `tests/data/subject-validation.test.ts`
- `tests/domain/study-engine.test.ts`
- `tests/domain/test-engine.test.ts`

### File mới chưa được track

- `src/data/subjects/mma301.json`
- `src/data/subjects/mln122.json`
- `src/domain/subjects/mma301-adapter.ts`
- `src/domain/subjects/mln122-adapter.ts`

Báo cáo này là file mới bổ sung sau lần kiểm tra trạng thái trên.

## 3. Subject registry

Generator tại `scripts/generate-subject-registry.ts` sử dụng adapter dispatch cho ba nguồn dữ liệu:

- `mln122.json` → `adaptMln122`
- `mma301.json` → `adaptMma301`
- `swd392.json` → canonical `subjectSchema.parse`

Registry sinh tại `src/data/generated/subjects.generated.ts` hiện đăng ký theo slug:

- `mln122`
- `mma301`
- `swd392`

Các route động hiện tạo được trang cho cả ba môn, bao gồm trang chi tiết, học, kiểm tra, danh sách câu hỏi và tổng kết.

Generator cũng từ chối file JSON môn học chưa được đăng ký thay vì âm thầm bỏ qua dữ liệu.

## 4. Runtime schema chung

Schema nội bộ tại `src/domain/subjects/schemas.ts` được mở rộng để hỗ trợ:

```ts
type QuestionType =
  | "single-choice"
  | "multiple-choice"
  | "true-false";
```

Mỗi câu runtime sử dụng:

- ID câu hỏi ổn định dạng string.
- `options[].id` thay cho phụ thuộc vào vị trí mảng.
- `correctAnswers` luôn là mảng.
- `correctAnswer` tương thích ngược cho dữ liệu và logic cũ.
- Nội dung giải thích nullable.
- Metadata nguồn và cảnh báo review.

Dữ liệu SWD392 cũ có `correctAnswer` được normalize thành `correctAnswers: [correctAnswer]` mà không sửa file nguồn.

## 5. Tích hợp MMA301

### Dữ liệu

Nguồn được đặt tại:

```text
src/data/subjects/mma301.json
```

Kết quả validation:

- Source entries: 184.
- Active questions: 182.
- Excluded entries: câu 64 và 96.
- Single choice active: 92.
- Multiple choice active: 60.
- True/False active: 30.

Chỉ các câu có `status === "active"` được đưa vào runtime, chế độ học, danh sách câu hỏi và tạo bài kiểm tra.

### Adapter

`src/domain/subjects/mma301-adapter.ts` thực hiện tập trung:

- Parse raw schema bằng Zod.
- Lọc câu active.
- Chuyển `single_choice`, `multiple_choice`, `true_false` sang runtime type tương ứng.
- Chuyển `options[].key` thành `options[].id`.
- Giữ `correctAnswers` dưới dạng mảng.
- Giữ nguyên câu hỏi, lựa chọn và đáp án nguồn.
- Chuyển explanation rỗng thành `null` mà không thay đổi explanation có nội dung.
- Giữ cảnh báo nguồn của câu 118 và 150 trong `needsReview`/`reviewNotes`.

### Câu nhiều đáp án

Study và Test engine đã được đổi từ một answer string sang tập option ID:

- Có thể chọn và bỏ chọn nhiều lựa chọn.
- Không chấm ngay sau lựa chọn đầu tiên.
- Chỉ submit khi đã chọn ít nhất một đáp án.
- Chấm đúng khi hai tập đáp án khớp chính xác, không phụ thuộc thứ tự.
- Chọn thiếu hoặc thừa đều sai.
- Sau submit hiển thị đáp án đúng, lựa chọn sai đã chọn và explanation nếu có.

Ba câu MMA301 số 50, 93 và 101 được nguồn đánh dấu `multiple_choice` nhưng chỉ có một đáp án. Nội dung được giữ nguyên và validator phát warning thay vì tự sửa kiến thức nguồn.

## 6. Tích hợp MLN122

### Dữ liệu

Nguồn được đặt tại:

```text
src/data/subjects/mln122.json
```

Tên file được chuẩn hóa lowercase để phù hợp convention của subject registry; nội dung JSON nguồn không bị sửa thủ công.

Kết quả validation:

- `totalQuestions`: 478.
- Runtime questions: 478.
- ID và thứ tự: liên tục từ 1 đến 478.
- 128 câu có 3 lựa chọn.
- 338 câu có 4 lựa chọn.
- 11 câu có 5 lựa chọn.
- 1 câu có 6 lựa chọn.
- Đáp án A: 196 câu.
- Đáp án B: 101 câu.
- Đáp án C: 94 câu.
- Đáp án D: 75 câu.
- Đáp án E: 11 câu.
- Đáp án F: 1 câu.

Bốn nhóm prompt trùng được giữ nguyên và ghi nhận trong metadata:

- 51 và 307.
- 158 và 288.
- 187 và 296.
- 283 và 450.

### Adapter

`src/domain/subjects/mln122-adapter.ts` thực hiện:

- Validation schema version, subject code, language và tổng 478 câu.
- Validation ID đúng thứ tự 1–478.
- Validation câu hỏi và option không rỗng.
- Validation 2–6 lựa chọn, option key không trùng.
- Validation `correctAnswer` tồn tại trong option keys.
- Chuyển ID số thành `mln122-001` đến `mln122-478`.
- Chuyển `single_choice` thành `single-choice`.
- Chuyển `options[].key` thành `options[].id`.
- Chuyển `correctAnswer` thành `correctAnswers: [correctAnswer]`.
- Giữ nguyên tiếng Việt, nội dung câu hỏi, lựa chọn và đáp án.

Các lựa chọn tổng hợp như `E. ABC` và `F. BDE` vẫn được xử lý là một lựa chọn duy nhất đúng theo schema nguồn, không bị tách thành multiple-choice.

## 7. Study mode và trạng thái

Các thay đổi trong study domain/component hỗ trợ answer arrays nhưng giữ tương thích với SWD392:

- Single-choice và True/False chấm sau khi chọn.
- Multiple-choice chỉ chấm khi submit.
- State lựa chọn được reset theo queue instance khi chuyển câu.
- Feedback không rò sang câu tiếp theo.
- Retry và mastery vẫn hoạt động theo engine hiện có.
- Một câu được theo dõi theo question ID nên retry/làm lại không làm sai tổng số câu canonical.
- Thanh tiến độ lấy tổng từ danh sách câu runtime, không hard-code 249, 182 hoặc 478.
- MLN122 hỗ trợ phím 1–6 để chọn tối đa sáu lựa chọn.
- Các tính năng xáo trộn câu hỏi, xáo trộn đáp án, không biết, quay lại, tiếp tục và tổng kết được tái sử dụng cho môn mới.

## 8. Test mode và chấm điểm

Test session lưu response theo question ID và `selectedOptionIds`.

Chấm điểm sử dụng exact-set comparison:

```ts
selected.length === correct.length &&
selected.every((id) => correct.includes(id))
```

Kết quả:

- Không phụ thuộc thứ tự lựa chọn.
- Không tính đúng một phần.
- Điểm dựa trên số câu trong đề.
- Question generation không tạo trùng câu trong cùng đề.
- Option shuffle giữ nguyên option ID và liên kết đáp án đúng.
- Test storage tách biệt với study progress.
- MLN122 hỗ trợ đầy đủ đáp án E/F và câu có 3–6 lựa chọn.

## 9. Lưu tiến độ

Storage tiếp tục namespace theo subject ID:

```text
study-flow:v1:subject:swd392
study-flow:v1:subject:mma301
study-flow:v1:subject:mln122
```

Test session sử dụng namespace riêng tương tự:

```text
study-flow:v1:test:<subjectId>
```

Các schema storage được cập nhật để lưu answer arrays và kiểm tra option ID hợp lệ. Tiến độ SWD392, MMA301 và MLN122 không ghi đè nhau. Resume sử dụng current queue/question đã lưu; nếu dữ liệu không tương thích hoặc question không còn tồn tại, storage adapter loại dữ liệu không hợp lệ và fallback an toàn.

## 10. Hiển thị và responsive

CSS và component dùng chung được cập nhật để:

- Giữ xuống dòng trong câu hỏi, lựa chọn, explanation và code snippets.
- Dùng wrapping thay vì ellipsis.
- Cho phép nội dung dài tăng chiều cao tự nhiên.
- Dùng `overflow-wrap: anywhere` tại các vùng nội dung dài.
- Không phụ thuộc số lượng option cố định.
- Hỗ trợ lựa chọn dài và tiếng Việt trên màn hình nhỏ.

Không sử dụng `dangerouslySetInnerHTML` để hiển thị nội dung câu hỏi.

## 11. Validation và tests bổ sung

Validation script tại `scripts/validate-subjects.ts` kiểm tra riêng invariant của cả ba môn.

Tests đã bổ sung/cập nhật bao phủ:

- Normalize SWD392 từ `correctAnswer` sang mảng.
- MMA301 source count 184 và active count 182.
- Loại câu MMA301 64 và 96.
- Giữ warning câu 118 và 150.
- Exact-set scoring cho multiple-choice.
- Chọn thiếu/thừa đáp án bị tính sai.
- Study response arrays và state reset.
- Storage response arrays và referential integrity.
- MLN122 đủ 478 câu và đúng thứ tự.
- Giữ nguyên câu đầu, câu cuối và raw source.
- Phân bố lựa chọn 3–6.
- Đáp án A–F, bao gồm câu 42 đáp án E và câu 126 đáp án F.
- Registry có đủ ba slug.
- Reject MLN122 khi sai count, câu rỗng, option key trùng hoặc answer không tồn tại.

## 12. Kết quả kiểm tra cuối cùng

Lệnh đã chạy:

```text
npm run check
```

Pipeline và kết quả:

| Bước | Kết quả |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run data:validate` | PASS |
| `npm test` | PASS — 9 test files, 108 tests |
| `npm run data:generate` trong prebuild | PASS — 3 subjects |
| `npm run build` | PASS |
| `git diff --check` | PASS |

Production build Next.js 16.2.11 compile thành công và tạo route cho:

- `/subjects/mln122`
- `/subjects/mma301`
- `/subjects/swd392`
- Summary route tương ứng của cả ba môn.

## 13. Cảnh báo còn lại

- MMA301 câu 50, 93 và 101 có type `multiple-choice` nhưng nguồn chỉ cung cấp một đáp án đúng. Validator phát warning và giữ nguyên dữ liệu nguồn.
- Git có cảnh báo LF/CRLF trên Windows cho một số file khi xem diff; không có whitespace error và không ảnh hưởng lint, type-check, test hoặc build.
- Toàn bộ thay đổi hiện vẫn chưa được commit.
