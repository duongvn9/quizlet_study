import Link from "next/link";

export type StudyMode = "learn" | "test" | "questions";

export function StudyModeSelector({ slug, mode }: { slug: string; mode: StudyMode }) {
  return <nav className="study-mode-selector" aria-label="Chế độ học">
    <Link href={`/subjects/${slug}/study?mode=learn`} aria-current={mode === "learn" ? "page" : undefined}>Học</Link>
    <Link href={`/subjects/${slug}/study?mode=test`} aria-current={mode === "test" ? "page" : undefined}>Kiểm tra</Link>
    <Link href={`/subjects/${slug}/study?mode=questions`} aria-current={mode === "questions" ? "page" : undefined}>Danh sách câu hỏi</Link>
  </nav>;
}
