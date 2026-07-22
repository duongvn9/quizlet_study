# CODEX PROMPT — BUILD A COMPLETE LOCAL-FIRST MULTIPLE-CHOICE STUDY WEBSITE

You are Codex acting as a senior full-stack engineer, frontend architect, test engineer, and release engineer. Build a complete multiple-choice study website inspired by the learning flow of Quizlet, while using an original product name, original visual design, original components, original source code, and original assets.

Do not copy Quizlet branding, logos, assets, HTML, CSS, or exact visual design.

Work proactively from start to finish inside the current repository. Do not stop after producing a plan. Inspect the repository and the supplied data file, then create the source code, run validation and tests, fix issues, complete the README, configure CI, and prepare the project for deployment to Vercel.

If the repository is empty, initialize a new project. If the repository already contains code, inspect it carefully, reuse appropriate parts, and avoid breaking unrelated functionality.

---

## 1. CONTEXT AND INPUT DATA

The input data file is named:

```text
swd392-questions.json
```

The file may be located at the repository root or attached to the task. Search for it by filename before starting.

After locating it, copy or move it into the application's canonical subject-data directory:

```text
src/data/subjects/swd392.json
```

Do not silently modify question text, answer choices, answer keys, duplicated prompts, grammar, or questionable source content. Only perform technical formatting changes that preserve meaning.

The subject file must support the following structure:

```ts
type SubjectFile = {
  schemaVersion: number;
  contentVersion: number;

  id: string;
  slug: string;
  code: string;
  name: string;
  description: string;
  language: string;
  questionCount: number;

  source: {
    file: string;
    pageCount: number;
    note: string;
  };

  dataQuality: {
    needsReviewCount: number;
    duplicatePromptGroups: number[][];
  };

  questions: Question[];
};

type Question = {
  id: string;
  number: number;
  type: "multiple-choice";
  question: string;

  options: Array<{
    id: string;
    text: string;
  }>;

  correctAnswer: string;
  explanation: string | null;

  source: {
    file: string;
    pages: number[];
  };

  needsReview: boolean;
  reviewNotes: string[];
};
```

### Version semantics

- `schemaVersion` controls the structure of the JSON format.
- `contentVersion` controls the version of the actual study content, including question text, options, answer keys, explanations, and review metadata.
- The initial SWD392 file should use:

```json
{
  "schemaVersion": 1,
  "contentVersion": 1
}
```

When answer keys or other study content are corrected later, preserve each question's `id` and `number`, update the relevant content fields, and increment `contentVersion`.

### Required data characteristics

The validation tooling must confirm the actual input data rather than assuming it.

For the current SWD392 file, confirm:

- `schemaVersion` is `1`.
- `contentVersion` exists and is a positive integer.
- Subject `id` and `slug` are `swd392`.
- Subject code is `SWD392`.
- Question language is English.
- There are exactly `249` questions.
- All 249 questions use `type: "multiple-choice"`.
- 247 questions contain 4 answer options.
- Questions 19 and 42 contain 5 answer options.
- Every `correctAnswer` matches an existing `options[].id`.
- Every question has a unique ID in the range `swd392-001` through `swd392-249`.
- 15 questions are marked with `needsReview: true`.
- The following duplicated-prompt groups are retained:
  - 1 and 2
  - 30 and 31
  - 34 and 35
  - 55 and 56
  - 98 and 99
  - 105 and 107
  - 147 and 148
- Duplicate questions must not be removed automatically.
- `explanation` is currently `null` for all questions.
- The UI must work correctly when no explanation is available.

Do not hard-code any answer key in components, domain logic, tests, or routes. The current JSON file must always be the source of truth.

---

## 2. PRODUCT GOAL

Build a local-first multiple-choice study website with the following capabilities:

1. Display a library of available subjects.
2. Display metadata and progress for each subject.
3. Start a study session.
4. Present one multiple-choice question at a time.
5. Allow answers by mouse, touch, or keyboard.
6. Show correct and incorrect feedback.
7. Reveal the correct answer after an incorrect response.
8. Provide an “I don't know” action.
9. Provide previous and next navigation.
10. Track new, learning, and mastered questions.
11. Reinsert incorrect or unknown questions later in the session.
12. Store all study progress in the browser using `localStorage`.
13. Restore the exact active session after reload or browser restart.
14. Provide a subject summary page.
15. Support additional subjects by adding JSON files that follow the same schema.
16. Support future corrections to answer keys without changing components or the study engine.
17. Deploy to Vercel without a database, backend, authentication, or secret environment variables.

---

## 3. HARD CONSTRAINTS

Do not implement:

- Supabase.
- Firebase.
- Any database.
- Authentication or accounts.
- A separate backend.
- An API for saving progress.
- PDF upload on the website.
- OCR in the website.
- AI-generated questions.
- An admin dashboard.
- Payments.
- Third-party user tracking.
- Quizlet branding or copied interface assets.
- Automatic answer-key correction.
- Automatic question deduplication.
- Required environment variables for the MVP.

All subject data lives in the repository.

All learner progress lives in the browser.

---

## 4. TECHNOLOGY STACK

Use:

