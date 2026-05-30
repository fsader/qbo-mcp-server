import { getQuickbooksBalanceSheet } from "../handlers/get-quickbooks-balance-sheet.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_balance_sheet";
const toolDescription =
  "Generate a Balance Sheet report from QuickBooks Online showing assets, liabilities, and equity. The Balance Sheet is a point-in-time statement: pass as_of_date (YYYY-MM-DD). start_date is ignored by QBO for this report.";
const toolSchema = z.object({
  as_of_date: z.string().optional().describe("Point-in-time 'as of' date (YYYY-MM-DD). Preferred over end_date."),
  end_date: z.string().optional().describe("'As of' date (YYYY-MM-DD). Used when as_of_date is not supplied."),
  start_date: z.string().optional().describe("Ignored by QBO for the Balance Sheet (point-in-time report)."),
  accounting_method: z.enum(["Cash", "Accrual"]).optional().describe("Accounting method"),
  summarize_column_by: z.enum(["Total", "Month", "Week", "Days"]).optional().describe("How to summarize columns"),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksBalanceSheet(params);
  if (response.isError) return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  return { content: [{ type: "text" as const, text: `Balance Sheet Report:` }, { type: "text" as const, text: JSON.stringify(response.result, null, 2) }] };
};

export const GetBalanceSheetTool: ToolDefinition<typeof toolSchema> = { name: toolName, description: toolDescription, schema: toolSchema, handler: toolHandler };
