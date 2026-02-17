import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(32, "Password must not exceed 32 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
    "Password must include uppercase, lowercase, number, and special character"
  );

// Reusable email schema
const emailSchema = z
  .string()
  .email("Invalid email address")
  .nonempty("Email is required")
  .transform((val) => val.toLowerCase().trim());

// Reusable OTP schema
const otpSchema = z
  .string()
  .length(6, "OTP must be 6 digits")
  .regex(/^\d+$/, "OTP must contain only numbers");

// Reusable confirm field
const confirmPasswordSchema = z.string().nonempty("Confirm Password is required");


export const loginUserSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: strongPasswordSchema,
    confirmNewPassword: confirmPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords must match",
    path: ["confirmNewPassword"],
  });

export const registerUserSchema = z
  .object({
    name: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must not exceed 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),

    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const trainAiSchema = z.object({
  videoUrls: z
    .array(z.string().url("Invalid video URL"))
    .min(3, "At least three video URLLs are required"),
  isRetraining: z.boolean().optional().default(false),
});

export type TrainAiDto = z.infer<typeof trainAiSchema>;
