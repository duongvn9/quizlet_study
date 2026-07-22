import subject0 from "../subjects/swd392.json";
import { subjectSchema } from "@/domain/subjects/schemas";
import type { Subject } from "@/domain/subjects/types";
export const subjects: Subject[] = [subject0].map(value => subjectSchema.parse(value));
export const subjectsBySlug = Object.fromEntries(subjects.map(subject => [subject.slug, subject])) as Record<string, Subject>;
export const subjectSlugs = subjects.map(subject => subject.slug);
export const getSubject = (slug: string) => subjectsBySlug[slug];
