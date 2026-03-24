import { z } from "zod";

export const connectSchema = z.object({
  jira_base_url: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://"), "jira_base_url must use HTTPS"),
  auth_mode: z.enum(["bearer_pat", "basic_cloud"]).optional(),
  account_email: z.string().email().optional(),
  pat: z.string().min(1, "pat is required").optional(),
  api_token: z.string().min(1, "api_token is required").optional(),
}).superRefine((input, ctx) => {
  const mode = input.auth_mode ?? (input.api_token ? "basic_cloud" : "bearer_pat");
  if (mode === "basic_cloud") {
    if (!input.account_email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["account_email"],
        message: "account_email is required for basic_cloud auth",
      });
    }
    if (!input.api_token) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["api_token"],
        message: "api_token is required for basic_cloud auth",
      });
    }
    if (input.pat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pat"],
        message: "pat must not be provided for basic_cloud auth",
      });
    }
    return;
  }

  if (!input.pat) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pat"],
      message: "pat is required for bearer_pat auth",
    });
  }
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

