export type TestPool = "all" | "unmastered";
export type TestSettings = { count: number; pool: TestPool; shuffleQuestions: boolean; shuffleOptions: boolean };
export type TestResponse = { selectedOptionIds: string[]; answeredAt: string };
export type TestScore = { correct: number; incorrect: number; unanswered: number; total: number; percent: number; scoredAt: string };
export type TestSession = { schemaVersion: 1; subjectId: string; subjectContentVersion: number; sessionId: string; status: "active" | "submitted"; currentIndex: number; settings: TestSettings; questionIds: string[]; optionOrders: Record<string, string[]>; responses: Record<string, TestResponse>; createdAt: string; updatedAt: string; submittedAt: string | null; score: TestScore | null };
export type TestDependencies = { random: () => number; id: () => string; now: () => string };
