import { NextResponse } from "next/server";
import { getSubject } from "@/data/generated/subjects.generated";

const PAGE_SIZE = 30;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) return NextResponse.json({ message: "Không tìm thấy môn học" }, { status: 404 });

  const offsetValue = Number(new URL(request.url).searchParams.get("offset") ?? "0");
  const offset = Number.isInteger(offsetValue) && offsetValue >= 0 ? offsetValue : 0;
  const questions = subject.questions.slice(offset, offset + PAGE_SIZE);
  const nextOffset = offset + questions.length;

  return NextResponse.json({
    questions,
    nextOffset: nextOffset < subject.questionCount ? nextOffset : null,
    total: subject.questionCount,
  });
}
