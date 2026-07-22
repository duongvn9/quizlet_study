"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Subject } from "@/domain/subjects/types";
import { selectStats } from "@/domain/study/selectors";
import { storage } from "@/lib/storage/local-study-storage";

export function Summary({ subject }: { subject: Subject }) {
  const [stats, setStats] = useState(() => selectStats(null, subject.questionCount));
  useEffect(() => {
    const result = storage.load(subject.id, subject.contentVersion, subject.questions.map((question) => question.id));
    if (result.status === "loaded") setStats(selectStats(result.progress, subject.questionCount));
  }, [subject]);
  return <section className="card">
    <div className="eyebrow">TỔNG KẾT · {subject.code}</div>
    <h1>Tiến độ học tập</h1>
    <div className="metrics">
      <b>{subject.questionCount}<small>Tổng số câu</small></b>
      <b>{stats.seenCount}<small>Đã xem</small></b>
      <b>{stats.masteredCount}<small>Đã thuộc</small></b>
      <b>{stats.totalAttempts}<small>Lượt trả lời</small></b>
      <b>{stats.correct}<small>Đúng</small></b>
      <b>{stats.incorrect}<small>Sai</small></b>
      <b>{stats.dontKnow}<small>Không biết</small></b>
      <b>{stats.accuracy}%<small>Chính xác</small></b>
      <b>{stats.learningCount}<small>Còn đang học</small></b>
    </div>
    <div className="actions"><Link className="button" href={`/subjects/${subject.slug}/learn`}>Tiếp tục học</Link><Link className="secondary" href={`/subjects/${subject.slug}/learn?restart=1`}>Học lại toàn bộ</Link><Link className="secondary" href={`/subjects/${subject.slug}`}>Về môn học</Link></div>
  </section>;
}