- Next.js with the App Router.
- React.
- TypeScript with strict mode enabled.
- Tailwind CSS.
- Zod for subject-data and localStorage validation.
- Vitest for unit tests.
- React Testing Library for component tests.
- Playwright for end-to-end tests.
- ESLint.
- Prettier when useful.
- `lucide-react` or internal SVG icons.
- npm as the package manager.

Use current mutually compatible stable versions.

Do not add a heavy UI framework unless it provides clear value.

---

## 5. HIGH-LEVEL ARCHITECTURE

Keep these layers clearly separated.

### 5.1. Data layer

Responsibilities:

- Read subject JSON files.
- Validate subject schemas.
- Generate the subject registry.
- Retrieve a subject by slug.
- Expose subject metadata.
- Remain independent of UI and localStorage.

### 5.2. Study domain

Responsibilities:

- Create sessions.
- Process selected answers.
- Process “I don't know”.
- Update mastery state.
- Insert retry items.
- Navigate backward and forward.
- Calculate progress.
- Complete a session.
- Remain pure TypeScript.
- Avoid direct DOM or localStorage access.
- Be comprehensively unit-testable.

### 5.3. Persistence layer

Responsibilities:

- Read and write localStorage.
- Validate stored data.
- Version persisted schemas.
- Compare stored subject content versions with current subject content versions.
- Recover from corrupt stored data.
- Reset only the affected subject when its content changes.
- Optionally synchronize tabs using the browser `storage` event.

### 5.4. Presentation layer

Responsibilities:

- Application layout.
- Subject library.
- Subject details.
- Learn screen.
- Progress indicators.
- Question cards.
- Answer options.
- Feedback.
- Navigation.
- Summary.
- Responsive behavior.
- Accessibility.

---

## 6. RECOMMENDED PROJECT STRUCTURE

Small naming adjustments are acceptable if the existing repository uses a strong convention, but preserve the same separation of concerns.

```text
src/
  app/
    layout.tsx
    globals.css
    page.tsx
    not-found.tsx

    subjects/
      [slug]/
        page.tsx
        loading.tsx

        learn/
          page.tsx
          loading.tsx

        summary/
          page.tsx

  components/
    layout/
      AppHeader.tsx
      PageContainer.tsx

    subjects/
      SubjectCard.tsx
      SubjectProgressCard.tsx
      DataQualityNotice.tsx
      SubjectContentUpdatedNotice.tsx

    study/
      StudyShell.tsx
      StudyHeader.tsx
      StudyProgress.tsx
      QuestionCard.tsx
      AnswerOption.tsx
      AnswerFeedback.tsx
      StudyNavigation.tsx
      StudySettingsDialog.tsx
      StudyCompletion.tsx

    ui/
      Button.tsx
      Card.tsx
      Progress.tsx
      Badge.tsx
      Dialog.tsx
      Alert.tsx

  data/
    subjects/
      swd392.json

    generated/
      subjects.generated.ts

  domain/
    subjects/
      schemas.ts
      types.ts
      repository.ts

    study/
      types.ts
      constants.ts
      create-session.ts
      reducer.ts
      selectors.ts
      queue.ts
      progress.ts

  hooks/
    useIsMounted.ts
    useSubjectProgress.ts
    useKeyboardShortcuts.ts

  lib/
    storage/
      keys.ts
      schemas.ts
      local-study-storage.ts
      migrations.ts
      content-version.ts

    utils/
      shuffle.ts
      cn.ts
      dates.ts

scripts/
  generate-subject-registry.ts
  validate-subjects.ts

tests/
  data/
    subject-validation.test.ts

  domain/
    study-reducer.test.ts
    study-queue.test.ts
    study-progress.test.ts

  storage/
    local-study-storage.test.ts
    content-version.test.ts

  components/
    QuestionCard.test.tsx
    StudyNavigation.test.tsx

e2e/
  study-flow.spec.ts
  resume-progress.spec.ts
  content-version-reset.spec.ts
  responsive.spec.ts

public/
  icons/

.github/
  workflows/
    ci.yml

README.md
playwright.config.ts
vitest.config.ts
```

---

## 7. AUTOMATIC SUBJECT DISCOVERY

Do not hard-code SWD392 inside UI components.

Create:

```text
scripts/generate-subject-registry.ts
```

The script must:

1. Scan all `.json` files in `src/data/subjects`.
2. Perform basic filename validation.
3. Generate `src/data/generated/subjects.generated.ts`.
4. Export:
   - all subjects;
   - a map by slug;
   - a function to retrieve a subject by slug;
   - a slug list for `generateStaticParams`.
5. Produce deterministic output.
6. Avoid generated timestamps that create unnecessary diffs.
7. Never modify source JSON files.

Add scripts similar to:

```json
{
  "scripts": {
    "data:generate": "tsx scripts/generate-subject-registry.ts",
    "data:validate": "tsx scripts/validate-subjects.ts",
    "predev": "npm run data:generate && npm run data:validate",
    "prebuild": "npm run data:generate && npm run data:validate"
  }
}
```

If dynamic JSON imports create bundler limitations, generate static imports:

```ts
import swd392 from "../subjects/swd392.json";

export const subjects = [swd392] as const;

export const subjectsBySlug = {
  swd392,
} as const;
```

