import { z } from 'zod';

export const SubtitleLineSchema = z.object({
  start: z.string(),
  end: z.string(),
  text: z.string(),
});

export const CreateSubtitleSchema = z.object({
  subtitleId: z.string().min(1),
  language: z.string().optional(),
  targetLanguage: z.string().optional(),
  duration: z.number().optional(),
});

export const UpdateSubtitleSchema = z.object({
  subtitle_json: z.array(SubtitleLineSchema),
  subtitle_id: z.string().min(1),
});

export const UpdateSubtitleByIdSchema = z.object({
  subtitle_json: z.array(SubtitleLineSchema),
});

export const UploadVideoSchema = z.object({
  duration: z.string(),
});

export const BurnSubtitleSchema = z.object({
  videoUrl: z.string().url(),
  subtitles: z.array(SubtitleLineSchema),
});

export type SubtitleLine = z.infer<typeof SubtitleLineSchema>;
export type CreateSubtitleInput = z.infer<typeof CreateSubtitleSchema>;
export type UpdateSubtitleInput = z.infer<typeof UpdateSubtitleSchema>;
export type UpdateSubtitleByIdInput = z.infer<typeof UpdateSubtitleByIdSchema>;
export type UploadVideoInput = z.infer<typeof UploadVideoSchema>;
export type BurnSubtitleInput = z.infer<typeof BurnSubtitleSchema>;
