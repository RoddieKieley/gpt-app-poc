import { z } from "zod";

export const connectSchema = z.object({
  jira_base_url: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://"), "jira_base_url must use HTTPS"),
  pat: z.string().min(1, "pat is required"),
});

export const connectionIdSchema = z.object({
  connection_id: z.string().min(1),
});

export const listAttachmentsSchema = z.object({
  connection_id: z.string().min(1),
  issue_key: z.string().min(1),
});

export const attachArtifactSchema = z.object({
  connection_id: z.string().min(1),
  issue_key: z.string().min(1),
  artifact_ref: z.string().min(1),
});

export type ConnectInput = z.infer<typeof connectSchema>;
export type ConnectionIdInput = z.infer<typeof connectionIdSchema>;
export type ListAttachmentsInput = z.infer<typeof listAttachmentsSchema>;
export type AttachArtifactInput = z.infer<typeof attachArtifactSchema>;

