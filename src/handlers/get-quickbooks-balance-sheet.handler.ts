import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export interface BalanceSheetOptions {
  /** Preferred point-in-time date. Maps to the QBO `end_date` "as of" param. */
  as_of_date?: string;
  /** @deprecated Ignored by the Balance Sheet report — it is a point-in-time statement. */
  start_date?: string;
  /** "As of" date. Used when `as_of_date` is not supplied. */
  end_date?: string;
  accounting_method?: "Cash" | "Accrual";
  summarize_column_by?: "Total" | "Month" | "Week" | "Days";
}

export async function getQuickbooksBalanceSheet(options: BalanceSheetOptions): Promise<ToolResponse<any>> {
  try {
    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();
    // Balance Sheet is a point-in-time report — the QBO "as of" date is the
    // `end_date` query param. `start_date` is NOT a valid param here and was
    // causing the date to be silently ignored in some configurations, so it is
    // never forwarded. `as_of_date` is the clearer alias and takes precedence.
    const asOf = options.as_of_date ?? options.end_date;
    const params: Record<string, any> = {};
    if (asOf) params.end_date = asOf;
    if (options.accounting_method) params.accounting_method = options.accounting_method;
    if (options.summarize_column_by) params.summarize_column_by = options.summarize_column_by;

    return new Promise((resolve) => {
      (quickbooks as any).reportBalanceSheet(params, (err: any, report: any) => {
        if (err) resolve({ result: null, isError: true, error: formatError(err) });
        else resolve({ result: report, isError: false, error: null });
      });
    });
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
