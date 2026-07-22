import type { z } from "zod";
import type { questionSchema, subjectSchema } from "./schemas";
export type Question = z.infer<typeof questionSchema>;
export type Subject = z.infer<typeof subjectSchema>;