Adding a new subject should require only:

```text
1. Add a valid JSON file to src/data/subjects.
2. Run npm run data:generate.
3. Run npm run data:validate.
4. Run npm run build.
```

No core component or route should require manual editing.

---

## 8. DATA VALIDATION

Create Zod schemas for subjects and questions.

`validate-subjects.ts` must exit with a non-zero status on serious validation errors.

Validate at minimum:

- Valid JSON syntax.
- Supported `schemaVersion`.
- Required `contentVersion`.
- `contentVersion` is a positive integer.
- Non-empty `id`, `slug`, `code`, and `name`.
- URL-safe slug.
- `questionCount === questions.length`.
- Unique question IDs.
- Unique question numbers.
- Non-empty question text.
- Supported question type.
- At least two options per question.
- Unique option IDs within each question.
- Non-empty option text.
- `correctAnswer` exists in `options`.
- `source.pages` contains positive page numbers.
- `needsReview` is boolean.
- `reviewNotes` is an array of strings.
- `dataQuality.needsReviewCount` equals the actual number of flagged questions.
- Every number in `duplicatePromptGroups` exists.
- SWD392 contains exactly 249 questions.
- Questions 19 and 42 contain 5 options.
- Duplicate prompts are not validation errors.
- `needsReview: true` is not a validation error.
- Updating `correctAnswer` does not require changing question ID.
- The report printed to the terminal is clear and actionable.

Create tests proving:

- The real SWD392 file validates.
- A fixture missing `contentVersion` fails.
- A fixture with `contentVersion: 0` fails.
- A fixture with an answer key not present in its options fails.
- A fixture with incorrect `questionCount` fails.

---

## 9. ROUTES AND PAGES

### 9.1. Home page `/`

Display:

- An original application name, such as “Study Flow”.
- A short Vietnamese description.
- Subject cards from the generated registry.

Each card includes:

- Subject code.
- Name.
- Description.
- Total questions.
- Seen questions.
- Mastered questions.
- Completion percentage.
- “Bắt đầu học” or “Tiếp tục”.

Read progress only after client mounting to avoid hydration mismatch.

When no progress exists, display zero values.

### 9.2. Subject page `/subjects/[slug]`

Display:

- Subject code.
- Name.
- Description.
- Total questions.
- Language.
- Source metadata.
- Current `contentVersion`.
- Seen, learning, mastered, and accuracy values.

Actions:

- “Bắt đầu học” when no session exists.
- “Tiếp tục học” when an active incomplete session exists.
- “Học lại toàn bộ”.
- “Đặt lại tiến độ”.

Reset actions require confirmation.

Include a “Chất lượng dữ liệu” section showing:

- Number of questions requiring review.
- Duplicate prompt groups.
- A clear explanation that the source content has been preserved.
- No suggestion that every flagged question is necessarily incorrect.

### 9.3. Learn page `/subjects/[slug]/learn`

This is the primary interface.

Display:

- Compact header.
- Mode label “Học”.
- Subject code.
- Settings button.
- Exit button.
- Mastery progress bar.
- Seen count.
- Current question card.
- Dynamic list of answer options.
- Correct/incorrect feedback.
- “Không biết”.
- Previous/next navigation.
- Source question number.

For a question with `needsReview: true`:

- Do not display the review warning before the learner answers.
- After answering, show a subtle “Dữ liệu nguồn cần rà soát” badge.
- Allow `reviewNotes` to be viewed safely as escaped text.
- Never render review notes as HTML.

Do not reveal the correct answer before an answer or “I don't know” action.

Return a proper 404 page for an unknown slug.

### 9.4. Summary page `/subjects/[slug]/summary`

Display:

- Total subject questions.
- Seen questions.
- Mastered questions.
- Total attempts.
- Correct attempts.
- Incorrect attempts.
- “I don't know” attempts.
- Accuracy.
- Remaining learning questions.
- Continue action.
- Restart action.
- Return-to-subject action.

Handle direct navigation safely when no stored progress exists.

---

## 10. STUDY ENGINE

Implement the study engine with pure functions or a reducer.

### 10.1. Learning states

```ts
type LearningStatus = "new" | "learning" | "mastered";
```

Default rules:

- No attempt: `new`.
- Incorrect answer: `learning`.
- “I don't know”: `learning`.
- First consecutive correct answer: `learning`.
- Two consecutive correct answers: `mastered`.
- A mastered question answered incorrectly during review returns to `learning`.
- Incorrect or “I don't know” resets `correctStreak` to 0.

Use constants:

```ts
export const DEFAULT_MASTERY_STREAK = 2;
export const DEFAULT_RETRY_GAP = 4;
```

Do not scatter magic numbers throughout components.

### 10.2. Study queue

Use unique queue instances because the same question may appear multiple times.

```ts
type StudyQueueItem = {
  instanceId: string;
  questionId: string;
  reason: "initial" | "retry";
  answered: boolean;
};
```

Suggested session model:

