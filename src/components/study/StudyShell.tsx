"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Subject } from "@/domain/subjects/types";
import type { SubjectProgress } from "@/domain/study/types";
import { createProgress, createSession } from "@/domain/study/create-session";
import { answer, move } from "@/domain/study/reducer";
import { selectStats } from "@/domain/study/selectors";
import { storage } from "@/lib/storage/local-study-storage";
import { SETTINGS_KEY } from "@/lib/storage/keys";
import { useCorrectAnswerSound } from "@/hooks/useCorrectAnswerSound";

type StudySettings = {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

const defaultSettings: StudySettings = {
  shuffleQuestions: false,
  shuffleOptions: false,
};

function loadSettings(): StudySettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as Partial<StudySettings> | null;
    return {
      shuffleQuestions: typeof parsed?.shuffleQuestions === "boolean" ? parsed.shuffleQuestions : false,
      shuffleOptions: typeof parsed?.shuffleOptions === "boolean" ? parsed.shuffleOptions : false,
    };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: StudySettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}

function currentAttempt(progress: SubjectProgress | null) {
  const session = progress?.activeSession;
  const item = session?.queue[session.currentIndex];
  return item ? session?.attempts.find((attempt) => attempt.queueInstanceId === item.instanceId) : undefined;
}

function optionRank(instanceId: string, optionId: string) {
  return Array.from(`${instanceId}:${optionId}`).reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619), 2166136261) >>> 0;
}

