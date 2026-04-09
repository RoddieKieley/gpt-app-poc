import { z } from "zod";

export const getCpuInformationSchema = z.object({}).strict();

export type GetCpuInformationInput = z.infer<typeof getCpuInformationSchema>;
