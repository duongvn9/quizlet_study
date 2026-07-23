"use client";

import { useEffect } from "react";
import type { Subject } from "@/domain/subjects/types";
import type { TestSession } from "@/domain/test/types";

export function TestRunner({ subject, session, onSelect, onNavigate, onSubmit }: { subject: Subject; session: TestSession; onSelect: (id: string) => void; onNavigate: (index: number) => void; onSubmit: () => void }) {
  const questionId = session.questionIds[session.currentIndex];
  const question = subject.questions.find((item) => item.id === questionId)!;
  const options = session.optionOrders[questionId].map((id) => question.options.find((option) => option.id === id)!);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.target instanceof Element && /INPUT|BUTTON|TEXTAREA|SELECT/.test(event.target.tagName)) return; if (event.key === "ArrowLeft") onNavigate(session.currentIndex - 1); if (event.key === "ArrowRight") onNavigate(session.currentIndex + 1); }; addEventListener("keydown", key); return () => removeEventListener("keydown", key); }, [onNavigate, session.currentIndex]);
  const unanswered = session.questionIds.filter((id) => !session.responses[id]).length;
  return <section className="test-runner"><div className="progress-row"><span>Câu {session.currentIndex + 1}/{session.questionIds.length}</span><span>Chưa trả lời: {unanswered}</span></div><article className="question"><div className="eyebrow">Câu {question.number}</div><h1>{question.question}</h1><div className="options">{options.map((option, index) => <button type="button" aria-pressed={session.responses[questionId]?.selectedOptionId === option.id} className={session.responses[questionId]?.selectedOptionId === option.id ? "selected" : ""} key={option.id} onClick={() => onSelect(option.id)}><span>{index + 1}</span><em>{option.text}</em></button>)}</div></article><nav className="test-navigator" aria-label="Điều hướng câu hỏi">{session.questionIds.map((id, index) => <button type="button" key={id} aria-current={index === session.currentIndex ? "step" : undefined} className={session.responses[id] ? "answered" : ""} onClick={() => onNavigate(index)}>{index + 1}</button>)}</nav><div className="actions"><button className="secondary" type="button" disabled={session.currentIndex === 0} onClick={() => onNavigate(session.currentIndex - 1)}>Trước</button><button className="secondary" type="button" disabled={session.currentIndex === session.questionIds.length - 1} onClick={() => onNavigate(session.currentIndex + 1)}>Tiếp</button><button className="button" type="button" onClick={onSubmit}>Nộp bài</button></div></section>;
}