```ts
type StudySession = {
  schemaVersion: 1;
  sessionId: string;
  subjectId: string;
  subjectContentVersion: number;

  createdAt: string;
  updatedAt: string;
  completedAt: string | null;

  queue: StudyQueueItem[];
  currentIndex: number;
  frontierIndex: number;

  attempts: StudyAttempt[];

  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    masteryStreak: number;
    retryGap: number;
  };
};
```

`frontierIndex` represents the furthest position the learner has genuinely reached. It distinguishes:

- viewing an earlier answered question;
- being at the active unanswered frontier;
- navigating through history without generating attempts.

### 10.3. Attempts

```ts
type StudyAttempt = {
  id: string;
  queueInstanceId: string;
  questionId: string;
  selectedOptionId: string | null;
  result: "correct" | "incorrect" | "dont-know";
  answeredAt: string;
};
```

### 10.4. Question progress

```ts
type QuestionProgress = {
  questionId: string;
  status: LearningStatus;
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  dontKnowCount: number;
  correctStreak: number;
  lastSelectedOptionId: string | null;
  lastResult: StudyAttempt["result"] | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  masteredAt: string | null;
};
```

### 10.5. Subject progress

Separate long-lived subject progress from the active session:

```ts
type SubjectProgress = {
  schemaVersion: 1;
  subjectId: string;
  subjectContentVersion: number;

  questionProgress: Record<string, QuestionProgress>;
  activeSession: StudySession | null;

  completedSessionCount: number;
  lifetimeAttempts: number;
  lastStudiedAt: string | null;
};
```

### 10.6. Session creation

When no active session exists:

- Create default progress for every question.
- Add each question exactly once to the initial queue.
- Keep source order by default.
- Use Fisher–Yates when shuffle is enabled.
- Store the current subject `contentVersion` as `subjectContentVersion`.
- Persist the new session immediately.

When restoring a valid incomplete session:

- Restore the exact queue.
- Restore `currentIndex`.
- Restore `frontierIndex`.
- Do not regenerate order.
- Do not reshuffle.
- Do not discard attempts.

When restarting after completion:

- Create a new active session.
- Keep long-lived subject statistics when appropriate.
- Allow mastered questions to be reviewed again.
- If a mastered question is then answered incorrectly, return it to `learning`.

### 10.7. Correct answer

- Allow each queue instance to be answered only once.
- Create an attempt.
- Increment total and correct counts.
- Increment `correctStreak`.
- When streak reaches the mastery target:
  - set status to `mastered`;
  - set `masteredAt`;
  - do not add a retry.
- Before mastery:
  - set status to `learning`;
  - insert one retry after `retryGap`.
- Do not insert another retry when an unanswered retry already exists.
- Show correct feedback.
- Do not automatically advance.
- Change the primary action to “Tiếp tục”.

### 10.8. Incorrect answer

- Create an attempt.
- Increment total and incorrect counts.
- Reset streak to 0.
- Set status to `learning`.
- Show the selected wrong answer.
- Show the correct answer.
- Insert a retry after `retryGap`.
- Do not automatically advance.
- Change the primary action to “Tiếp tục”.

### 10.9. “I don't know”

- Do not require an option selection.
- Create an attempt with `selectedOptionId: null`.
- Use result `dont-know`.
- Increment total and `dontKnowCount`.
- Reset streak.
- Set status to `learning`.
- Reveal the correct answer.
- Insert a retry after `retryGap`.
- Change the primary action to “Tiếp tục”.

### 10.10. Retry insertion

Rules:

- Target position is the current position plus the configured retry gap.
- Append to the end when the queue is too short.
- Never insert before the current item.
- Never keep more than one unanswered retry for the same question.
- Every retry receives a new `instanceId`.
- Make ID generation injectable or mockable for deterministic tests.

### 10.11. Previous and next navigation

Previous:

- Allows viewing an earlier queue item.
- Does not generate an attempt.
- Does not update question statistics merely because the item is viewed.
- Displays the previous selection and result for answered items.
- Is disabled at index 0.

Next:

- Moves forward through already answered history.
- Cannot skip an unanswered frontier question.
- The learner must use “Không biết” to skip answering.
- After feedback, Next or Continue moves to the next item.
- At the end:
  - complete the session when no unanswered queue items remain;
  - continue normally when retries have expanded the queue.

Do not allow an already answered queue instance to be answered again. Historical items are read-only.

---

## 11. PROGRESS CALCULATION

Do not use queue length as the main denominator because retries expand the queue.

Use stable subject-level metrics:

```ts
seenCount = questions with totalAttempts > 0
learningCount = questions with status === "learning"
masteredCount = questions with status === "mastered"
newCount = totalQuestions - seenCount
```

Accuracy:

```text
correct attempts / (correct attempts + incorrect attempts)
```

Do not count `dont-know` in the accuracy denominator, but display it separately.

Main progress:

```text
masteredCount / totalQuestions
```

Secondary text:

```text
Đã xem seenCount / totalQuestions
```

Optionally show segmented counts for:

- Mới.
- Đang học.
- Đã thuộc.

Clamp percentages from 0 to 100 and avoid division by zero.

---

## 12. LOCALSTORAGE AND CONTENT-VERSION HANDLING

Never access localStorage from a Server Component.

Use namespaced, versioned keys:

```text
study-flow:v1:subject:<subjectId>
study-flow:v1:settings
study-flow:v1:notice:<subjectId>
```

