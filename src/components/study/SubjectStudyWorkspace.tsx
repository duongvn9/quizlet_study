import type { Subject } from "@/domain/subjects/types";
import { StudyModeSelector, type StudyMode } from "@/components/study/StudyModeSelector";
import { StudyShell } from "@/components/study/StudyShell";
import { QuestionList } from "@/components/study/QuestionList";
import { TestShell } from "@/components/test/TestShell";

export function SubjectStudyWorkspace({ subject, mode }: { subject: Subject; mode: StudyMode }) {
  return <section className="study-workspace">
    <StudyModeSelector slug={subject.slug} mode={mode} />
    {mode === "learn" ? <StudyShell subject={subject} /> : mode === "test" ? <TestShell subject={subject} /> : <QuestionList slug={subject.slug} initialPage={{ questions: subject.questions.slice(0, 30), nextOffset: subject.questionCount > 30 ? 30 : null, total: subject.questionCount }} />}
  </section>;
}
