# Backend TODOs

## Now

| TODO | Mục tiêu/phạm vi | Phụ thuộc | Acceptance | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Chạy migration disposable | Xác nhận cú pháp, constraint, trigger, RLS trên Supabase local | Docker, Supabase CLI | reset DB thành công; test user/admin/published/own-data pass | Policy recursion hoặc privilege sai | Chưa làm |
| Sửa baseline tests | Sửa 4 unit failures và 8 E2E failures của `replaceAnswer`/Learn flow | Node 22/24, Chromium | 127/127 unit và 17/17 E2E pass | Thay đổi semantics thay thế đáp án | Hoàn thành |
| Database tests | Kiểm tra không tự nâng admin, owner isolation, published reads, audit immutable | Migration chạy được | SQL integration tests chạy CI | Test service-role khác client role | Chưa làm |
| Server import endpoint | Parse/validate/auth/rate-limit/transaction trên server | Auth adapter, ImportRepository | user bị 403; admin dry-run không ghi; execute atomic/idempotent | Upload độc hại, timeout | Scaffold |

## Next

| TODO | Mục tiêu/phạm vi | Phụ thuộc | Acceptance | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Remote Auth adapter | Implement đủ `AuthService` | Provider project, env server/client đúng | sign-up/in/out/restore và loading/error test pass | Session leakage | Chưa làm |
| Remote Progress adapter | CRUD theo user/question set | Auth, generated DB types | RLS owner test; optimistic revision; retry policy | Conflict/data loss | Chưa làm |
| Sync rollout | Kết nối `SyncedProgressRepository`, migration guest UX | Remote progress | local write tồn tại khi offline; guest merge xác nhận | Double-write, multi-tab | Scaffold utility |
| Admin UI import | Upload, report, dry-run, confirm execute | Server import endpoint | hiển thị error path/count/hash; không client-side admin trust | File lớn/UX sai | Chưa làm |
| Audit function | Ghi audit bằng server function/service role | Server backend | client insert bị chặn; admin đọc được | Log chứa PII | Chưa làm |

## Later

| TODO | Mục tiêu/phạm vi | Phụ thuộc | Acceptance | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Observability | Metrics sync/import/auth, correlation ID | Remote runtime | dashboard và alert cơ bản | Chi phí/PII | Chưa làm |
| Backup/restore | PITR/export rehearsal | Provider plan | restore drill có RTO/RPO | Free tier giới hạn | Chưa làm |
| Privacy lifecycle | Export/delete account và retention | Auth/data inventory | xóa cascade đúng, audit retention riêng | Xóa nhầm/audit compliance | Chưa làm |
| Provider portability | Export SQL/data và adapter contract tests | Remote implementation | chạy contract suite với provider thứ hai/mock | Feature-specific lock-in | Chưa làm |
| Conflict UI | Cho người dùng chọn khi version/session không merge an toàn | Sync telemetry | không mất attempt; quyết định minh bạch | UX phức tạp | Chưa làm |
