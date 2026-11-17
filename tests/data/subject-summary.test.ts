import { expect, it } from "vitest";
import { subjects } from "@/data/subjects";

const countBy = (values: (string | number)[]) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length]));

// Changing data on purpose (fixing answers, adding a subject)? Run `npx vitest run -u` and review the snapshot diff.
it.each(subjects.map((subject) => [subject.slug, subject] as const))("summary of %s matches the reviewed snapshot", (_slug, subject) => {
  expect({
    id: subject.id, contentVersion: subject.contentVersion, questionCount: subject.questionCount,
    types: countBy(subject.questions.map((question) => question.type)),
    optionCounts: countBy(subject.questions.map((question) => question.options.length)),
    answers: countBy(subject.questions.map((question) => question.correctAnswers.join("+"))),
    needsReview: subject.questions.filter((question) => question.needsReview).map((question) => question.number),
    duplicatePromptGroups: subject.dataQuality.duplicatePromptGroups
  }).toMatchSnapshot();
});
