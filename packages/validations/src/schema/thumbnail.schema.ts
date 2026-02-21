import { z } from 'zod';

export const THUMBNAIL_RATIOS = ['16:9', '9:16', '1:1', '4:3'] as const;

export const CreateThumbnailSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Prompt must be at least 3 characters')
    .max(2000, 'Prompt must not exceed 2000 characters'),
  ratio: z.enum(THUMBNAIL_RATIOS).default('16:9'),
  generateCount: z.coerce.number().int().min(1).max(5).default(3),
  videoLink: z.string().url('Invalid video URL').optional().or(z.literal('')),
  personalized: z.coerce.boolean().optional().default(true),
});

export type ThumbnailRatio = (typeof THUMBNAIL_RATIOS)[number];
export type CreateThumbnailInput = z.infer<typeof CreateThumbnailSchema>;
