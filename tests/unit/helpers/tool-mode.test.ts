import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import {
  classifyTool,
  loadToolModeConfig,
  isToolAllowed,
  ToolModeConfig,
} from "../../../src/helpers/tool-mode.js";

const TOOLS_DIR = path.join(process.cwd(), "src", "tools");

/**
 * Read every tool's `name` directly from the source files (the canonical
 * inventory) without importing the handlers — importing handlers would pull in
 * the QuickBooks client, which constructs an OAuth client at module load.
 */
function readToolInventory(): string[] {
  const files = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".tool.ts"));
  const names: string[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(TOOLS_DIR, file), "utf-8");
    // Each tool file declares its name as `const toolName... = "the-name";`
    // (a few use a suffixed variable, e.g. toolName_create_bill).
    const match = content.match(
      /const\s+toolName\w*\s*=\s*["'`]([^"'`]+)["'`]/
    );
    if (match) names.push(match[1]);
  }
  return names;
}

const cfg = (over: Partial<ToolModeConfig> = {}): ToolModeConfig => ({
  mode: "read",
  enableDeleteTools: false,
  allowedTools: new Set<string>(),
  ...over,
});

const isWrite = (n: string) => /^(create|update)[_-]/i.test(n);
const isDelete = (n: string) => /^delete[_-]/i.test(n);

describe("classifyTool", () => {
  it("classifies read tools (underscore and hyphen)", () => {
    expect(classifyTool("get_balance_sheet")).toBe("read");
    expect(classifyTool("get-vendor")).toBe("read");
    expect(classifyTool("read_invoice")).toBe("read");
    expect(classifyTool("read-item")).toBe("read");
    expect(classifyTool("search_customers")).toBe("read");
    expect(classifyTool("search-vendors")).toBe("read");
  });

  it("classifies write tools (underscore and hyphen)", () => {
    expect(classifyTool("create_invoice")).toBe("write");
    expect(classifyTool("create-vendor")).toBe("write");
    expect(classifyTool("update_item")).toBe("write");
    expect(classifyTool("update-bill")).toBe("write");
  });

  it("classifies delete tools (underscore and hyphen)", () => {
    expect(classifyTool("delete_invoice")).toBe("delete");
    expect(classifyTool("delete-vendor")).toBe("delete");
  });

  it("treats unknown prefixes as unclassified", () => {
    expect(classifyTool("send_invoice")).toBe("unclassified");
    expect(classifyTool("void_payment")).toBe("unclassified");
    expect(classifyTool("duplicate_estimate")).toBe("unclassified");
  });
});

describe("loadToolModeConfig", () => {
  it("defaults to read mode, deletes disabled, empty allowlist", () => {
    const c = loadToolModeConfig({});
    expect(c.mode).toBe("read");
    expect(c.enableDeleteTools).toBe(false);
    expect(c.allowedTools.size).toBe(0);
  });

  it("parses valid modes and flags", () => {
    expect(loadToolModeConfig({ QBO_TOOL_MODE: "read" }).mode).toBe("read");
    expect(loadToolModeConfig({ QBO_TOOL_MODE: "read_write" }).mode).toBe(
      "read_write"
    );
    expect(loadToolModeConfig({ QBO_TOOL_MODE: "ALL" }).mode).toBe("all");
    expect(
      loadToolModeConfig({ QBO_ENABLE_DELETE_TOOLS: "true" }).enableDeleteTools
    ).toBe(true);
    expect(
      loadToolModeConfig({ QBO_ENABLE_DELETE_TOOLS: "TRUE" }).enableDeleteTools
    ).toBe(true);
    expect(
      loadToolModeConfig({ QBO_ENABLE_DELETE_TOOLS: "yes" }).enableDeleteTools
    ).toBe(false);
  });

  it("parses comma-separated allowlist, trimming and dropping empties", () => {
    const c = loadToolModeConfig({ QBO_ALLOWED_TOOLS: " a , b ,, c " });
    expect([...c.allowedTools].sort()).toEqual(["a", "b", "c"]);
  });

  it("falls back to read on invalid mode and warns", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const c = loadToolModeConfig({ QBO_TOOL_MODE: "write" });
    expect(c.mode).toBe("read");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("reads from process.env by default", () => {
    const c = loadToolModeConfig();
    expect(["read", "read_write", "all"]).toContain(c.mode);
  });
});

describe("isToolAllowed - per-mode behavior", () => {
  it("read mode allows reads, blocks writes/deletes/unclassified", () => {
    const c = cfg({ mode: "read" });
    expect(isToolAllowed("get_balance_sheet", c)).toBe(true);
    expect(isToolAllowed("search-vendors", c)).toBe(true);
    expect(isToolAllowed("create_invoice", c)).toBe(false);
    expect(isToolAllowed("update-vendor", c)).toBe(false);
    expect(isToolAllowed("delete_invoice", c)).toBe(false);
    expect(isToolAllowed("send_invoice", c)).toBe(false);
  });

  it("read_write mode allows reads+writes, blocks deletes", () => {
    const c = cfg({ mode: "read_write" });
    expect(isToolAllowed("get_customer", c)).toBe(true);
    expect(isToolAllowed("create_invoice", c)).toBe(true);
    expect(isToolAllowed("update-bill", c)).toBe(true);
    expect(isToolAllowed("delete_invoice", c)).toBe(false);
    expect(isToolAllowed("delete-vendor", c)).toBe(false);
  });

  it("read_write mode blocks unclassified unless explicitly allowlisted", () => {
    expect(isToolAllowed("send_invoice", cfg({ mode: "read_write" }))).toBe(
      false
    );
    expect(
      isToolAllowed(
        "send_invoice",
        cfg({ mode: "read_write", allowedTools: new Set(["send_invoice"]) })
      )
    ).toBe(true);
  });

  it("all mode registers deletes only when enableDeleteTools is true", () => {
    expect(isToolAllowed("delete_invoice", cfg({ mode: "all" }))).toBe(false);
    expect(
      isToolAllowed(
        "delete_invoice",
        cfg({ mode: "all", enableDeleteTools: true })
      )
    ).toBe(true);
  });

  it("all mode admits unclassified only when explicitly allowlisted", () => {
    expect(isToolAllowed("send_invoice", cfg({ mode: "all" }))).toBe(false);
    expect(
      isToolAllowed(
        "send_invoice",
        cfg({ mode: "all", allowedTools: new Set(["send_invoice"]) })
      )
    ).toBe(true);
  });

  it("delete tools require BOTH mode=all AND enableDeleteTools", () => {
    expect(
      isToolAllowed(
        "delete_invoice",
        cfg({ mode: "read_write", enableDeleteTools: true })
      )
    ).toBe(false);
    expect(
      isToolAllowed(
        "delete_invoice",
        cfg({ mode: "all", enableDeleteTools: false })
      )
    ).toBe(false);
    expect(
      isToolAllowed(
        "delete_invoice",
        cfg({ mode: "all", enableDeleteTools: true })
      )
    ).toBe(true);
  });

  it("allowlist intersects with mode rules for classified tools", () => {
    const c = cfg({ mode: "read", allowedTools: new Set(["get_customer"]) });
    expect(isToolAllowed("get_customer", c)).toBe(true);
    // a read tool not in the allowlist is filtered out by the intersection
    expect(isToolAllowed("get_vendor", c)).toBe(false);
  });

  it("allowlist can never admit a delete tool without all + enableDeleteTools", () => {
    const c = cfg({
      mode: "read_write",
      enableDeleteTools: true,
      allowedTools: new Set(["delete_invoice"]),
    });
    expect(isToolAllowed("delete_invoice", c)).toBe(false);
  });

  it("allowlist intersects delete tools even in all + enableDeleteTools", () => {
    const c = cfg({
      mode: "all",
      enableDeleteTools: true,
      allowedTools: new Set(["delete_invoice"]),
    });
    expect(isToolAllowed("delete_invoice", c)).toBe(true);
    expect(isToolAllowed("delete_customer", c)).toBe(false);
  });

  it("read mode never admits unclassified even if allowlisted", () => {
    const c = cfg({ mode: "read", allowedTools: new Set(["send_invoice"]) });
    expect(isToolAllowed("send_invoice", c)).toBe(false);
  });
});

describe("real tool inventory (manifest scan)", () => {
  const inventory = readToolInventory();

  it("discovers the tool inventory from source", () => {
    expect(inventory.length).toBeGreaterThan(100);
  });

  it("every real tool is classifiable (no unclassified in the shipped set)", () => {
    const unclassified = inventory.filter(
      (n) => classifyTool(n) === "unclassified"
    );
    expect(unclassified).toEqual([]);
  });

  it("HARD PASS: read mode exposes zero create/update/delete tools", () => {
    const c = cfg({ mode: "read" });
    const exposed = inventory.filter((n) => isToolAllowed(n, c));
    expect(exposed.filter(isWrite)).toEqual([]);
    expect(exposed.filter(isDelete)).toEqual([]);
    expect(exposed.length).toBeGreaterThan(0);
  });

  it("HARD PASS: read_write mode exposes zero delete tools", () => {
    const c = cfg({ mode: "read_write" });
    const exposed = inventory.filter((n) => isToolAllowed(n, c));
    expect(exposed.filter(isDelete)).toEqual([]);
    // and it does expose writes
    expect(exposed.filter(isWrite).length).toBeGreaterThan(0);
  });

  it("HARD PASS: all mode exposes deletes only when enableDeleteTools=true", () => {
    const withoutDelete = inventory.filter((n) =>
      isToolAllowed(n, cfg({ mode: "all", enableDeleteTools: false }))
    );
    expect(withoutDelete.filter(isDelete)).toEqual([]);

    const withDelete = inventory.filter((n) =>
      isToolAllowed(n, cfg({ mode: "all", enableDeleteTools: true }))
    );
    expect(withDelete.filter(isDelete).length).toBeGreaterThan(0);
  });
});