Create an adapter:

```ts
interface StudyStorage {
  loadSubjectProgress(
    subjectId: string,
    currentContentVersion: number
  ): LoadSubjectProgressResult;

  saveSubjectProgress(progress: SubjectProgress): void;
  removeSubjectProgress(subjectId: string): void;
}
```

Suggested load result:

```ts
type LoadSubjectProgressResult =
  | {
      status: "loaded";
      progress: SubjectProgress;
    }
  | {
      status: "missing";
      progress: null;
    }
  | {
      status: "content-version-mismatch";
      progress: SubjectProgress | null;
      previousContentVersion: number | null;
      currentContentVersion: number;
    }
  | {
      status: "invalid";
      progress: null;
    };
```

### Content-version rules

When loading progress:

1. Compare `progress.subjectContentVersion` with `subject.contentVersion`.
2. If they match, restore progress normally.
3. If they differ, treat the study content as updated.
4. For the MVP, reset the progress and active session for that subject only.
5. Do not delete progress for other subjects.
6. Do not clear the entire localStorage.
7. Save fresh progress using the current `contentVersion`.
8. Show this Vietnamese notification once:

```text
Bộ câu hỏi đã được cập nhật. Tiến độ của môn này đã được đặt lại để bảo đảm kết quả học chính xác.
```

9. Do not repeatedly show the message after it has been acknowledged.
10. A changed answer key must take effect immediately because all answer checking reads from the current JSON.

### General storage requirements

- Wrap `JSON.parse` in try/catch.
- Validate parsed data with Zod.
- If storage is invalid:
  - do not crash;
  - log a clear development warning;
  - optionally back up the corrupt value under a dedicated key;
  - reset only the affected subject;
  - never clear unrelated storage.
- Persist after:
  - session creation;
  - answer selection;
  - “I don't know”;
  - frontier movement;
  - setting changes;
  - completion.
- Prevent infinite write loops.
- Hydrate state safely after client mount.
- Show a short loading skeleton while progress is being restored.
- Optionally handle the browser `storage` event for multi-tab synchronization.
- Provide migration functions even though persisted schema version begins at 1.
- If a subject removes or renames question IDs without a content-version bump, detect incompatible queue items and recover safely.
- If localStorage quota is exceeded, continue in memory and show a non-blocking warning that progress may not persist.

### Required storage tests

Test:

- Valid load with matching content version.
- Missing progress.
- Invalid JSON.
- Invalid schema.
- Unsupported persisted schema.
- Resetting one subject.
- Matching content version preserves progress.
- Different content version resets only the affected subject.
- Other subject progress remains unchanged.
- The update notification is shown once.

---

## 13. SETTINGS

The Learn settings dialog should support:

- Shuffle questions:
  - applies only when a new session is created;
  - never reshuffles an active session.
- Shuffle options:
  - may apply per queue instance;
  - preserves the original option IDs;
  - keyboard keys `1..5` correspond to display order, not A–E.
- Reset active session.
- Reset all progress for the current subject.
- Confirmation for destructive actions.

The retry gap does not require an MVP control, but keep it configurable in the domain constants.

When the learner changes question shuffle during a session, explain that the setting applies to the next session.

---

## 14. KEYBOARD SHORTCUTS

On the Learn page:

- `1` through `5`: choose the answer in displayed order.
- `Enter`: continue after feedback.
- `ArrowLeft`: previous question.
- `ArrowRight`: next question when permitted.
- Ignore shortcuts while focus is inside input, textarea, select, or dialog controls.
- Ignore repeat keydown events.
- Keep every action available by click and touch.
- Show compact keyboard hints on desktop.
- Hide or simplify hints on mobile.

---

## 15. UI AND UX

Create an original, modern, focused learning interface.

### 15.1. Language

- All interface labels are Vietnamese.
- Keep question and option content in the source language.
- Do not automatically translate questions.

### 15.2. Visual style

- Soft, light background.
- High-contrast surface cards.
- Original accent color.
- Moderate corner radius.
- Subtle shadows.
- Clear typography.
- Main question width around 800–960px.
- Minimal motion.
- Correct and incorrect states must not rely on color alone.

### 15.3. Answer options

- Use one column on mobile.
- Use one or two columns on desktop depending on content.
- Each option is a real `<button>`.
- Display keyboard numbers 1–5.
- Support any valid option count rather than assuming four.
- Support long multiline text.

After answering:

- Mark the correct option with an icon and “Đáp án đúng”.
- Mark an incorrectly selected option with an icon and “Bạn đã chọn”.
- Reduce emphasis on unrelated options.
- Lock the queue instance.

### 15.4. Responsive behavior

Test at minimum:

- 360px.
- 390px.
- 768px.
- 1024px.
- 1440px.

Mobile requirements:

- Compact header.
- No horizontal overflow.
- Sticky navigation when useful.
- Safe-area support.
- Touch-friendly buttons.

### 15.5. Accessibility

