# Báo cáo triển khai

## Phạm vi file

- Thêm toàn bộ `src/lib/backend`: `config.ts`, `errors.ts`, `types.ts`, `local.ts`, `progress.ts`, `import.ts`, `permissions.ts`, `retry.ts`, `remote.ts`, `index.ts`.
- Thêm tests: `tests/backend/utilities.test.ts`, `import.test.ts`, `progress.test.ts`.
- Thêm migration: `supabase/migrations/202607260001_backend_foundation.sql`.
- Thêm `.env.example`, sửa `.gitignore` để track file mẫu.
- Sửa `src/domain/study/reducer.ts` và `src/components/study/StudyShell.tsx` để khôi phục đúng contract thay thế đáp án, giữ identity/timestamp/attempt count và không commit state khi không đổi.
- Thêm/viết lại `docs/PROJECT-SUMMARY.md`, `BASE-ARCHITECTURE.md`, `BACKEND-TODOS.md`, `BACKEND-SETUP.md`, `JSON-IMPORT.md`, `IMPLEMENTATION-REPORT.md` và cập nhật tối thiểu `README.md`.

## Kiến trúc và provider

Kiến trúc provider-neutral giữ UI/domain độc lập SDK. Supabase được đề xuất sau adapter vì PostgreSQL/RLS/Auth/migration phù hợp dữ liệu relational; repo không thêm SDK, project URL, key hoặc credential. Firebase/Appwrite/Neon vẫn có thể thay bằng cách implement contract.

## Đang hoạt động và scaffold

Đang hoạt động ở mức module thuần: safe-false flags, guest-safe LocalAuthService, memory repositories, normalized errors, permissions, retry, local owner-isolated progress, merge/version strategy, local-first remote failure survival, guest migration, JSON validation/protection/report và SQL artifact.

Chỉ là scaffold: remote auth/progress, UI integration, server import API/repository, hosted database, audit writer, rate limit, observability và provider deployment. Migration chưa được chứng minh đã chạy trên Supabase local/hosted.

## Kết quả kiểm tra

Baseline ban đầu: 109 unit tests pass/4 fail và 9 E2E pass/8 fail. Sau khi sửa contract `replaceAnswer`: targeted backend 14/14 pass, full unit 127/127 pass, Playwright 17/17 pass, data validation pass cho 4 datasets, lint pass, typecheck pass và production build pass. Baseline/final chạy local Node 24; CI dùng Node 22.

## Rủi ro và thao tác thủ công

Cần chạy migration trên disposable DB, test RLS theo từng role, bootstrap admin server-side, generate DB types, triển khai adapter và giữ secrets trong server secret store. Rủi ro gồm policy sai, version conflict, multi-tab overwrite, hash scaffold collision, import lớn, baseline regression và khác biệt Node 22/24.

Rollback: tắt cả ba flags về false để quay local mode; code UI hiện vốn chưa phụ thuộc remote. Database rollback phải backup/export và dùng migration forward mới, không xóa dữ liệu thủ công.

## Trạng thái Git

Branch: `feat/backend-foundation`

Commit: pending tại thời điểm viết báo cáo; hash được ghi trong báo cáo terminal sau commit.

Push: pending tại thời điểm viết báo cáo; trạng thái được ghi trong báo cáo terminal sau push.
