import { z } from "zod";

export const pluginTokenPattern = /^[A-Za-z0-9_-]+$/;
export const logSizePattern = /^\d+(k|K|m|M|g|G)?$/;

const pluginListSchema = z
  .array(z.string().regex(pluginTokenPattern, "plugin names may contain letters, numbers, underscore, and dash"))
  .min(1, "plugin list must contain at least one plugin")
  .optional();

export const generateSosreportSchema = z
  .object({
    consent_token: z.string().min(1, "consent_token is required").optional(),
    only_plugins: pluginListSchema,
    enable_plugins: pluginListSchema,
    disable_plugins: pluginListSchema,
    log_size: z.string().regex(logSizePattern, "log_size must match format like 25 or 25m").optional(),
    redaction: z.boolean().optional(),
  })
  .refine(
    (value) => {
      if (!value.only_plugins) {
        return true;
      }
      return !value.enable_plugins && !value.disable_plugins;
    },
    {
      message: "only_plugins cannot be combined with enable_plugins or disable_plugins",
      path: ["only_plugins"],
    },
  );

export const fetchSosreportSchema = z.object({
  fetch_reference: z.string().min(1, "fetch_reference is required"),
});

export type GenerateSosreportInput = z.infer<typeof generateSosreportSchema>;
export type FetchSosreportInput = z.infer<typeof fetchSosreportSchema>;
