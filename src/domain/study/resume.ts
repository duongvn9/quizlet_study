import type { StudySession, SubjectProgress } from "./types";

export function findResumeQueueIndex(session: StudySession): number | null {
  const current = session.queue[session.currentIndex];
  if (current && !current.answered) return session.currentIndex;
  const next = session.queue.findIndex((item, index) => index > session.currentIndex && !item.answered);
  if (next >= 0) return next;
  const wrapped = session.queue.findIndex((item) => !item.answered);
  return wrapped >= 0 ? wrapped : null;
}

export function resumeProgress(progress: SubjectProgress, now: string): SubjectProgress {
  const session = progress.activeSession;
  if (!session || session.completedAt) return progress;
  const resumeIndex = findResumeQueueIndex(session);
  if (resumeIndex !== null) {
    if (resumeIndex === session.currentIndex) return progress;
    return {
      ...progress,
      activeSession: {
        ...session,
        currentIndex: resumeIndex,
        frontierIndex: Math.max(session.frontierIndex, resumeIndex),
      },
    };
  }
  return {
    ...progress,
    activeSession: { ...session, completedAt: now, updatedAt: now },
    completedSessionCount: progress.completedSessionCount + 1,
  };
}
