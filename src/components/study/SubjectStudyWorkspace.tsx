import type { Subject } from "@/domain/subjects/types";
import { StudyModeSelector, type StudyMode } from "@/components/study/StudyModeSelector";
import { StudyShell } from "@/components/study/StudyShell";

export function SubjectStudyWorkspace({ subject, mode }: { subject: Subject; mode: StudyMode }) {
  return <section className="study-workspace">
    <StudyModeSelector slug={subject.slug} mode={mode} />
    {mode === "learn" ? <StudyShell subject={subject} /> : <div className="card center"><h1>Tạo bài kiểm tra</h1></div>}
  </section>;
}
