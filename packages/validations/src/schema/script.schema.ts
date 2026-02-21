import { z } from 'zod';

export const SCRIPT_TONES = ['conversational', 'educational', 'motivational', 'funny', 'serious'] as const;
export type ScriptTone = (typeof SCRIPT_TONES)[number];

export const SCRIPT_LANGUAGES = ['english', 'spanish', 'french', 'german', 'japanese'] as const;
export type ScriptLanguage = (typeof SCRIPT_LANGUAGES)[number];

export const CreateScriptSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Prompt must be at least 3 characters')
    .max(2000, 'Prompt must not exceed 2000 characters'),
  context: z
    .string()
    .max(2000, 'Context must not exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  tone: z.enum(SCRIPT_TONES).default('conversational'),
  language: z.enum(SCRIPT_LANGUAGES).default('english'),
  duration: z.string().default('180'),
  includeStorytelling: z.coerce.boolean().optional().default(false),
  includeTimestamps: z.coerce.boolean().optional().default(false),
  references: z
    .string()
    .max(5000, 'References must not exceed 5000 characters')
    .optional()
    .or(z.literal('')),
  personalized: z.coerce.boolean().optional().default(true),
});

export type CreateScriptInput = z.infer<typeof CreateScriptSchema>;
