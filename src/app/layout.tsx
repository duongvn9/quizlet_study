import type { Metadata } from "next";import Link from "next/link";import { Analytics } from "@vercel/analytics/next";import "./globals.css";
export const metadata:Metadata={title:"Ôn Thi Cùng Ngọc Dương",description:"Học trắc nghiệm tập trung, lưu tiến độ ngay trên thiết bị"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><header className="app-header"><Link href="/" className="brand">Final Exam</Link></header><main className="container">{children}</main><Analytics /></body></html>}
