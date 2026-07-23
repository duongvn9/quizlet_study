"use client";

import { useEffect, useRef, useState } from "react";
import type { Question } from "@/domain/subjects/types";

type QuestionPage = {
  questions: Question[];
  nextOffset: number | null;
  total: number;
};

export function QuestionList({ slug, initialPage }: { slug: string; initialPage: QuestionPage }) {
  const [questions, setQuestions] = useState(initialPage.questions);
  const [nextOffset, setNextOffset] = useState(initialPage.nextOffset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || nextOffset === null || loading || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/subjects/${encodeURIComponent(slug)}/questions?offset=${nextOffset}`);
        if (!response.ok) throw new Error();
        const page = await response.json() as QuestionPage;
        setQuestions((current) => [...current, ...page.questions]);
        setNextOffset(page.nextOffset);
      } catch {
        setError("Không thể tải thêm câu hỏi. Hãy cuộn lại để thử lại.");
      } finally {
        setLoading(false);
      }
    }, { rootMargin: "300px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, nextOffset, slug]);

  return <section className="question-list" aria-labelledby="question-list-title">
    <header className="question-list-header">
      <div>
        <p className="eyebrow">NGÂN HÀNG CÂU HỎI</p>
        <h1 id="question-list-title">Danh sách câu hỏi</h1>
      </div>
      <p>{questions.length}/{initialPage.total} câu</p>
    </header>
    <ol>
      {questions.map((question) => <li key={question.id} className="question-list-item">
        <h2>Câu {question.number}. {question.question}</h2>
        <ul>
          {question.options.map((option) => {
            const correct = question.correctAnswers.includes(option.id);
            return <li key={option.id} className={correct ? "correct-answer" : undefined}>
              <span>{option.id}. {option.text}</span>
              {correct && <strong>Đáp án đúng</strong>}
            </li>;
          })}
        </ul>
        {question.explanation?.trim() && <p className="question-explanation"><strong>Giải thích:</strong> {question.explanation}</p>}
      </li>)}
    </ol>
    <div ref={sentinelRef} className="question-list-sentinel" aria-hidden="true" />
    {loading && <p role="status" className="center">Đang tải thêm câu hỏi...</p>}
    {error && <p role="alert" className="center">{error}</p>}
    {nextOffset === null && <p className="center question-list-end">Đã hiển thị tất cả {initialPage.total} câu hỏi.</p>}
  </section>;
}
