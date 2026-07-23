"use client";

import { useState } from "react";
import type { TestPool, TestSettings } from "@/domain/test/types";

export function TestSetup({ total, unmastered, onStart }: { total: number; unmastered: number; onStart: (settings: TestSettings) => void }) {
  const [count, setCount] = useState(Math.min(20, total));
  const [pool, setPool] = useState<TestPool>("all");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const available = pool === "all" ? total : unmastered;
  const valid = Number.isInteger(count) && count >= 1 && count <= total && available > 0;
  const effective = Math.min(count || 0, available);
  return <section className="card test-setup" aria-labelledby="test-setup-title"><h1 id="test-setup-title">Tạo bài kiểm tra</h1><fieldset><legend>Số câu</legend><div className="test-presets">{[10, 20, 40].filter((value) => value <= total).map((value) => <button type="button" className="secondary" key={value} onClick={() => setCount(value)}>{value}</button>)}<button type="button" className="secondary" onClick={() => setCount(total)}>Tất cả</button></div><label>Số câu tùy chỉnh <input aria-label="Số câu tùy chỉnh" type="number" min={1} max={total} value={count} onChange={(event) => setCount(event.target.valueAsNumber)} /></label></fieldset><fieldset><legend>Nguồn câu hỏi</legend><label><input type="radio" name="pool" checked={pool === "all"} onChange={() => setPool("all")} /> Tất cả ({total})</label><label><input type="radio" name="pool" checked={pool === "unmastered"} onChange={() => setPool("unmastered")} /> Chưa thuộc ({unmastered})</label></fieldset><label><input type="checkbox" checked={shuffleQuestions} onChange={(event) => setShuffleQuestions(event.target.checked)} /> Xáo trộn câu hỏi</label><label><input type="checkbox" checked={shuffleOptions} onChange={(event) => setShuffleOptions(event.target.checked)} /> Xáo trộn đáp án</label>{count > available && available > 0 && <p className="notice" role="status">Nguồn chỉ có {available} câu. Bài kiểm tra sẽ giảm còn {effective} câu.</p>}{!valid && <p role="alert">Nhập số nguyên từ 1 đến {total} và chọn nguồn còn câu hỏi.</p>}<button className="button" type="button" disabled={!valid} onClick={() => onStart({ count, pool, shuffleQuestions, shuffleOptions })}>Bắt đầu</button></section>;
}
