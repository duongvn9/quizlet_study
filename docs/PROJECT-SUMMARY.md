# Tóm tắt dự án

## Mục đích và stack

Study Flow là ứng dụng luyện trắc nghiệm local-first. Stack hiện tại: Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, Zod 3, Vitest và Playwright. Node 22 là phiên bản CI; môi trường review trước đó dùng Node 24 tại máy local.

## Cấu trúc và luồng dữ liệu

- `src/app`: route, loading, error và API route.
- `src/components`: giao diện subject, Learn, Test và Summary.
- `src/domain/subjects`: schema Zod, kiểu và adapter dữ liệu môn.
- `src/domain/study`: reducer, session, queue, resume và selector thuần.
- `src/domain/test`: tạo đề, chấm điểm và reducer Test.
- `src/lib/storage`: key, schema và persistence `localStorage` hiện dùng bởi UI.
- `src/lib/backend`: hợp đồng provider-neutral, auth local, repository local, progress sync, import, quyền, retry và remote boundary chưa kết nối.
- `src/data/subjects`: JSON nguồn; generator tạo `subjects.generated.ts` và validator kiểm tra registry.

Luồng tải câu hỏi là route `/subjects/[slug]` → adapter/registry môn → schema Zod → workspace; API questions chỉ phục vụ route tương ứng. Learn/Test tạo state trong domain, sau đó lưu snapshot đã validate vào key riêng của môn/chế độ. Hiện UI vẫn đọc storage cũ, không tự chuyển sang backend mới.

## Tính năng hiện có

Learn hỗ trợ tiếp tục, restart có xác nhận, retry/mastery, progress frontier và content-version recovery. Test có preset, số câu tùy chỉnh, shuffle, chấm điểm và review. Có keyboard control, âm thanh đúng, responsive layout và dữ liệu môn SWD392 v2.

Backend scaffold có feature flags an toàn false, guest auth local, hợp đồng repository, merge tiến độ, guest migration, import JSON Zod, dry-run, hash/idempotency report và SQL RLS. Remote adapter/SDK chưa được triển khai.

## Pipeline

`npm ci` → generate registry → validate JSON → lint → typecheck → unit tests → build → Playwright. Sửa dataset phải giữ stable `id`/`number`, tăng `contentVersion`, chạy generator/validator và kiểm tra ảnh hưởng progress.

## Baseline và rủi ro hồi quy

Baseline review ghi nhận unit suite 4 failures và E2E suite 8 failures trong `replaceAnswer`/Learn flow. Các lỗi này đã được sửa trong cùng branch; kết quả cuối là 127/127 unit tests và 17/17 E2E tests pass. Node local là 24, CI là 22. Rủi ro chính: hai tab có thể ghi đè local snapshot, remote sync chưa chạy thật, schema SQL chưa được chạy trên database thật, và thay đổi content version có thể làm mất khả năng resume của phiên cũ.

## Nợ kỹ thuật và đề xuất

Cần thêm database integration test, hoàn thiện remote auth/progress adapter, server-side import job, rate limit, telemetry, deletion/export, conflict UI và multi-tab locking. Đề xuất triển khai theo thứ tự: giữ local mặc định, chạy migration ở môi trường disposable, bật auth riêng, bật remote progress sau khi đo lỗi, cuối cùng bật admin import.
