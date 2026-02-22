import { z } from "zod";

export const passwordEntrySchema = z.object({
  username: z.string().trim().min(1, "Username or email is required").max(120),
  password: z.string().min(8, "Password should be at least 8 characters"),
  folder: z.string().trim().max(60).optional().default("General"),
  tags: z.array(z.string().trim().max(30)).optional().default([]),
});

export const passwordImportSchema = z.object({
  payload: z.string().min(1, "Import payload is required"),
});

export type PasswordEntryInput = z.infer<typeof passwordEntrySchema>;

