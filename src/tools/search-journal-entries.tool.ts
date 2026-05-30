import { searchQuickbooksJournalEntries } from "../handlers/search-quickbooks-journal-entries.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

// Define the tool metadata
const toolName = "search_journal_entries";
const toolDescription =
  "Search journal entries in QuickBooks Online that match given criteria. Call with {} to list all journal entries. (A row count is not supported for this endpoint — `count` is intentionally omitted.)";

// Define the expected input schema for searching journal entries.
// NOTE: `count` is deliberately NOT exposed. The QBO list query for JournalEntry
// rejects a COUNT projection with HTTP 400, so the handler strips it as a safety
// net and it is not offered here to avoid the model calling it incorrectly.
const toolSchema = z.object({
  criteria: z.array(z.any()).optional(),
  asc: z.string().optional(),
  desc: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  fetchAll: z.boolean().optional(),
});

type ToolParams = z.infer<typeof toolSchema>;

// Define the tool handler
const toolHandler = async (args: any) => {
  const response = await searchQuickbooksJournalEntries(args.params);

  if (response.isError) {
    return {
      content: [
        { type: "text" as const, text: `Error searching journal entries: ${response.error}` },
      ],
    };
  }

  return {
    content: [
      { type: "text" as const, text: `Journal entries found:` },
      { type: "text" as const, text: JSON.stringify(response.result) },
    ],
  };
};

export const SearchJournalEntriesTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
}; 