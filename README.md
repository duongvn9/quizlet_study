# Study Flow

Ứng dụng học trắc nghiệm local-first bằng Next.js App Router, React, TypeScript và Tailwind. Không tài khoản, cơ sở dữ liệu hay biến môi trường; tiến độ nằm trong `localStorage`.

## Yêu cầu và cài đặt

Node.js 22 được khuyến nghị và là phiên bản CI sử dụng.

```bash
npm ci
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

CI chạy tuần tự các bước trên khi có push vào `master` hoặc Pull Request nhắm tới `master`, kiểm tra generated registry sạch, cài riêng Chromium và tải Playwright report khi thất bại.

## Đóng góp và tạo Pull Request

1. Clone repository, tạo nhánh mới từ `master` và đặt tên theo nội dung thay đổi:

```bash
git switch master
git pull origin master
git switch -c feat/ten-tinh-nang
```

2. Cài dependencies, thực hiện thay đổi và chạy đầy đủ kiểm tra ở mục **Kiểm tra**.
3. Commit và push nhánh lên repository:

```bash
git add .
git commit -m "feat: mô tả ngắn gọn"
git push -u origin feat/ten-tinh-nang
```

4. Trên GitHub, chọn **Compare & pull request**, đặt base là `master`, mô tả thay đổi và cách kiểm tra, rồi tạo Pull Request.
5. Chờ CI thành công và review được chấp thuận trước khi merge. Không push trực tiếp vào `master` nếu repository áp dụng branch protection.

Người không có quyền push vào repository cần fork repository, push nhánh lên fork và tạo Pull Request từ nhánh fork vào `master` của repository gốc.

## SWD392 v2

Dataset chuẩn tại `src/data/subjects/swd392.json` có `contentVersion: 2`, 249 câu: 246 câu bốn lựa chọn và các câu 19, 39, 42 có năm lựa chọn. Có 14 câu `needsReview`, 22 giải thích không rỗng và metadata ghi 21 đáp án đã hiệu chỉnh. `reviewBasis` và danh sách số câu hiệu chỉnh được lưu trong `dataQuality`; đây là provenance của dataset, không phải tuyên bố xác minh học thuật độc lập.

## Kiến trúc và dữ liệu

`src/domain/subjects` định nghĩa Zod schema; `src/domain/study` là engine thuần; `src/lib/storage` xác thực persistence; `src/components` và `src/app` là presentation. Mỗi subject có `schemaVersion`, `contentVersion`, metadata và questions. Mỗi question có stable `id`, `number`, `correctAnswer`, options, `needsReview`, `reviewNotes` và `explanation` tùy chọn.

Để thêm môn: đặt JSON hợp lệ tại `src/data/subjects/<slug>.json`, bảo đảm filename trùng slug và ID/slug không trùng môn khác, chạy generate/validate rồi build. Generator từ chối identity trùng và không âm thầm ghi đè registry.

Để sửa đáp án/nội dung: giữ nguyên `id` và `number`; cập nhật trường cần thiết; bảo đảm `correctAnswer` tồn tại trong options; tăng `contentVersion` đúng 1; chạy đầy đủ kiểm tra và commit generated output. Lần truy cập sau chỉ tiến độ môn bị cập nhật được đặt lại.

## Phiên học và khôi phục

**Tiếp tục học** khôi phục đúng queue và vị trí của phiên đang hoạt động. **Học lại toàn bộ** yêu cầu xác nhận khi thay thế phiên chưa hoàn thành, tạo `sessionId`, queue và vị trí mới nhưng giữ tiến độ dài hạn/mastery của môn. **Đặt lại tiến độ** mới xóa tiến độ dài hạn của môn hiện tại; dữ liệu môn khác không bị ảnh hưởng.

Sau khi trả lời, giao diện hiển thị phản hồi và `Giải thích` khi dữ liệu có nội dung. Dữ liệu được render bằng React text, không dùng HTML thô.

Dữ liệu lưu tại `study-flow:v1:subject:<id>`, thiết lập tại `study-flow:v1:settings`, âm thanh tại `study-flow:v1:sound`, thông báo tại `study-flow:v1:notice:<id>`. Persisted schema là v1. State sai shape hoặc semantic invariant được cô lập và đặt lại riêng theo môn, đồng thời hiển thị thông báo tiếng Việt; content-version mismatch cũng chỉ reset môn liên quan. Không có đồng bộ đa tab, nên hai tab mở đồng thời có thể ghi đè snapshot của nhau.

## Âm thanh trả lời đúng

Âm thanh nội bộ nằm tại `public/assets/correct-answer.mp3` và chỉ phát một lần cho đáp án đúng mới. Không phát cho đáp án sai, “Không biết”, lịch sử, reload hoặc đáp án đã khóa. Lỗi tải/phát được bỏ qua an toàn.

Để thay âm thanh, thay tệp tại đúng path bằng MP3 có quyền sử dụng, giữ tên `correct-answer.mp3`, kiểm tra kích thước/tương thích trình duyệt, rồi chạy unit/component tests và Playwright. Công tắc **Âm thanh** bật mặc định và được lưu riêng trên thiết bị.

## Dependency advisories

Tại ngày 2026-07-22, `npm audit --omit=dev` còn 3 finding qua Next.js 16.2.11: PostCSS `<8.5.10` (1 moderate) và sharp `<0.35.0`/libvips (2 high). Next.js 16.2.11 và `eslint-config-next` 16.2.11 là stable latest; npm chỉ đề xuất forced downgrade xuống Next 9 nên không áp dụng. Ứng dụng không nhận CSS do người dùng cung cấp và không dùng `next/image`, làm giảm exposure thực tế, nhưng rủi ro chưa được xóa. Theo dõi bản Next stable đã nâng các transitive dependency, cập nhật đồng bộ Next/eslint-config-next và chạy lại full suite ngay khi có.

## Triển khai Vercel

Import repository vào Vercel dưới dạng Next.js project; không cần secrets. Trước Preview, chạy full suite từ clean clone. Kiểm tra thư viện, chi tiết môn, continue/restart, reload, explanation, content-version recovery và summary. CI dùng Chromium với development server; production build được kiểm tra riêng.

## Giới hạn

Không đồng bộ đa thiết bị hoặc đa tab; xóa dữ liệu trình duyệt sẽ mất tiến độ; không upload tài liệu; không tài khoản. Production deployment vẫn cần quyết định chấp nhận hoặc chờ sửa các dependency advisory nêu trên.
