import { z } from 'zod';

export const TrackReferralSchema = z.object({
  referralCode: z.string().min(1, 'Referral code is required').transform(val => val.toUpperCase().trim()),
  userEmail: z.string().email('Invalid email format').transform(val => val.toLowerCase().trim()),
});

export type TrackReferralInput = z.infer<typeof TrackReferralSchema>;