- Semantic HTML.
- Correct heading hierarchy.
- Visible focus states.
- `aria-live="polite"` for feedback.
- Appropriate `aria-current` or state attributes.
- Dialog focus trap.
- Escape closes dialogs.
- Do not rely only on color.
- Adequate contrast.
- Respect `prefers-reduced-motion`.
- Full keyboard usability.
- Do not use clickable non-semantic divs.

---

## 16. REVIEW-FLAGGED SOURCE DATA

Questions with `needsReview: true` must remain fully usable.

Do not:

- skip them;
- hide them;
- modify them;
- delete them;
- change their answer key;
- merge duplicates.

On the subject page:

- Display `dataQuality.needsReviewCount`.
- Allow the user to inspect affected question numbers.
- Display duplicate groups from metadata.

On the Learn page:

- Do not show the warning before answering.
- After answering, show a subtle note.
- Escape `reviewNotes`.
- Do not render user-controlled HTML.

A later correction to one of these questions should be represented by editing the JSON, preserving its ID, and increasing `contentVersion`.

---

## 17. ERROR, LOADING, AND EMPTY STATES

Provide:

- Subject-detail loading skeleton.
- Learn-page loading skeleton during localStorage hydration.
- Proper 404 for unknown subjects.
- Appropriate client error boundary.
- Friendly development errors for invalid subject data.
- Empty state when no subject files exist.
- Recovery when an active session references a missing question ID.
- Content-version update notification.
- localStorage quota warning.

When an active session cannot be recovered:

- do not crash;
- explain that subject data changed;
- reset only the affected subject session;
- preserve unrelated subject progress.

---

## 18. TESTING

### 18.1. Study-domain unit tests

Cover:

1. Session creation with 249 initial queue items.
2. Source order when shuffle is disabled.
3. A valid permutation when shuffle is enabled.
4. First correct answer:
   - `learning`;
   - streak 1;
   - retry inserted.
5. Second consecutive correct answer:
   - `mastered`;
   - no new retry.
6. Incorrect answer:
   - streak reset;
   - `learning`;
   - retry inserted.
7. “I don't know”:
   - `selectedOptionId: null`;
   - count increased;
   - retry inserted.
8. No duplicate pending retry.
9. Correct retry placement.
10. A queue instance cannot be answered twice.
11. Previous does not change statistics.
12. Next cannot skip an unanswered frontier.
13. Correct new/learning/mastered selectors.
14. Accuracy excludes “I don't know”.
15. A mastered question returns to learning after an incorrect review answer.
16. Correct session completion.
17. Persist and restore preserve queue and position.
18. The engine reads the correct answer from subject JSON rather than a hard-coded map.

### 18.2. Data tests

Confirm:

- SWD392 validates.
- Exactly 249 questions.
- Exactly 247 questions with four options.
- Questions 19 and 42 have five options.
- Exactly 15 `needsReview` questions.
- Every answer key maps to an option.
- IDs and numbers are unique.
- Duplicate groups are preserved.
- `contentVersion` exists and is positive.
- Missing `contentVersion` fails.
- Invalid answer key fails.
- Incorrect question count fails.

### 18.3. Storage and content-version tests

Confirm:

- Matching versions preserve active session and progress.
- Different versions reset only the current subject.
- Other subjects remain unchanged.
- Fresh progress stores the current version.
- Corrupt storage does not crash.
- The update notice is displayed once.
- A corrected answer is used immediately after reload.

### 18.4. Component tests

Confirm:

- QuestionCard renders dynamic option counts.
- Option click sends the correct option ID.
- Correct feedback.
- Incorrect feedback.
- “I don't know” reveals the answer.
- Answered item is locked.
- Review badge appears only after answering.
- Navigation enable/disable state.
- Keyboard mapping for 1–5.
- Content update notification rendering.

### 18.5. Playwright E2E

#### Flow A — Start studying

1. Open home.
2. See SWD392 with 249 questions.
3. Open subject.
4. Start studying.
5. See question one.
6. Choose an answer.
7. See feedback.
8. Continue.
9. Reach the next question.

#### Flow B — Incorrect and retry

1. Answer incorrectly.
2. See the correct answer.
3. Continue.
4. See the same question again after the configured gap.
5. Confirm no uncontrolled duplicate retry exists.

#### Flow C — I don't know

1. Click “Không biết”.
2. See the correct answer.
3. See progress update.
4. Confirm the question is scheduled again.

#### Flow D — Previous and next

1. Answer two questions.
2. Return to the previous item.
3. See the original selection and result.
4. Confirm attempt count did not increase.
5. Return to the frontier.

#### Flow E — Reload and resume

1. Answer several questions.
2. Reload.
3. Confirm the same session is restored.
4. Confirm queue, progress, and current position are preserved.
5. Return to subject page and see “Tiếp tục học”.

#### Flow F — Manual reset

1. Create progress.
2. Request reset.
3. Cancel and confirm data remains.
4. Confirm reset and verify current subject progress returns to zero.
5. Verify another subject, when present, is not affected.

#### Flow G — Content version update

1. Seed localStorage progress for a subject at content version 1.
2. Load the same subject with content version 2.
3. Confirm only that subject is reset.
4. Confirm the Vietnamese update notice appears.
5. Confirm unrelated subject data remains.
6. Confirm a newly corrected answer key is used.

### 18.6. Test isolation

