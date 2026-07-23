"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Subject } from "@/domain/subjects/types";
import type { SubjectProgress } from "@/domain/study/types";
import { createProgress, createSession } from "@/domain/study/create-session";
import { answer, move, replaceAnswer } from "@/domain/study/reducer";
import { resumeProgress } from "@/domain/study/resume";
import { selectLearnCounters } from "@/domain/study/selectors";
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
  const [revealedInstanceId, setRevealedInstanceId] = useState<string | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const { enabled, setEnabled, play } = useCorrectAnswerSound();

  useEffect(() => {
    const savedSettings = loadSettings();
    setSettings(savedSettings);
    const loaded = storage.load(subject.id, subject.contentVersion, subject.questions.map((question) => question.id), Object.fromEntries(subject.questions.map((question) => [question.id, question.options.map((option) => option.id)])));
    let next = loaded.status === "loaded" ? loaded.progress : createProgress(subject.id, subject.contentVersion, subject.questions);
    const wasActive = !!next.activeSession && !next.activeSession.completedAt;
    next = resumeProgress(next, new Date().toISOString());
    const completedOnResume = wasActive && !!next.activeSession?.completedAt;
    const restartRequested = new URLSearchParams(window.location.search).get("restart") === "1";
    if (restartRequested) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    const shouldRestart = restartRequested && (!next.activeSession || next.activeSession.completedAt || confirm("Phiên học chưa hoàn thành sẽ bị thay thế. Bạn có muốn học lại toàn bộ không?"));
    if (shouldRestart || !next.activeSession || next.activeSession.completedAt && !completedOnResume) {
      next = { ...next, activeSession: createSession(subject.id, subject.contentVersion, subject.questions, savedSettings) };
    }
    setRevealedInstanceId(null);
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
    setRevealedInstanceId(null);
    commit(next);
    setSettingsOpen(false);
  }, [commit, progress, settings, subject]);

  const resetProgress = useCallback(() => {
    if (!confirm("Bạn chắc chắn muốn đặt lại toàn bộ tiến độ môn này?")) return;
    const next = createProgress(subject.id, subject.contentVersion, subject.questions);
    storage.remove(subject.id);
    setRevealedInstanceId(null);
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
  const counters = selectLearnCounters(progress, subject.questions.map((candidate) => candidate.id));

  const updateSettings = useCallback((next: StudySettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const choose = useCallback((id: string | null) => {
    if (!progress || !question || !item || revealedInstanceId === item.instanceId) return;
    const next = attempt ? replaceAnswer(progress, question, id) : answer(progress, question, id);
    if (next === progress) return;
    setRevealedInstanceId(item.instanceId);
    if (id === question.correctAnswer && (!attempt || attempt.result !== "correct" || attempt.selectedOptionId !== id)) play();
    commit(next);
  }, [attempt, commit, item, play, progress, question, revealedInstanceId]);

  const navigate = useCallback((direction: -1 | 1) => {
    if (!progress) return;
    const next = move(progress, direction);
    if (next === progress) return;
    setRevealedInstanceId(null);
    commit(next);
  }, [commit, progress]);

  useEffect(() => {
    if (!settingsOpen) return;
    const trigger = settingsButtonRef.current;
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
    return () => {
      removeEventListener("keydown", handleDialogKey);
      trigger?.focus();
    };
  }, [settingsOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target;
      if (settingsOpen || event.repeat || target instanceof Element && (/INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName) || target.closest("[role=dialog]"))) return;
      if ((!attempt || revealedInstanceId !== item?.instanceId) && /^[1-5]$/.test(event.key)) {
        const option = displayOptions[Number(event.key) - 1];
        if (option) choose(option.id);
      } else if (event.code === "Space" && attempt) {
        event.preventDefault();
        navigate(1);
      } else if (event.key === "ArrowLeft") {
        navigate(-1);
      } else if (event.key === "ArrowRight") {
        navigate(1);
      }
    };
    addEventListener("keydown", handler);
    return () => removeEventListener("keydown", handler);
  }, [attempt, choose, displayOptions, item?.instanceId, navigate, revealedInstanceId, settingsOpen]);

  if (!progress || !session) return <div className="card" role="status">Đang khôi phục phiên học…</div>;

  if (session.completedAt) {
    return <div className="card center"><h1>Hoàn thành phiên học</h1><Link className="button" href={`/subjects/${subject.slug}/summary`}>Xem tổng kết</Link></div>;
  }

  if (!question) return <div className="card" role="alert">Không thể hiển thị câu hỏi hiện tại.</div>;

  const reveal = !!attempt && revealedInstanceId === item?.instanceId;
  const feedback = reveal ? attempt.result === "correct" ? "Chính xác" : "Hãy ghi nhớ đáp án đúng" : null;
  const historical = !!attempt && !reveal;

  return <>
    <div inert={settingsOpen ? true : undefined}>
    <div className="study-top">
      <Link className="exit-button" href={`/subjects/${subject.slug}`}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9.04404 5.18597C10.6002 4.08204 12.7538 5.19471 12.7538 7.10266V9.64834L19.044 5.18597C20.6002 4.08204 22.7538 5.19471 22.7538 7.10266V16.8991C22.7538 18.8071 20.6002 19.9198 19.044 18.8158L12.7538 14.3534V16.8991C12.7538 18.8071 10.6002 19.9198 9.04405 18.8158L2.3118 14.0399C0.907135 13.0434 0.907132 10.9583 2.3118 9.96186L9.04404 5.18597ZM11.2538 7.10266C11.2538 6.41255 10.4748 6.01009 9.91194 6.40939L3.1797 11.1853C2.61783 11.5839 2.61783 12.4179 3.1797 12.8165L9.91195 17.5924C10.4748 17.9917 11.2538 17.5892 11.2538 16.8991V7.10266ZM21.2538 7.10266C21.2538 6.41255 20.4748 6.01009 19.9119 6.40939L13.1797 11.1853C12.6178 11.5839 12.6178 12.4179 13.1797 12.8165L19.9119 17.5924C20.4748 17.9917 21.2538 17.5892 21.2538 16.8991V7.10266Z" fill="currentColor" /></svg> Thoát</Link>
      <span>Học · {subject.code}</span>
      <button ref={settingsButtonRef} className="secondary" type="button" onClick={() => setSettingsOpen(true)}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 12.8799V11.1199C2 10.0799 2.85 9.21994 3.9 9.21994C5.71 9.21994 6.45 7.93994 5.54 6.36994C5.02 5.46994 5.33 4.29994 6.24 3.77994L7.97 2.78994C8.76 2.31994 9.78 2.59994 10.25 3.38994L10.36 3.57994C11.26 5.14994 12.74 5.14994 13.65 3.57994L13.76 3.38994C14.23 2.59994 15.25 2.31994 16.04 2.78994L17.77 3.77994C18.68 4.29994 18.99 5.46994 18.47 6.36994C17.56 7.93994 18.3 9.21994 20.11 9.21994C21.15 9.21994 22.01 10.0699 22.01 11.1199V12.8799C22.01 13.9199 21.16 14.7799 20.11 14.7799C18.3 14.7799 17.56 16.0599 18.47 17.6299C18.99 18.5399 18.68 19.6999 17.77 20.2199L16.04 21.2099C15.25 21.6799 14.23 21.3999 13.76 20.6099L13.65 20.4199C12.75 18.8499 11.27 18.8499 10.36 20.4199L10.25 20.6099C9.78 21.3999 8.76 21.6799 7.97 21.2099L6.24 20.2199C5.33 19.6999 5.02 18.5299 5.54 17.6299C6.45 16.0599 5.71 14.7799 3.9 14.7799C2.85 14.7799 2 13.9199 2 12.8799Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /></svg> Cài đặt</button>
      <button className="sound-toggle" type="button" aria-label="Âm thanh" aria-pressed={enabled} onClick={() => setEnabled(!enabled)}>{enabled ? <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M2.00299 11.7155C2.04033 9.87326 2.059 8.95215 2.67093 8.16363C2.78262 8.0197 2.9465 7.8487 3.08385 7.73274C3.83639 7.09741 4.82995 7.09741 6.81706 7.09741C7.527 7.09741 7.88198 7.09741 8.22035 7.00452C8.29067 6.98522 8.36024 6.96296 8.4289 6.93781C8.75936 6.81674 9.05574 6.60837 9.64851 6.19161C11.9872 4.54738 13.1565 3.72527 14.138 4.08241C14.3261 4.15088 14.5083 4.24972 14.671 4.37162C15.5194 5.00744 15.5839 6.48675 15.7128 9.44537C15.7606 10.5409 15.7931 11.4785 15.7931 12C15.7931 12.5215 15.7606 13.4591 15.7128 14.5546C15.5839 17.5132 15.5194 18.9926 14.671 19.6284C14.5083 19.7503 14.3261 19.8491 14.138 19.9176C13.1565 20.2747 11.9872 19.4526 9.64851 17.8084C9.05574 17.3916 8.75936 17.1833 8.4289 17.0622C8.36024 17.037 8.29067 17.0148 8.22035 16.9955C7.88198 16.9026 7.527 16.9026 6.81706 16.9026C4.82995 16.9026 3.83639 16.9026 3.08385 16.2673C2.9465 16.1513 2.78262 15.9803 2.67093 15.8364C2.059 15.0478 2.04033 14.1267 2.00299 12.2845C2.00103 12.1878 2 12.0928 2 12C2 11.9072 2.00103 11.8122 2.00299 11.7155Z" fill="currentColor" /><path d="M19.4895 5.55219C19.7821 5.29218 20.217 5.33434 20.4608 5.64635C20.5075 5.70929 20.6635 5.94667 20.7379 6.07889C21.225 6.94448 22 8.83203 22 12.0002C22 15.1684 21.225 17.056 20.7379 17.9216C20.6635 18.0538 20.5075 18.2912 20.4608 18.3541C20.217 18.6661 19.7821 18.7083 19.4895 18.4483C19.1983 18.1895 19.1578 17.729 19.3977 17.417C19.4565 17.3311 19.5003 17.2625 19.5552 17.1649C20.0496 16.2857 20.6207 14.6285 20.6207 12.0002C20.6207 9.37199 20.0496 7.71475 19.5552 6.8356C19.5003 6.73802 19.4565 6.66934 19.3977 6.5834C19.1578 6.27143 19.1983 5.81095 19.4895 5.55219Z" fill="currentColor" /><path d="M17.7571 8.41595C18.0901 8.21871 18.51 8.34663 18.6949 8.70166C18.7533 8.82676 18.8584 9.10004 18.99 9.57476C19.1199 10.115 19.2415 10.9119 19.2415 12.0003C19.2415 13.0888 19.1199 13.8857 18.99 14.4259C18.8584 14.9007 18.7533 15.1739 18.6949 15.299C18.51 15.6541 18.0901 15.782 17.7571 15.5847C17.427 15.3892 17.3063 14.9474 17.4846 14.5938C17.5557 14.4132 17.6539 13.6448 17.6539 14.0606C17.7539 13.6448 17.8622 12.9709 17.8622 12.0003C17.8622 11.0298 17.7539 10.3559 17.6539 9.94007C17.6039 9.73193 17.5557 9.58748 17.4846 9.40687C17.3063 9.05332 17.427 8.61152 17.7571 8.41595Z" fill="currentColor" /></svg> : <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20.5145 6.3164C20.892 6.14605 21.3362 6.31403 21.5065 6.6916C21.9736 7.72674 22.5 9.45958 22.5 12C22.5 14.1916 22.1082 15.7829 21.7 16.8442C21.4962 17.374 21.2894 17.7692 21.1275 18.039C20.8262 18.4801 20.561 18.7983 20.0881 18.8413C19.7699 18.5762 19.4532 18.3123 19.4091 17.8426C19.67 17.5245 19.9606 17.0683 20.3 16.3058C20.6418 15.4171 21 14.0084 21 12C21 9.67366 20.5194 8.15099 20.1393 7.30849C19.9689 6.93093 20.1369 6.48675 20.5145 6.3164Z" fill="currentColor" /><path d="M18.414 9.26566C18.8196 9.18146 19.2166 9.44198 19.3008 9.84754C19.4109 10.378 19.5 11.0889 19.5 12C19.5 13.1101 19.3678 13.9228 19.2265 14.4738C19.0833 14.9579 18.7045 15.7263 18.2479 15.8568C17.8858 15.6556 17.5268 15.4562 17.3955 15.0056C17.5893 14.645 17.7191 14.3135 17.7735 14.1012C17.8822 13.6772 18 12.9899 18 12C18 11.1873 17.9206 10.5787 17.8321 10.1525C17.7479 9.74689 18.0084 9.34986 18.414 9.26566Z" fill="currentColor" /><path d="M21.7803 3.53033C22.0732 3.23744 22.0732 2.76256 21.7803 2.46967C21.4874 2.17678 21.0126 2.17678 20.7197 2.46967L16.2705 6.91886C16.2246 6.39532 16.1646 5.93197 16.077 5.52977C15.9052 4.74135 15.6003 4.05581 14.9609 3.60646C14.7259 3.44128 14.4642 3.30809 14.1923 3.21531C12.5686 2.66135 10.9212 3.95576 8.43647 5.59411C7.98856 5.88944 7.83448 5.98815 7.67513 6.05848C7.50452 6.13378 7.3252 6.18757 7.14132 6.21862C6.96956 6.24762 6.7866 6.25003 6.25008 6.25003C4.87215 6.24933 4.02659 6.24889 3.27496 6.59664C2.58016 6.9181 1.91141 7.54732 1.54828 8.22128C1.15566 8.94996 1.10959 9.712 1.03618 10.926C0.98794 11.7176 0.98794 12.2824 1.03618 13.0741C1.10959 14.2881 1.15566 15.0501 1.54828 15.7788C1.91141 16.4527 2.58016 17.082 3.27496 17.4034C3.88551 17.6859 4.55803 17.7386 5.44121 17.7481L2.71967 20.4697C2.42678 20.7626 2.42678 21.2374 2.71967 21.5303C3.01256 21.8232 3.48744 21.8232 3.78033 21.5303L21.7803 3.53033Z" fill="currentColor" /><path d="M16.5 12C16.5 11.5858 16.1642 11.25 15.75 11.25C15.5554 11.25 15.3781 11.3241 15.2448 11.4457L9.17494 17.7941C8.82947 18.1554 8.90952 18.7441 9.33893 19.0001C10.3777 19.6808 11.2375 20.2247 11.9704 20.549C12.7127 20.8773 13.4503 21.0379 14.1923 20.7847C14.4642 20.6919 14.7259 20.5588 14.9609 20.3936C16.1315 19.5709 16.3414 16.1576 16.4119 14.6402C16.4637 13.5252 16.5 12.552 16.5 12Z" fill="currentColor" /></svg>}</button>
    </div>
    {notice && <div className="notice">Bộ câu hỏi đã được cập nhật. Tiến độ của môn này đã được đặt lại để bảo đảm kết quả học chính xác.</div>}
    {storageWarning && <div className="notice" role="status">Không thể lưu tiến độ vào trình duyệt lúc này. Bạn vẫn có thể học tiếp trong phiên hiện tại.</div>}
    <div className="progress-row"><div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(counters.percentage)} aria-label="Tiến độ câu hỏi"><i style={{ width: `${counters.percentage}%` }} /></div><span>Đã xem {counters.presentedCount} / {counters.total} câu</span></div>
    <article className="question">
      <div className="eyebrow">Câu {question.number}</div>
      <h1>{question.question}</h1>
      <div className="options">
        {displayOptions.map((option, index) => {
          const correct = reveal && option.id === question.correctAnswer;
          const selectedWrong = reveal && attempt.selectedOptionId === option.id && attempt.result !== "correct";
          return <button key={option.id} type="button" disabled={reveal} className={correct ? "correct" : selectedWrong ? "wrong" : ""} onClick={() => choose(option.id)}>
            <span>{index + 1}</span><em>{option.text}</em>
          </button>;
        })}
      </div>
      {!reveal && <button className="secondary" type="button" onClick={() => choose(null)}>Không biết</button>}
      {historical && <div className="feedback" role="status">Bạn đã trả lời lượt này. Chọn lại sẽ thay thế kết quả trước đó.</div>}
      {feedback && <div className="feedback" aria-live="polite"><h2>{feedback}</h2>{question.explanation?.trim() && <aside className="explanation"><strong>Giải thích</strong><p>{question.explanation}</p></aside>}{question.needsReview && <details><summary>Dữ liệu nguồn cần rà soát</summary>{question.reviewNotes.map((note) => <p key={note}>{note}</p>)}</details>}</div>}
    </article>
    <p className="shortcut-hint">1–5 chọn đáp án · Space tiếp tục · ← → điều hướng</p>
    <nav className="nav"><button type="button" aria-label="Trước" onClick={() => navigate(-1)} disabled={session.currentIndex === 0}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M19.5025 20.835L2.99281 13.4725C1.66906 12.8822 1.66906 11.1178 2.99281 10.5275L19.5025 3.16496C20.9984 2.49789 22.5499 3.97914 21.809 5.36689L18.657 11.2706C18.4118 11.7298 18.4118 12.2702 18.657 12.7294L21.809 18.6331C22.5499 20.0209 20.9984 21.5021 19.5025 20.835Z" fill="currentColor" /></svg></button><span>Câu {question.number} / {subject.questions.length}</span><button type="button" aria-label="Tiếp tục" onClick={() => navigate(1)} disabled={!item?.answered}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M4.49746 20.835L21.0072 13.4725C22.3309 12.8822 22.3309 11.1178 21.0072 10.5275L4.49746 3.16496C3.00163 2.49789 1.45006 3.97914 2.19099 5.36689L5.34302 11.2706C5.58817 11.7298 5.58818 12.2702 5.34302 12.7294L2.19099 18.6331C1.45007 20.0209 3.00163 21.5021 4.49746 20.835Z" fill="currentColor" /></svg></button></nav>
    </div>
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
