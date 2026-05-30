import { getQuickbooksTrialBalance } from "../handlers/get-quickbooks-trial-balance.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_trial_balance";
const toolDescription =
  "Generate a Trial Balance report from QuickBooks Online showing all account balances. Pass BOTH start_date and end_date to define the reporting period — if only end_date is supplied, QBO defaults the period to month-to-date.";
const toolSchema = z.object({
  start_date: z.string().optional().describe("Period start (YYYY-MM-DD). Supply together with end_date for an explicit period."),
  end_date: z.string().optional().describe("Period end (YYYY-MM-DD). Supply together with start_date for an explicit period."),
  accounting_method: z.enum(["Cash", "Accrual"]).optional().describe("Accounting method"),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksTrialBalance(params);
  if (response.isError) return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  return { content: [{ type: "text" as const, text: `Trial Balance Report:` }, { type: "text" as const, text: JSON.stringify(response.result, null, 2) }] };
};

export const GetTrialBalanceTool: ToolDefinition<typeof toolSchema> = { name: toolName, description: toolDescription, schema: toolSchema, handler: toolHandler };