export function StudyShell({ subject }: { subject: Subject }) {
  const [progress, setProgress] = useState<SubjectProgress | null>(null);
  const [notice, setNotice] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [settings, setSettings] = useState<StudySettings>(defaultSettings);
  const { enabled, setEnabled, play } = useCorrectAnswerSound();

  useEffect(() => {
    const savedSettings = loadSettings();
    setSettings(savedSettings);
    const loaded = storage.load(subject.id, subject.contentVersion, subject.questions.map((question) => question.id));
    let next = loaded.status === "loaded" ? loaded.progress : createProgress(subject.id, subject.contentVersion, subject.questions);
    if (!next.activeSession || next.activeSession.completedAt) {
      next = { ...next, activeSession: createSession(subject.id, subject.contentVersion, subject.questions, savedSettings) };
    }
    setProgress(next);
    setNotice(storage.consumeNotice(subject.id));
    try {
      storage.save(next);
    } catch {
      setStorageWarning(true);
    }
  }, [subject]);

  const commit = useCallback((next: SubjectProgress) => {
    setProgress(next);
    try {
      storage.save(next);
    } catch {
      setStorageWarning(true);
    }
  }, []);

  const resetSession = useCallback(() => {
    if (!progress || !confirm("Tạo phiên học mới cho môn này?")) return;
    const next = { ...progress, activeSession: createSession(subject.id, subject.contentVersion, subject.questions, settings) };
    commit(next);
    setSettingsOpen(false);
  }, [commit, progress, settings, subject]);

  const resetProgress = useCallback(() => {
    if (!confirm("Bạn chắc chắn muốn đặt lại toàn bộ tiến độ môn này?")) return;
    const next = createProgress(subject.id, subject.contentVersion, subject.questions);
    storage.remove(subject.id);
    commit({ ...next, activeSession: createSession(subject.id, subject.contentVersion, subject.questions, settings) });
    setSettingsOpen(false);
  }, [commit, settings, subject]);

  const session = progress?.activeSession;
  const item = session?.queue[session.currentIndex];
  const question = subject.questions.find((candidate) => candidate.id === item?.questionId);
  const attempt = currentAttempt(progress);
  const displayOptions = useMemo(() => {
    const options = question?.options ?? [];
    if (!session?.settings.shuffleOptions || !item) return options;
    return [...options].sort((left, right) => optionRank(item.instanceId, left.id) - optionRank(item.instanceId, right.id));
  }, [item, question, session?.settings.shuffleOptions]);
  const stats = selectStats(progress, subject.questionCount);

  const updateSettings = useCallback((next: StudySettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const choose = useCallback((id: string | null) => {
    if (!progress || !question || attempt) return;
    const next = answer(progress, question, id);
    if (id === question.correctAnswer) play();
    commit(next);
  }, [attempt, commit, play, progress, question]);

  const navigate = useCallback((direction: -1 | 1) => {
    if (progress) commit(move(progress, direction));
  }, [commit, progress]);

  useEffect(() => {
    if (!settingsOpen) return;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    const focusable = dialog?.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href]");
    focusable?.[0]?.focus();
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    addEventListener("keydown", handleDialogKey);
    return () => removeEventListener("keydown", handleDialogKey);
  }, [settingsOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target;
      if (settingsOpen || event.repeat || target instanceof Element && (/INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName) || target.closest("[role=dialog]"))) return;
      if (!attempt && /^[1-5]$/.test(event.key)) {
        const option = displayOptions[Number(event.key) - 1];
        if (option) choose(option.id);
      } else if (event.key === "Enter" && attempt) {
        navigate(1);
      } else if (event.key === "ArrowLeft") {
        navigate(-1);
      } else if (event.key === "ArrowRight") {
        navigate(1);
      }
    };
    addEventListener("keydown", handler);
    return () => removeEventListener("keydown", handler);
  }, [attempt, choose, displayOptions, navigate, settingsOpen]);

  if (!progress || !session || !question) return <div className="card">Đang khôi phục phiên học…</div>;

  if (session.completedAt) {
    return <div className="card center"><h1>Hoàn thành phiên học</h1><Link className="button" href={`/subjects/${subject.slug}/summary`}>Xem tổng kết</Link></div>;
  }

  const feedback = attempt?.result === "correct" ? "Chính xác" : attempt ? "Hãy ghi nhớ đáp án đúng" : null;

  return <>
    <div className="study-top">
      <Link href={`/subjects/${subject.slug}`}>← Thoát</Link>
      <span>Học · {subject.code}</span>
      <button className="secondary" type="button" onClick={() => setSettingsOpen(true)}>Cài đặt</button>
      <label><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Âm thanh</label>
    </div>
    {notice && <div className="notice">Bộ câu hỏi đã được cập nhật. Tiến độ của môn này đã được đặt lại để bảo đảm kết quả học chính xác.</div>}
    {storageWarning && <div className="notice" role="status">Không thể lưu tiến độ vào trình duyệt lúc này. Bạn vẫn có thể học tiếp trong phiên hiện tại.</div>}
    <div className="progress-row"><div className="bar"><i style={{ width: `${stats.percentage}%` }} /></div><span>Đã xem {stats.seenCount}/{subject.questionCount} · Đã thuộc {stats.masteredCount}</span></div>
    <article className="question">
      <div className="eyebrow">Câu {question.number}</div>
      <h1>{question.question}</h1>
      <div className="options">
        {displayOptions.map((option, index) => {
          const correct = attempt && option.id === question.correctAnswer;
          const selectedWrong = attempt && attempt.selectedOptionId === option.id && attempt.result !== "correct";
          return <button key={option.id} type="button" disabled={!!attempt} className={correct ? "correct" : selectedWrong ? "wrong" : ""} onClick={() => choose(option.id)}>
            <span>{index + 1}</span><em>{option.text}</em>{correct && <strong>✓ Đáp án đúng</strong>}{selectedWrong && <strong>✕ Bạn đã chọn</strong>}
          </button>;
        })}
      </div>
      {!attempt && <button className="secondary" type="button" onClick={() => choose(null)}>Không biết</button>}
      {feedback && <div className="feedback" aria-live="polite"><h2>{feedback}</h2>{question.needsReview && <details><summary>Dữ liệu nguồn cần rà soát</summary>{question.reviewNotes.map((note) => <p key={note}>{note}</p>)}</details>}</div>}
    </article>
    <nav className="nav"><button type="button" onClick={() => navigate(-1)} disabled={session.currentIndex === 0}>Trước</button><span>{session.currentIndex + 1}/{session.queue.length}</span><button type="button" onClick={() => navigate(1)} disabled={!item?.answered}>Tiếp tục</button></nav>
    {settingsOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="dialog" onMouseDown={(event) => event.stopPropagation()}>
      <h2 id="settings-title">Cài đặt học</h2>
      <label><input type="checkbox" checked={settings.shuffleQuestions} onChange={(event) => updateSettings({ ...settings, shuffleQuestions: event.target.checked })} /> Xáo trộn câu hỏi</label>
      <p>Áp dụng khi tạo phiên học mới, không xáo trộn phiên đang học.</p>
      <label><input type="checkbox" checked={settings.shuffleOptions} onChange={(event) => updateSettings({ ...settings, shuffleOptions: event.target.checked })} /> Xáo trộn đáp án</label>
      <p>Phím 1–5 luôn theo thứ tự đáp án đang hiển thị.</p>
      <div className="actions"><button className="secondary" type="button" onClick={resetSession}>Tạo phiên mới</button><button className="secondary" type="button" onClick={resetProgress}>Đặt lại tiến độ</button><button className="button" type="button" onClick={() => setSettingsOpen(false)}>Đóng</button></div>
    </section></div>}
  </>;
}
