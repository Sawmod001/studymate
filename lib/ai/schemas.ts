import { z } from "zod";

export const practiceQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  answer: z.string(),
  explanation: z.string(),
});

export const studyResponseSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  // English gloss of the explanation (bilingual code-switch pedagogy).
  // Optional for backwards compatibility with older cached lessons.
  englishGloss: z.string().optional().default(""),
  keyPoints: z.array(z.string()),
  example: z.string(),
  commonMistake: z.string(),
  // Exam relevance note (e.g. "Common WAEC/NECO objective area"). Empty when N/A.
  examRelevance: z.string().optional().default(""),
  practiceQuestion: practiceQuestionSchema,
});

export const MODES = ["explain", "explain-simply", "step-by-step", "example", "practice", "quiz", "translate", "exam"] as const;
export const LANGS = ["yo", "ha", "ig", "en-NG", "en"] as const;

export const studyRequestSchema = z.object({
  question: z.string().min(3).max(2000),
  language: z.enum(LANGS),
  academicLevel: z.string().min(1).max(50),
  subject: z.string().min(1).max(100),
  mode: z.enum(MODES),
});
