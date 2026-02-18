import { z } from "zod";

// ─── Events ──────────────────────────────────────────────
export const createEventSchema = z.object({
    name: z
        .string()
        .min(2, "Event name must be at least 2 characters")
        .max(100, "Event name must be under 100 characters")
        .trim(),
    description: z
        .string()
        .max(500, "Description must be under 500 characters")
        .trim()
        .optional(),
    date: z.string().optional(),
});

export const updateEventSchema = z.object({
    name: z
        .string()
        .min(2, "Event name must be at least 2 characters")
        .max(100, "Event name must be under 100 characters")
        .trim()
        .optional(),
    description: z
        .string()
        .max(500, "Description must be under 500 characters")
        .trim()
        .optional(),
    date: z.string().optional(),
    status: z.enum(["draft", "active", "archived"]).optional(),
});

// ─── Contact Form ────────────────────────────────────────
export const contactFormSchema = z.object({
    name: z.string().min(2, "Name is required").max(100).trim(),
    email: z.string().email("Invalid email address").trim().toLowerCase(),
    subject: z.string().min(2, "Subject is required").max(200).trim(),
    message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(2000, "Message must be under 2000 characters")
        .trim(),
});

// ─── Type exports ────────────────────────────────────────
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
