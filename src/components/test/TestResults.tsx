"use client";

import { useState } from "react";
import type { Subject } from "@/domain/subjects/types";
import type { TestSession } from "@/domain/test/types";

export function TestResults({ subject, session, onRetake, onNew, onLearn }: { subject: Subject; session: TestSession; onRetake: () => void; onNew: () => void; onLearn: () => void }) {
  const [incorrectOnly, setIncorrectOnly] = useState(false);
  const score = session.score!;
  const duration = Math.max(0, Math.round((Date.parse(session.submittedAt!) - Date.parse(session.createdAt)) / 1000));
  const reviews = session.questionIds.map((id, index) => {
    const question = subject.questions.find((item) => item.id === id)!;
    const selectedIds = session.responses[id]?.selectedOptionIds ?? [];
    const correct = selectedIds.length === question.correctAnswers.length && selectedIds.every((selectedId) => question.correctAnswers.includes(selectedId));
    return { id, index, question, selectedIds, correct, incorrect: !correct };
  });
  const visibleReviews = incorrectOnly ? reviews.filter((review) => review.incorrect) : reviews;

  return <section className="test-results"><div className="card center"><h1>Kết quả kiểm tra</h1><p>{score.correct}/{score.total} đúng · {score.percent}% · {Math.floor(duration / 60)} phút {duration % 60} giây</p><p>Sai: {score.incorrect} · Chưa trả lời: {score.unanswered}</p><div className="actions"><button className="button" type="button" onClick={onRetake}>Làm lại cùng câu hỏi</button><button className="secondary" type="button" onClick={onNew}>Tạo bài mới</button><button className="secondary" type="button" onClick={onLearn}>Về chế độ Học</button><button className="secondary result-filter" type="button" aria-pressed={incorrectOnly} onClick={() => setIncorrectOnly((current) => !current)}>Câu sai</button></div></div>{visibleReviews.map(({ id, index, question, selectedIds, correct }) => { const status = !selectedIds.length ? "Chưa trả lời" : correct ? "Đúng" : "Sai"; const selectedText = selectedIds.map((selectedId) => { const option = question.options.find((item) => item.id === selectedId); return `${selectedId} · ${option?.text ?? ""}`; }).join("\n"); const correctText = question.correctAnswers.map((correctId) => { const option = question.options.find((item) => item.id === correctId)!; return `${correctId} · ${option.text}`; }).join("\n"); const selectedClass = !selectedIds.length ? "selected-answer" : correct ? "selected-answer correct" : "selected-answer wrong"; return <article className="card test-review" key={id}><div className="eyebrow">Câu {index + 1} · {status}</div><h2>{question.question}</h2><p className={selectedClass}><strong>Đã chọn:</strong>{"\n"}{selectedText || "—"}</p><p className="correct-answer-text"><strong>Đáp án đúng:</strong>{"\n"}{correctText}</p>{question.explanation?.trim() && <p><strong>Giải thích:</strong>{"\n"}{question.explanation}</p>}{question.needsReview && <details><summary>Cần rà soát</summary>{question.reviewNotes.map((note, noteIndex) => <p key={noteIndex}>{note}</p>)}</details>}</article>; })}</section>;
}
