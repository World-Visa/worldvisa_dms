import { z } from "zod";

// Admin login validation schema
export const adminLoginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

// Client login validation schema
export const clientLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

// JWT token validation schema
export const tokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// User profile validation schema
export const userProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .optional(),
  email: z.string().email("Please enter a valid email address").optional(),
});

// Export types
export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
export type ClientLoginFormData = z.infer<typeof clientLoginSchema>;
export type TokenFormData = z.infer<typeof tokenSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
