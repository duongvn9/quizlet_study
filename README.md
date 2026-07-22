# Study Flow

Ứng dụng học trắc nghiệm local-first bằng Next.js App Router, React, TypeScript và Tailwind. Không tài khoản, cơ sở dữ liệu hay biến môi trường; tiến độ nằm trong `localStorage`.

## Cài đặt

```bash
npm install
npm run dev
```

## Kiểm tra

```bash
npm run data:generate
npm run data:validate
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Kiến trúc và dữ liệu

`src/domain/subjects` định nghĩa Zod schema; `src/domain/study` là engine thuần; `src/lib/storage` xác thực persistence; `src/components` và `src/app` là presentation. Mỗi subject có `schemaVersion`, `contentVersion`, metadata và questions. Mỗi question có stable `id`, `number`, `correctAnswer`, options, `needsReview`, và `reviewNotes`.

Để thêm môn: đặt JSON hợp lệ tại `src/data/subjects/<slug>.json`, chạy `npm run data:generate`, `npm run data:validate`, rồi build. Không cần sửa component.

Để sửa đáp án/nội dung: giữ nguyên `id` và `number`; cập nhật trường cần thiết; đảm bảo `correctAnswer` tồn tại trong options; tăng `contentVersion` đúng 1; chạy generate, validate, lint, typecheck, test và build; commit/push. Lần truy cập sau chỉ tiến độ môn đó bị đặt lại.

## Lưu trữ

Dữ liệu dùng `study-flow:v1:subject:<id>`, thiết lập `study-flow:v1:settings`, thông báo `study-flow:v1:notice:<id>`. Persisted schema là v1. Dữ liệu sai hoặc content version khác được cô lập theo môn và không xóa key không liên quan.

## Âm thanh trả lời đúng

Âm thanh phản hồi dùng tài sản nội bộ `public/assets/correct-answer.mp3` và chỉ phát một lần khi người học gửi một đáp án đúng mới. Âm thanh không phát cho đáp án sai, “Không biết”, khi xem lại lịch sử, khi khôi phục phiên sau reload, hoặc khi đáp án đã bị khóa. Lỗi tải/phát âm thanh và chính sách autoplay của trình duyệt được bỏ qua an toàn, không làm gián đoạn học tập.

Công tắc **Âm thanh** trên trang học được bật mặc định. Lựa chọn được lưu riêng trên thiết bị bằng khóa `study-flow:v1:sound`; giá trị `false` tắt phản hồi ở các lần truy cập sau. Trình duyệt tải trước tệp với `preload="auto"`. Xóa dữ liệu trình duyệt sẽ đặt tùy chọn về mặc định.

Các kiểm thử hook và component dùng browser `Audio` mock để xác nhận phát đúng một lần, các trường hợp không phát, lưu/khôi phục tùy chọn tắt và xử lý promise phát bị từ chối.

## Triển khai Vercel

Tạo repository GitHub, push dự án, chọn **Add New Project** trong Vercel, import repository, xác nhận Next.js và Deploy. Kiểm tra trang chủ, chi tiết, luồng học, reload và reset theo content version. Không cần cấu hình secrets.

## Giới hạn

Không đồng bộ đa thiết bị; xóa dữ liệu trình duyệt sẽ mất tiến độ; không upload tài liệu; không tài khoản; cập nhật nội dung chủ ý đặt lại môn bị ảnh hưởng.
