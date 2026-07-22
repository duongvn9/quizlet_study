"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);
  return <section className="card" role="alert"><h1>Không thể tải nội dung</h1><p>Đã xảy ra lỗi tạm thời. Tiến độ trên trình duyệt không bị xóa.</p><button className="button" type="button" onClick={unstable_retry}>Thử lại</button></section>;
}
