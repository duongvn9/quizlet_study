"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Subject } from "@/domain/subjects/types";
import type { SubjectProgress } from "@/domain/study/types";
import type { TestSession, TestSettings } from "@/domain/test/types";
import { createTestFromPool, eligibleQuestions } from "@/domain/test/generation";
import { goToQuestion, selectResponse } from "@/domain/test/reducer";
import { submitTest } from "@/domain/test/scoring";
import { storage } from "@/lib/storage/local-study-storage";
import { testStorage } from "@/lib/storage/test-storage";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TestSetup } from "./TestSetup";
import { TestRunner } from "./TestRunner";
import { TestResults } from "./TestResults";

const dependencies = { random: () => Math.random(), id: () => crypto.randomUUID(), now: () => new Date().toISOString() };

export function TestShell({ subject }: { subject: Subject }) {
  const [session, setSession] = useState<TestSession | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [learn, setLearn] = useState<SubjectProgress | null>(null);
  const { confirm, dialog } = useConfirmDialog();
  const options = useMemo(() => Object.fromEntries(subject.questions.map((question) => [question.id, question.options.map((option) => option.id)])), [subject]);
  useEffect(() => { const loaded = testStorage.load(subject.id, subject.contentVersion, options); if (loaded.status === "loaded") setSession(loaded.session); else if (loaded.status !== "missing") setNotice("Bài kiểm tra đã lưu không còn hợp lệ hoặc nội dung đã thay đổi. Chỉ dữ liệu Kiểm tra của môn này đã được đặt lại."); const progress = storage.load(subject.id, subject.contentVersion, subject.questions.map((question) => question.id), options); setLearn(progress.status === "loaded" ? progress.progress : null); setReady(true); }, [options, subject]);
  const commit = useCallback((next: TestSession) => { setSession(next); testStorage.save(next); }, []);
  const start = useCallback(async (settings: TestSettings) => { if (session?.status === "active" && !await confirm({ message: "Bài kiểm tra chưa hoàn thành sẽ bị thay thế. Bạn có muốn tạo bài mới?", confirmLabel: "Tạo bài mới" })) return; const pool = eligibleQuestions(subject.questions, settings.pool, learn?.questionProgress); commit(createTestFromPool(subject.id, subject.contentVersion, pool, settings, dependencies)); setNotice(null); }, [commit, confirm, learn, session, subject]);
  const submit = useCallback(async () => { if (!session) return; const unanswered = session.questionIds.filter((id) => !session.responses[id]).length; if (unanswered === 0 || await confirm({ message: `Bạn còn ${unanswered} câu chưa trả lời. Nộp bài ngay?`, confirmLabel: "Nộp bài" })) commit(submitTest(session, subject.questions, dependencies.now())); }, [commit, confirm, session, subject.questions]);
  const retake = useCallback(() => { if (!session) return; const now = dependencies.now(); commit({ ...session, sessionId: dependencies.id(), status: "active", currentIndex: 0, responses: {}, createdAt: now, updatedAt: now, submittedAt: null, score: null }); }, [commit, session]);
  if (!ready) return <div className="card" role="status">Đang khôi phục bài kiểm tra…</div>;
  const unmastered = eligibleQuestions(subject.questions, "unmastered", learn?.questionProgress).length;
  return <>{dialog}{notice && <div className="notice" role="status">{notice}</div>}{!session ? <TestSetup total={subject.questions.length} unmastered={unmastered} onStart={start} /> : session.status === "active" ? <TestRunner subject={subject} session={session} onSelect={(id) => { const question = subject.questions.find((item) => item.id === session.questionIds[session.currentIndex]); commit(selectResponse(session, id, dependencies.now(), question?.type === "multiple-choice")); }} onNavigate={(index) => { const next = goToQuestion(session, index, dependencies.now()); if (next !== session) commit(next); }} onSubmit={submit} /> : <TestResults subject={subject} session={session} onRetake={retake} onNew={() => setSession(null)} onLearn={() => { window.location.href = `/subjects/${subject.slug}/study?mode=learn`; }} />}</>;
}
