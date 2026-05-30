/**
 * Env-driven safe tool gating for the QBO MCP server.
 *
 * This module decides which tools are registered with the MCP server based on
 * three environment variables:
 *
 *   QBO_TOOL_MODE          read | read_write | all   (default: read)
 *   QBO_ENABLE_DELETE_TOOLS  true | false            (default: false)
 *   QBO_ALLOWED_TOOLS        comma-separated names    (default: empty)
 *
 * The goal is to make read-only the safe default so an LLM cannot mutate or
 * delete a live production company unless write/delete access is explicitly and
 * deliberately enabled.
 *
 * Hard guarantees (also enforced by tests):
 *   - In `read` mode no create/update/delete tool is ever registered.
 *   - In `read_write` mode no delete tool is ever registered.
 *   - Delete tools require BOTH QBO_TOOL_MODE=all AND QBO_ENABLE_DELETE_TOOLS=true.
 *   - Unclassified tools are blocked unless explicitly named in QBO_ALLOWED_TOOLS
 *     (and never in `read` mode).
 */

export type ToolMode = "read" | "read_write" | "all";

export type ToolCategory = "read" | "write" | "delete" | "unclassified";

export interface ToolModeConfig {
  mode: ToolMode;
  enableDeleteTools: boolean;
  allowedTools: Set<string>;
}

// All read/report tools in the QBO inventory use one of these prefixes (every
// report tool uses `get_`). Any read-only tool that ever ships without a
// recognised prefix can be admitted explicitly via QBO_ALLOWED_TOOLS rather than
// weakening prefix-based classification.
const READ_PREFIXES = ["get_", "get-", "read_", "read-", "search_", "search-"];
const WRITE_PREFIXES = ["create_", "create-", "update_", "update-"];
const DELETE_PREFIXES = ["delete_", "delete-"];

function startsWithAny(name: string, prefixes: string[]): boolean {
  return prefixes.some((p) => name.startsWith(p));
}

/**
 * Classify a tool by its name. Handles both `_` and `-` separators.
 * Anything that does not match a known prefix is `unclassified` and is denied by
 * default (admit via QBO_ALLOWED_TOOLS when intentional).
 */
export function classifyTool(name: string): ToolCategory {
  const lower = name.toLowerCase();
  if (startsWithAny(lower, DELETE_PREFIXES)) return "delete";
  if (startsWithAny(lower, READ_PREFIXES)) return "read";
  if (startsWithAny(lower, WRITE_PREFIXES)) return "write";
  return "unclassified";
}

/**
 * Parse the gating configuration from environment variables.
 * An invalid QBO_TOOL_MODE falls back to the safest mode (`read`) and warns.
 */
export function loadToolModeConfig(
  env: NodeJS.ProcessEnv = process.env
): ToolModeConfig {
  const rawMode = (env.QBO_TOOL_MODE ?? "read").trim().toLowerCase();
  let mode: ToolMode;
  if (rawMode === "read" || rawMode === "read_write" || rawMode === "all") {
    mode = rawMode;
  } else {
    console.error(
      `[qbo-mcp] Invalid QBO_TOOL_MODE="${env.QBO_TOOL_MODE}". ` +
        `Expected one of read | read_write | all. Falling back to "read".`
    );
    mode = "read";
  }

  const enableDeleteTools =
    (env.QBO_ENABLE_DELETE_TOOLS ?? "false").trim().toLowerCase() === "true";

  const allowedTools = new Set(
    (env.QBO_ALLOWED_TOOLS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  );

  return { mode, enableDeleteTools, allowedTools };
}

/**
 * Decide whether a single tool should be registered under the given config.
 *
 * Rules:
 *   - delete  : only when mode === "all" AND enableDeleteTools === true.
 *   - read    : allowed in every mode.
 *   - write   : allowed in read_write and all.
 *   - unclassified: blocked in read mode; otherwise only when explicitly
 *                   listed in QBO_ALLOWED_TOOLS.
 *
 * When QBO_ALLOWED_TOOLS is non-empty it acts as an intersection filter for
 * classified tools (a tool must also appear in the allowlist), and as the only
 * gate that can admit unclassified tools.
 */
export function isToolAllowed(name: string, config: ToolModeConfig): boolean {
  const category = classifyTool(name);
  const hasAllowlist = config.allowedTools.size > 0;
  const inAllowlist = config.allowedTools.has(name);

  if (category === "unclassified") {
    // Never admitted by category alone. Only via explicit allowlist, and never
    // in read mode.
    return config.mode !== "read" && inAllowlist;
  }

  // category is now "read" | "write" | "delete" (unclassified returned above).
  const eligibleByMode =
    category === "read"
      ? true
      : category === "write"
        ? config.mode === "read_write" || config.mode === "all"
        : // delete
          config.mode === "all" && config.enableDeleteTools;

  // Allowlist (when present) intersects with mode eligibility.
  return hasAllowlist ? eligibleByMode && inAllowlist : eligibleByMode;
}
