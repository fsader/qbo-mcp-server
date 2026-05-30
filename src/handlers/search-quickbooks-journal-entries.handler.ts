import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { buildQuickbooksSearchCriteria } from "../helpers/build-quickbooks-search-criteria.js";

/**
 * Search journal entries in QuickBooks Online that match given criteria
 */
export async function searchQuickbooksJournalEntries(params: any): Promise<ToolResponse<any>> {
  try {
    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();

    // The QBO list query for JournalEntry does not support a COUNT projection
    // here: passing `count: true` makes node-quickbooks emit `SELECT COUNT(*)`
    // which the API rejects with HTTP 400. Strip it so the tool degrades to a
    // normal list.
    const { count: _ignoredCount, ...searchParams } = (params ?? {}) as Record<string, any>;
    const criteria = buildQuickbooksSearchCriteria(searchParams);

    return new Promise((resolve) => {
      quickbooks.findJournalEntries(criteria, (err: any, journalEntries: any) => {
        if (err) {
          resolve({
            result: null,
            isError: true,
            error: formatError(err),
          });
        } else {
          resolve({
            result: journalEntries,
            isError: false,
            error: null,
          });
        }
      });
    });
  } catch (error) {
    return {
      result: null,
      isError: true,
      error: formatError(error),
    };
  }
} 