Clear localStorage before each E2E test or use an isolated browser context.

Do not make tests depend on execution order.

---

## 19. QUALITY GATES

Add scripts similar to:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "data:generate": "tsx scripts/generate-subject-registry.ts",
    "data:validate": "tsx scripts/validate-subjects.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "check": "npm run lint && npm run typecheck && npm run data:validate && npm run test && npm run build"
  }
}
```

Adjust lint commands for the installed Next.js version when necessary.

Before finishing, run:

```bash
npm install
npm run data:generate
npm run data:validate
npm run lint
npm run typecheck
npm run test
npm run build
```

When the environment allows:

```bash
npx playwright install chromium
npm run test:e2e
```

If a command cannot run because of environment restrictions, state that clearly. Never claim a check passed when it did not run.

Do not hide TypeScript errors with broad `any`, `@ts-ignore`, or disabled strict mode.

---

## 20. CONTINUOUS INTEGRATION

Create:

```text
.github/workflows/ci.yml
```

Run on push and pull request:

- checkout;
- setup Node;
- `npm ci`;
- data generation;
- data validation;
- lint;
- typecheck;
- unit tests;
- production build.

Optionally run Playwright Chromium when CI runtime is reasonable.

No secrets are required.

---

## 21. VERCEL DEPLOYMENT

The project must use standard Next.js deployment on Vercel.

Requirements:

- `npm run build` succeeds.
- No absolute local filesystem paths.
- Subject JSON files are available during build.
- Registry generation runs during `prebuild`.
- No database.
- No secret environment variables.
- No `vercel.json` unless actually necessary.
- Dynamic subject routes work from the generated registry.
- `generateStaticParams` is used when appropriate.
- Metadata generation does not break builds.
- No server-side access to `window` or localStorage.
- Updating the subject JSON and incrementing `contentVersion` is deployable through a normal Git push.

README deployment steps:

1. Create a GitHub repository.
2. Push the project.
3. Open Vercel.
4. Choose “Add New Project”.
5. Import the repository.
6. Confirm Next.js detection.
7. Deploy.
8. Verify home, subject details, Learn flow, reload persistence, and content-version reset behavior.

---

## 22. README REQUIREMENTS

Replace the default README with complete project documentation.

Include:

### Introduction

- Local-first multiple-choice study website.
- No accounts.
- No database.
- Browser-based progress.

### Installation

```bash
npm install
npm run dev
```

### Checks

```bash
npm run data:validate
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

### Data schema

Document subject and question fields, including:

- `schemaVersion`.
- `contentVersion`.
- `correctAnswer`.
- `needsReview`.
- `reviewNotes`.

### Adding a new subject

1. Create valid JSON.
2. Place it at `src/data/subjects/<slug>.json`.
3. Run registry generation.
4. Run validation.
5. Build.
6. Commit and deploy.

### Correcting an answer key or question

Document this exact workflow:

1. Keep the question `id` and `number` unchanged.
2. Update `correctAnswer`, question text, options, explanation, or review metadata as required.
3. Confirm the updated `correctAnswer` exists in the options.
4. Increment the subject's `contentVersion` by 1.
5. Run:

```bash
npm run data:generate
npm run data:validate
npm run lint
npm run typecheck
npm run test
npm run build
```

6. Commit and push.
7. Vercel redeploys.
8. On the next visit, progress for only that subject is reset because its content version changed.

### Data rules

- Never deduplicate automatically.
- Never correct answer keys automatically.
- Use `needsReview` and `reviewNotes`.
- Preserve stable question IDs.

### localStorage

Document:

- Storage keys.
- Persisted schema version.
- Subject content version.
- Reset behavior.
- Browser/device limitations.
- What happens when content is updated.

### Vercel deployment

Provide step-by-step instructions.

### Current limitations

- No cross-device synchronization.
- Clearing browser data removes progress.
- No document upload in the website.
- No accounts.
- Content updates intentionally reset progress for the affected subject.

---

## 23. IMPLEMENTATION PHASES

Execute in this order.

### Phase 1 — Inspect and bootstrap

1. List repository files.
2. Locate `swd392-questions.json`.
3. Read and validate its metadata.
4. Add `contentVersion: 1` if the supplied file has not yet been updated, without changing question content.
5. If the repository is empty, create a Next.js App Router TypeScript and Tailwind project.
6. Configure lint, tests, and path aliases.
7. Preserve a safe copy of the source file before moving or copying it.

### Phase 2 — Data foundation

1. Place JSON in `src/data/subjects/swd392.json`.
2. Create Zod schemas.
3. Create validation tooling.
4. Create the registry generator.
5. Run validation.
6. Fix tooling, not source content, when validation infrastructure is incorrect.
7. Add data tests.
8. Confirm `contentVersion` support.

### Phase 3 — Study domain

1. Create types.
2. Create constants.
3. Create pure queue functions.
4. Create reducer.
5. Create selectors.
6. Add tests.
7. Cover mastery, retries, navigation, and completion.
8. Ensure answer checking reads from subject JSON.

### Phase 4 — Persistence and content updates

