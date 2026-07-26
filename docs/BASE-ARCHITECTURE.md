# Kiến trúc backend nền

## Sơ đồ phụ thuộc

```text
src/app + src/components
  -> src/domain/*
  -> src/lib/storage hiện hữu
  -> src/lib/backend/contracts
       -> local adapters
       -> synced progress wrapper
       -> remote adapter boundary
       -> SQL migration / provider implementation tương lai
```

UI không import SDK provider. Backend mới là lớp hợp đồng để có thể thay provider mà không đổi domain/UI.

## Sáu nhóm abstraction chính

| Abstraction | File | Trách nhiệm |
| --- | --- | --- |
| `AuthService` | `types.ts`, `local.ts` | `signUp`, `signIn`, `signOut`, `restoreSession`, `currentUser`; trả `AuthState` gồm user/loading/error. Local mode luôn guest-safe. |
| `UserRepository` | `types.ts`, `local.ts` | đọc/upsert hồ sơ người dùng, không cho client tự nâng admin trong SQL. |
| `SubjectRepository` | `types.ts`, `local.ts` | list/get/upsert/remove subject, dùng cho import/admin về sau. |
| `QuestionSetRepository` | `types.ts`, `local.ts` | list/replace questions theo subject. |
| `ProgressRepository` | `types.ts`, `progress.ts` | get/save/clear local, remote boundary, synced wrapper, owner isolation và guest migration. |
| `ImportService` + `ImportRepository` | `types.ts`, `import.ts` | validate JSON, dry-run, quyền admin, transaction/upsert, report/hash/idempotency. |

## Mapping module

- `config.ts`: flags `NEXT_PUBLIC_AUTH_ENABLED`, `NEXT_PUBLIC_REMOTE_PROGRESS_ENABLED`, `NEXT_PUBLIC_ADMIN_IMPORT_ENABLED`; mặc định false.
- `errors.ts`: `BackendError` và `normalizeError` để UI không phụ thuộc lỗi provider.
- `permissions.ts`: `canManageContent`, `canAccessOwner`, `requireOwner`.
- `retry.ts`: retry exponential cho thao tác remote transient.
- `progress.ts`: local writes first, merge, remote error survival, guest migration.
- `import.ts`: JSON parser, Zod validation, prototype-pollution guard, hash, permission gate.
- `remote.ts`: adapter unavailable; không có SDK hay credential.

## Chế độ hoạt động

Local-only là mặc định: không auth thật, không remote progress, không admin import execution; UI hiện vẫn dùng `src/lib/storage`. Auth mode tương lai bật `NEXT_PUBLIC_AUTH_ENABLED=true` nhưng phải có adapter thật. Remote progress chỉ bật khi `NEXT_PUBLIC_REMOTE_PROGRESS_ENABLED=true` và có repository remote; `SyncedProgressRepository` ghi local trước rồi cố sync. Admin import chỉ bật sau khi có server-side route, repository transaction và kiểm tra admin ở backend.

## Loading, lỗi, retry và conflict

Auth trả `AuthState` để UI phân biệt loading/error/user. Remote errors phải normalize thành `BackendError`. Retry chỉ dùng cho remote transient và không dùng cho validation deterministic. Progress conflict: owner/subject khác là conflict; content version khác chọn version mới hơn; cùng version merge từng `questionProgress` theo `lastSeenAt`, giữ max aggregate counters và clamp `currentIndex/frontierIndex` trong queue. Nếu remote save fail, local save vẫn sống.

## Version và provider replacement

Subject có `contentVersion`; SQL question set có `version` và `content_hash`. Version conflict chưa có UI review nên chiến lược scaffold chọn version mới hơn. Provider replacement yêu cầu implement các interface trong `types.ts`; không đổi domain, storage legacy hoặc UI.

## Quyền và audit

Client thường chỉ đọc published content và tự quản progress/attempts của mình. Admin-only write áp dụng subjects/question sets/questions/import jobs. Client không có insert policy vào audit logs; audit phải do server function/service-role ghi. SQL có helper `is_admin()` và trigger tạo profile role `user`; client update profile không được đổi role.

## So sánh provider tham khảo ngày 2026-07-26

Các giới hạn free tier cần xác minh lại tại tài liệu chính thức trước khi bật production; bảng dưới ghi tiêu chí và trạng thái đánh giá, không cam kết quota.

| Tiêu chí | Supabase | Firebase | Appwrite | Neon |
| --- | --- | --- | --- | --- |
| Auth | Có Auth tích hợp, hợp RLS | Mạnh, phổ biến | Có Auth | Không phải trọng tâm, cần provider auth khác |
| Database | PostgreSQL | Firestore/Realtime DB NoSQL | Database document | PostgreSQL serverless |
| Storage | Có object storage | Cloud Storage | Storage tích hợp | Không phải product chính |
| Functions | Edge Functions | Cloud Functions | Functions | Cần nền tảng khác |
| RLS/security | PostgreSQL RLS mạnh | Rules riêng Firestore | Permission model riêng | PostgreSQL roles/RLS khả dụng nhưng auth cần ghép |
| Migrations | SQL migrations rõ | Ít SQL migration vì NoSQL | Migration phụ thuộc tooling | SQL migrations tốt |
| Local dev | Supabase CLI | Emulator Suite | Appwrite local/self-host | Neon cloud/dev branch, local cần Postgres riêng |
| TypeScript | SDK TS | SDK TS rất mạnh | SDK TS | SQL/client TS tùy chọn |
| Free-tier limits | Phải verify ngày dùng; có giới hạn DB/storage/egress/project pause | Phải verify; quota đọc/ghi/storage khác theo plan | Phải verify cloud/self-host | Phải verify compute/storage/branch |
| Lock-in/export | PostgreSQL dễ export hơn | Rules/data model lock-in cao hơn | API/model lock-in vừa | PostgreSQL export tốt, auth tự xử lý |

Rationale: chọn Supabase sau adapter vì cần SQL, RLS, migration, Auth và storage đồng bộ trong một provider. Firebase tốt cho realtime/mobile nhưng lệch schema relational. Appwrite phù hợp self-host nhưng permission model khác. Neon mạnh PostgreSQL nhưng thiếu auth/storage tích hợp nên phải ghép thêm dịch vụ.

## Tradeoff

Scaffold này ưu tiên không phá UI và không thêm secret/SDK. Đổi lại, chưa có sync thật, chưa có server import route, migration chưa được kiểm thử bằng DB thật và audit chỉ là thiết kế SQL.
