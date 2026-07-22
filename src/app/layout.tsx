import type { Metadata } from "next";import Link from "next/link";import "./globals.css";
export const metadata:Metadata={title:"Study Flow",description:"Học trắc nghiệm tập trung, lưu tiến độ ngay trên thiết bị"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body><header className="app-header"><Link href="/" className="brand">Study Flow</Link><span>Học vững từng câu</span></header><main className="container">{children}</main></body></html>}