1. Create storage keys.
2. Create stored-data Zod schemas.
3. Create localStorage adapter.
4. Create schema migrations.
5. Create content-version comparison.
6. Reset only an affected subject on mismatch.
7. Create the one-time update notice.
8. Test corrupt storage, reload, and content updates.

### Phase 5 — Pages and components

1. App layout.
2. Home.
3. Subject page.
4. Learn screen.
5. Summary.
6. 404.
7. Loading states.
8. Reset dialogs.
9. Data-quality notice.
10. Content-update notice.

### Phase 6 — Interaction and accessibility

1. Keyboard shortcuts.
2. Focus states.
3. Aria-live feedback.
4. Responsive behavior.
5. Reduced motion.
6. Touch controls.
7. Long option text.

### Phase 7 — E2E

1. Configure Playwright.
2. Implement all core flows.
3. Add content-version reset flow.
4. Run tests.
5. Fix flaky tests.
6. Do not hide race conditions with arbitrary timeouts.

### Phase 8 — Documentation and release

1. Complete README.
2. Add CI.
3. Run quality gates.
4. Build production.
5. Confirm no environment variables are required.
6. Provide an honest final report.

---

## 24. ACCEPTANCE CRITERIA

The task is complete only when all applicable items are satisfied.

### Data

- [ ] SWD392 JSON is integrated.
- [ ] Exactly 249 questions.
- [ ] Questions 19 and 42 display all five options.
- [ ] All 15 `needsReview` questions remain.
- [ ] Duplicate groups remain.
- [ ] Correct-answer mappings validate.
- [ ] `contentVersion` exists and is positive.
- [ ] Build fails for invalid subject JSON.
- [ ] No answer key is hard-coded.

### Functional

- [ ] Subject library exists.
- [ ] Subject detail exists.
- [ ] Learn screen exists.
- [ ] Answer selection works.
- [ ] Correct/incorrect feedback works.
- [ ] “I don't know” works.
- [ ] Incorrect questions return later.
- [ ] Mastery streak works.
- [ ] Previous/next works.
- [ ] Previous does not create attempts.
- [ ] Next cannot skip an unanswered frontier.
- [ ] Progress is accurate.
- [ ] Summary is accurate.
- [ ] Reset requires confirmation.

### Persistence and content updates

- [ ] Reload preserves an unchanged active session.
- [ ] Browser restart preserves progress when localStorage remains.
- [ ] Corrupt storage does not crash.
- [ ] No hydration mismatch.
- [ ] localStorage is never accessed on the server.
- [ ] Matching content versions preserve progress.
- [ ] A changed content version resets only the affected subject.
- [ ] Other subjects remain intact.
- [ ] The update notice is shown once.
- [ ] A corrected answer key is used after deployment.

### Extensibility

- [ ] A new JSON file requires no component changes.
- [ ] Registry generation works.
- [ ] Slug routes work.
- [ ] Shared validation works for multiple subjects.
- [ ] Content correction requires only JSON changes, a version bump, checks, and redeployment.

### Quality

- [ ] TypeScript strict mode.
- [ ] No serious lint issues.
- [ ] Unit tests pass.
- [ ] Data tests pass.
- [ ] Storage version tests pass.
- [ ] Build passes.
- [ ] E2E passes when the environment supports it.
- [ ] No mobile horizontal overflow.
- [ ] Keyboard access works.
- [ ] Basic accessibility is strong.

### Deployment

- [ ] Deploys to Vercel.
- [ ] No environment variables required.
- [ ] README contains deployment instructions.
- [ ] Production reload preserves local progress.
- [ ] Production content updates trigger subject-specific reset behavior.

---

## 25. DECISION RULES

When a small implementation detail is unspecified:

- Prefer the simplest clear testable solution.
- Do not add a backend.
- Do not add accounts.
- Do not add unnecessary dependencies.
- Do not alter source content.
- Do not hard-code answers.
- Do not ask the user about minor UI decisions.
- Stop only if the input file cannot be found or the repository is unusably broken.
- Search for the file when it is not in the expected location.
- Use current stable package APIs.
- Update README when tooling differs from this specification.
- Do not leave core functionality as TODO.
- Do not use mock data instead of integrating the real JSON.
- Treat `contentVersion` as required for every subject.
- Preserve stable question IDs during corrections.

---

## 26. REQUIRED FINAL CODEX REPORT

After implementation, return a concise but complete report containing:

1. **Implemented**
   - Core features.
   - Architecture.
   - Persistence.
   - Content-version behavior.
   - Data validation.

2. **Important files**
   - File paths and responsibilities.

3. **SWD392 data**
   - Question count.
   - `needsReview` count.
   - Option counts.
   - Duplicate groups.
   - Current `contentVersion`.

4. **Commands run**
   - Each command.
   - Pass/fail status.
   - Never claim success for a command that did not run.

5. **Run locally**

```bash
npm install
npm run dev
```

6. **Run checks**

```bash
npm run check
npm run test:e2e
```

7. **Add a new subject**

8. **Correct an answer key**

9. **Deploy to Vercel**

10. **Remaining limitations**
    - Only real limitations.
    - Clearly disclose skipped tests or environment restrictions.

Begin by inspecting the repository and locating `swd392-questions.json`. Then implement the entire project continuously until it is production-ready.
