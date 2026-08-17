import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200),
  body: z.string().trim().min(1, "Description is required").max(5000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export const createReplySchema = z.object({
  body: z.string().trim().min(1, "Reply cannot be empty").max(5000),
  isInternal: z.boolean().default(false),
});

export const assignTicketSchema = z.object({
  assignedTo: z.uuid().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["open", "pending", "resolved", "closed"]),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Name is required").max(100),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
