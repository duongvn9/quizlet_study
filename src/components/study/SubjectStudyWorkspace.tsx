import type { Subject } from "@/domain/subjects/types";
import { StudyModeSelector, type StudyMode } from "@/components/study/StudyModeSelector";
import { StudyShell } from "@/components/study/StudyShell";
import { TestShell } from "@/components/test/TestShell";

export function SubjectStudyWorkspace({ subject, mode }: { subject: Subject; mode: StudyMode }) {
  return <section className="study-workspace">
    <StudyModeSelector slug={subject.slug} mode={mode} />
    {mode === "learn" ? <StudyShell subject={subject} /> : <TestShell subject={subject} />}
  </section>;
}
