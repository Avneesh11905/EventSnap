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

// ─── Type exports ────────────────────────────────────────
