import { notFound } from "next/navigation";
import { SubjectStudyWorkspace } from "@/components/study/SubjectStudyWorkspace";
import type { StudyMode } from "@/components/study/StudyModeSelector";
import { getSubject, subjectSlugs } from "@/data/generated/subjects.generated";

export const generateStaticParams = () => subjectSlugs.map((slug) => ({ slug }));

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ mode?: string | string[] }> }) {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) notFound();
  const requestedMode = (await searchParams).mode;
  const mode: StudyMode = requestedMode === "test" || requestedMode === "questions" ? requestedMode : "learn";
  return <SubjectStudyWorkspace subject={subject} mode={mode} />;
}
