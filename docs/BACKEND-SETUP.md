# Thiết lập backend

## Local-only hiện tại

1. Cài Node 22 và chạy `npm ci`.
2. Không cần `.env.local`; mọi flag mặc định false.
3. Nếu muốn khai báo rõ, copy `.env.example` thành `.env.local`.
4. Chạy `npm run dev`. UI tiếp tục dùng `localStorage`, LocalAuthService biểu diễn guest và không có remote request.

Ba biến public chỉ là feature gate, không phải secret: `NEXT_PUBLIC_AUTH_ENABLED`, `NEXT_PUBLIC_REMOTE_PROGRESS_ENABLED`, `NEXT_PUBLIC_ADMIN_IMPORT_ENABLED`. Giá trị duy nhất bật flag là chuỗi `true`. Không bật flag nếu adapter/server route tương ứng chưa tồn tại.

## Supabase CLI cho development

1. Cài Supabase CLI theo tài liệu chính thức và bảo đảm Docker hoạt động.
2. Tại repo, khởi tạo/link cấu hình CLI nếu chưa có; không ghi project token vào git.
3. Chạy local stack, sau đó chạy reset/apply migration từ `supabase/migrations`.
4. Dùng local anon URL/key do CLI sinh chỉ trong `.env.local`; service-role key chỉ dùng server/test process, tuyệt đối không đặt `NEXT_PUBLIC_*`.
5. Chạy test SQL cho anonymous, authenticated user, admin và service role trước khi bật ứng dụng.

Repo hiện chưa có SDK hoặc Supabase adapter, vì vậy chỉ chạy migration không làm UI sync.

## Supabase Dashboard cho hosted project

1. Tạo project theo quy trình tổ chức; chọn region và kiểm tra free-tier limits tại ngày triển khai.
2. Áp migration bằng CLI/CI đã review, không paste tùy tiện vào production SQL editor.
3. Cấu hình Auth redirect/origin và email provider phù hợp.
4. Lưu URL/anon key ở môi trường client khi adapter cần; service-role/database password chỉ ở secret store server.
5. Generate DB types sau migration và kiểm tra diff.

## Bootstrap admin an toàn

Trigger tạo profile luôn gán role `user`, không đọc role admin từ metadata client. Admin đầu tiên phải được nâng quyền bằng thao tác server-side có kiểm soát: migration seed dành riêng môi trường với UUID đã xác minh, dashboard SQL dưới tài khoản operator, hoặc server function/service-role có allowlist và audit. Không cung cấp fake UUID/credential và không cho client update `role`.

## Migration và rollback

Backup trước khi áp dụng hosted migration. Chạy trên disposable/local trước, kiểm tra constraint/RLS và query plan. Migration hiện tạo mới schema nền; rollback production phải là migration mới có kiểm tra dữ liệu, export trước rồi mới drop policy/table nếu thật sự cần. Không sửa lịch sử migration sau khi đã deploy.
