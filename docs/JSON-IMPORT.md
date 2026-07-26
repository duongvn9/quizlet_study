# Import JSON

## Định dạng

Input là một JSON subject theo `subjectSchema`: `schemaVersion`, `contentVersion`, identity/code/name/language, source, dataQuality và `questions`. Mỗi question có stable `id`, `number`, `type`, prompt `question`, tối thiểu hai options, `correctAnswers`, source, `needsReview`, `reviewNotes` và explanation nullable. `correctAnswers` phải tham chiếu option tồn tại; question ID/number phải unique.

## Validation và error path

`validate(input)` không ghi dữ liệu. Thứ tự kiểm tra: UTF-8 byte limit mặc định 2.000.000 → JSON parse → quét recursive các key `__proto__`, `prototype`, `constructor` → Zod schema/cross-field invariants → duplicate normalized prompt warning. Error có `path`, `code`, `message`; ví dụ `questions.3.correctAnswers` hoặc `$` cho lỗi toàn file. Report gồm bytes, hash, filename, errors/warnings, duplicate IDs/numbers/prompts, subject normalized và các count.

## Luồng execute

1. Client chọn file nhưng server phải nhận lại raw content.
2. Server xác thực session và role admin.
3. Chạy validate, ghi import job server-side nếu đã triển khai.
4. Mở `ImportTransaction`, upsert subject/question set theo content hash.
5. Dry-run rollback; execute commit atomic.
6. Trả report và ghi audit bằng server/service-role.

Gọi `import()` kể cả `{ dryRun: true }` là thao tác quản trị và yêu cầu actor admin. `validate()` thuần không yêu cầu actor. User thường/guest nhận `BackendError` unauthorized/forbidden.

## Dry-run và idempotency

Dry-run chạy transaction/upsert logic nhưng rollback và `persisted=false`. `contentHash` hiện là FNV-1a 32-bit để nhận diện nội dung trong scaffold; không phải cryptographic digest. Repository trả `unchanged` để report `idempotent=true` và tăng `skippedCount`. Production nên hash canonical JSON bằng SHA-256 server-side và unique `(subject_id, content_hash)`.

## Giới hạn và bảo vệ

Giới hạn mặc định 2 MB áp trên UTF-8 bytes. Prototype-pollution keys bị từ chối ở mọi cấp. Zod giới hạn shape/invariants nhưng chưa có streaming parser, virus scan, archive support, rate limit hay timeout/job queue. Duplicate prompt chỉ warning vì nội dung học có thể cố ý lặp; duplicate ID/number bị schema từ chối.

## Giới hạn scaffold hiện tại

Chưa có upload UI, API route, `ImportRepository` production, database transaction adapter, durable import job, SHA-256 hay audit writer. Nếu không inject repository, admin import chỉ trả warning `unavailable` và không tuyên bố persist. Không bật `NEXT_PUBLIC_ADMIN_IMPORT_ENABLED` cho production trước khi các phần server-side hoàn tất.
