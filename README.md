# QuickBooks Online MCP Server

<div align="center">

**A comprehensive Model Context Protocol (MCP) server for QuickBooks Online**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tools](https://img.shields.io/badge/Tools-144-green.svg)](#available-tools)
[![Entities](https://img.shields.io/badge/Entities-29-orange.svg)](#entities)
[![Reports](https://img.shields.io/badge/Reports-11-purple.svg)](#reports)
[![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)](#testing)
[![Tests](https://img.shields.io/badge/Tests-396-blue.svg)](#testing)

[Quick Start](#quick-start) | [Available Tools](#available-tools) | [Authentication](#authentication) | [Documentation](#documentation)

</div>

---

## Overview

This MCP server provides complete QuickBooks Online API integration for Claude Code and other MCP-compatible clients. It includes full CRUD operations for 29 entity types and 11 financial reports, giving you comprehensive access to QuickBooks Online functionality.

### Key Features

- **144 Total Tools** - Complete coverage of QuickBooks Online API
- **29 Entity Types** - Full CRUD operations (Create, Read, Update, Delete, Search)
- **11 Financial Reports** - Balance Sheet, P&L, Cash Flow, and more
- **OAuth 2.0 Authentication** - Secure token-based authentication
- **TypeScript** - Full type safety with Zod validation
- **Tested** - Jest test suite with ESM support

> Note: this is a local MCP server. It runs as a stdio subprocess on the developer's or partner's machine and authenticates to a QuickBooks Online company.

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mcp-quickbooks-online.git
cd mcp-quickbooks-online

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

Copy the template `.env.example` to `.env` in the root directory and fill in your values:

```bash
cp .env.example .env
```

This internal fork targets **production** by default and ships **read-only** via
`QBO_TOOL_MODE=read`:

```env
# WARNING: This internal fork is configured for PRODUCTION by default.
# Do not use against a real company unless QBO_TOOL_MODE=read is active.
QUICKBOOKS_CLIENT_ID=your_production_client_id
QUICKBOOKS_CLIENT_SECRET=your_production_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:8000/callback
QUICKBOOKS_ENVIRONMENT=production
# Filled automatically by npm run auth
QUICKBOOKS_REFRESH_TOKEN=
QUICKBOOKS_REALM_ID=
# Safety controls
QBO_TOOL_MODE=read
QBO_ENABLE_DELETE_TOOLS=false
QBO_ALLOWED_TOOLS=
```

`.env` is gitignored so your real credentials stay local. **Do not put secrets in
your MCP client config** — leave them in `.env`.

### Claude Code Integration (project `.mcp.json`)

The server communicates over **stdio** and reads credentials from `.env`
(resolved next to the built server), so the client config stays secret-free:

```json
{
  "mcpServers": {
    "qbo": {
      "command": "node",
      "args": ["/absolute/path/to/qbo-mcp-server/dist/index.js"]
    }
  }
}
```

### VS Code Integration (`.vscode/mcp.json`)

```json
{
  "servers": {
    "qbo": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/qbo-mcp-server/dist/index.js"]
    }
  }
}
```

Rebuild (`npm run build`) after any code change before the client relaunches the
server.

---

## Remote deployment (Railway)

The server has **two entrypoints that share the same tools and gating**:

| Entrypoint        | Command               | Transport         | Use                                   |
| ----------------- | --------------------- | ----------------- | ------------------------------------- |
| `dist/index.js`   | `npm start`           | stdio             | Local Claude Code / VS Code (default) |
| `dist/http.js`    | `npm run start:http`  | Streamable HTTP   | Remote host (Railway)                 |

The HTTP entrypoint exposes:

- `GET /health` — public; returns only `{ "status": "ok", "mode": "<QBO_TOOL_MODE>" }`. No secrets, tokens, realm id, or QBO data.
- `POST /mcp` (+ `GET`/`DELETE` for session management) — the MCP endpoint. **Requires** `Authorization: Bearer <MCP_SERVER_TOKEN>`. Without a valid bearer it returns `401`. The server refuses to start if `MCP_SERVER_TOKEN` is unset.

### Railway setup

1. Create a Railway service from this repo. Build/run are defined by the
   [`Dockerfile`](Dockerfile) and [`railway.toml`](railway.toml) (Node 20; build
   `npm run build`; start `node dist/http.js`; healthcheck `GET /health`).
2. Set service **Variables** (Railway injects `PORT` automatically — do not set it):

   ```bash
   QUICKBOOKS_CLIENT_ID=...
   QUICKBOOKS_CLIENT_SECRET=...
   QUICKBOOKS_REFRESH_TOKEN=...        # obtain locally via `npm run auth` first
   QUICKBOOKS_REALM_ID=...
   QUICKBOOKS_ENVIRONMENT=production
   QBO_TOOL_MODE=read                  # start read-only
   QBO_ENABLE_DELETE_TOOLS=false
   MCP_SERVER_TOKEN=...                # long random secret (e.g. `openssl rand -hex 32`)
   ```

3. Deploy, then check health:

   ```bash
   curl https://<railway-domain>/health
   # {"status":"ok","mode":"read"}
   ```

### Connect Claude Code to the remote server

```bash
claude mcp add --transport http awtar-qbo \
  https://<railway-domain>/mcp \
  --header "Authorization: Bearer <MCP_SERVER_TOKEN>"
```

Equivalent `.mcp.json`:

```json
{
  "mcpServers": {
    "awtar-qbo": {
      "type": "http",
      "url": "https://<railway-domain>/mcp",
      "headers": { "Authorization": "Bearer <MCP_SERVER_TOKEN>" }
    }
  }
}
```

Then verify in Claude Code with a read call such as `get_company_info`.

### ⚠️ Refresh-token persistence is temporary

Intuit rotates the QBO refresh token roughly every 24h. The current client
persists a rotated token by writing back to a local `.env`
([`saveTokensToEnv()`](src/clients/quickbooks-client.ts)). **On Railway that file
is ephemeral** — it is lost on every redeploy and container restart. Until a
durable token store is added (planned: Railway Volume / encrypted store), if the
server loses access after a redeploy you may need to **re-run `npm run auth`
locally and manually update `QUICKBOOKS_REFRESH_TOKEN` in the Railway
Variables**. This is a known v2-fast limitation, not a bug.

---

## Tool gating / Safety

This fork is for internal/personal use against a **production** QuickBooks Online
company. Because the underlying API can create, update, and delete real data,
tool registration is gated by environment variables so the safe default exposes
**read-only** tools only.

| `QBO_TOOL_MODE` | Registers                                                                      |
| --------------- | ----------------------------------------------------------------------------- |
| `read` (default) | read/report tools only (`get_*`, `read_*`, `search_*`, and `-` variants)      |
| `read_write`    | read/report **plus** create/update tools; **never** delete tools               |
| `all`           | read/write tools, **plus** delete tools only if `QBO_ENABLE_DELETE_TOOLS=true` |

- `QBO_ENABLE_DELETE_TOOLS` (default `false`) — delete tools require **both**
  `QBO_TOOL_MODE=all` **and** `QBO_ENABLE_DELETE_TOOLS=true`. Nothing else admits a delete tool.
- `QBO_ALLOWED_TOOLS` — optional comma-separated allowlist. When set it
  *intersects* with the mode rules (further restricting classified tools) and is
  the only way to admit an unclassified tool (and never in `read` mode).
- Unclassified tool names (no recognised prefix) are blocked by default.

On startup the server prints a one-line summary to **stderr**, e.g.:

```
[qbo-mcp] QBO_TOOL_MODE=read | delete tools enabled: false | registered: 69 | skipped: 71
```

Set `QBO_DEBUG_TOOLS=true` to also print the full registered/skipped tool lists.
Gating logic lives in [`src/helpers/tool-mode.ts`](src/helpers/tool-mode.ts),
with tests in [`tests/unit/helpers/tool-mode.test.ts`](tests/unit/helpers/tool-mode.test.ts).

**Hard guarantees:** in `read` mode no create/update/delete tool is visible; in
`read_write` mode no delete tool is visible; delete tools require
`QBO_TOOL_MODE=all` **and** `QBO_ENABLE_DELETE_TOOLS=true`. Start in `read`,
verify access, then consider enabling writes.

---

## Known live verification results

A read-only endpoint sweep was run against the **production "Awtar Lebanon"**
QuickBooks Online company (`QBO_TOOL_MODE=read`). Results:

- All **19** read/search/report endpoints tested worked.
- **No regional blocks** — despite the company being based in Lebanon, every
  endpoint returned data normally.
- **No permission blocks** — no `401`/`403`/scope errors on any tool, reports included.
- No create/update/delete/send/void/post tool was invoked.

**Empty datasets that are normal for this company** (the endpoints work — there is
simply no data): `search_bills`, `search_sales_receipts`, `search_credit_memos`,
`search_deposits`, `search_transfers`, and `get_aged_payables`. (This company
records expenses via purchases/journal entries and carries no A/P.)

**Tool ergonomics hardened after verification:**

- `search_accounts`, `search_items`, `search_invoices` now accept an empty call
  (`{}`) and default internally to `criteria: []` (list all) — no more
  "Invalid criteria" on an empty request.
- `search_purchases` and `search_journal_entries` no longer expose a `count`
  option (the QBO list query for these entities rejects a `COUNT` projection with
  HTTP 400). The handlers also strip a stray `count` flag as a safety net.

**Report date parameters (QBO quirks documented):**

- **Balance Sheet** is a point-in-time statement. Pass **`as_of_date`** (maps to
  QBO's `end_date`). `start_date` is ignored by QBO for this report and is never
  forwarded.
- **Trial Balance** honors an explicit period only when **both** `start_date` and
  `end_date` are supplied. If only `end_date` is given, QBO defaults the period to
  month-to-date.
- **Profit & Loss** and **General Ledger** honor an explicit `start_date`/`end_date`
  range.

Keep `QBO_TOOL_MODE=read` until write workflows are separately designed and reviewed.

---

## Available Tools

### Entities

Complete CRUD operations are available for all entity types:

| Entity | Create | Get | Update | Delete | Search |
|--------|:------:|:---:|:------:|:------:|:------:|
| **Customer** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Invoice** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Estimate** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Bill** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Vendor** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Employee** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Account** | ✅ | ✅ | ✅ | - | ✅ |
| **Item** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Journal Entry** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Bill Payment** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Purchase** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Payment** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sales Receipt** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Credit Memo** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Refund Receipt** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Purchase Order** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Vendor Credit** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Deposit** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Transfer** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Time Activity** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Class** | ✅ | ✅ | ✅ | - | ✅ |
| **Department** | ✅ | ✅ | ✅ | - | ✅ |
| **Term** | ✅ | ✅ | ✅ | - | ✅ |
| **Payment Method** | ✅ | ✅ | ✅ | - | ✅ |
| **Tax Code** | - | ✅ | - | - | ✅ |
| **Tax Rate** | - | ✅ | - | - | ✅ |
| **Tax Agency** | - | ✅ | - | - | ✅ |
| **Company Info** | - | ✅ | ✅ | - | - |
| **Attachable** | ✅ | ✅ | ✅ | ✅ | ✅ |

### Reports

| Report | Tool Name | Description |
|--------|-----------|-------------|
| **Balance Sheet** | `get_balance_sheet` | Assets, liabilities, and equity snapshot |
| **Profit & Loss** | `get_profit_and_loss` | Income and expenses over a period |
| **Cash Flow** | `get_cash_flow` | Cash inflows and outflows |
| **Trial Balance** | `get_trial_balance` | Debit and credit balances |
| **General Ledger** | `get_general_ledger` | Complete transaction history |
| **Customer Sales** | `get_customer_sales` | Sales by customer |
| **Aged Receivables** | `get_aged_receivables` | Outstanding customer invoices |
| **Aged Receivables Detail** | `get_aged_receivables_detail` | Detailed aging breakdown |
| **Customer Balance** | `get_customer_balance` | Current customer balances |
| **Aged Payables** | `get_aged_payables` | Outstanding vendor bills |
| **Vendor Expenses** | `get_vendor_expenses` | Expenses by vendor |

---

## Tool Reference

<details>
<summary><strong>Customer Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_customer` | Create a new customer |
| `get_customer` | Get customer by ID |
| `update_customer` | Update customer details |
| `delete_customer` | Delete a customer |
| `search_customers` | Search customers with filters |

</details>

<details>
<summary><strong>Invoice Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_invoice` | Create a new invoice |
| `get_invoice` | Get invoice by ID |
| `update_invoice` | Update invoice details |
| `delete_invoice` | Delete/void an invoice |
| `search_invoices` | Search invoices with filters |

</details>

<details>
<summary><strong>Payment Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_payment` | Record a customer payment |
| `get_payment` | Get payment by ID |
| `update_payment` | Update payment details |
| `delete_payment` | Void a payment |
| `search_payments` | Search payments with filters |

</details>

<details>
<summary><strong>Bill & Vendor Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_bill` | Create a new bill |
| `get_bill` | Get bill by ID |
| `update_bill` | Update bill details |
| `delete_bill` | Delete a bill |
| `search_bills` | Search bills with filters |
| `create_vendor` | Create a new vendor |
| `get_vendor` | Get vendor by ID |
| `update_vendor` | Update vendor details |
| `delete_vendor` | Delete a vendor |
| `search_vendors` | Search vendors with filters |
| `create_bill_payment` | Create a bill payment |
| `get_bill_payment` | Get bill payment by ID |
| `update_bill_payment` | Update bill payment |
| `delete_bill_payment` | Delete a bill payment |
| `search_bill_payments` | Search bill payments |

</details>

<details>
<summary><strong>Sales Receipt & Credit Memo Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_sales_receipt` | Create a sales receipt |
| `get_sales_receipt` | Get sales receipt by ID |
| `update_sales_receipt` | Update sales receipt |
| `delete_sales_receipt` | Void a sales receipt |
| `search_sales_receipts` | Search sales receipts |
| `create_credit_memo` | Create a credit memo |
| `get_credit_memo` | Get credit memo by ID |
| `update_credit_memo` | Update credit memo |
| `delete_credit_memo` | Void a credit memo |
| `search_credit_memos` | Search credit memos |
| `create_refund_receipt` | Create a refund receipt |
| `get_refund_receipt` | Get refund receipt by ID |
| `update_refund_receipt` | Update refund receipt |
| `delete_refund_receipt` | Void a refund receipt |
| `search_refund_receipts` | Search refund receipts |

</details>

<details>
<summary><strong>Banking Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_deposit` | Create a bank deposit |
| `get_deposit` | Get deposit by ID |
| `update_deposit` | Update deposit details |
| `delete_deposit` | Delete a deposit |
| `search_deposits` | Search deposits |
| `create_transfer` | Create an account transfer |
| `get_transfer` | Get transfer by ID |
| `update_transfer` | Update transfer details |
| `delete_transfer` | Delete a transfer |
| `search_transfers` | Search transfers |

</details>

<details>
<summary><strong>Purchase Order & Vendor Credit Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_purchase_order` | Create a purchase order |
| `get_purchase_order` | Get purchase order by ID |
| `update_purchase_order` | Update purchase order |
| `delete_purchase_order` | Delete a purchase order |
| `search_purchase_orders` | Search purchase orders |
| `create_vendor_credit` | Create a vendor credit |
| `get_vendor_credit` | Get vendor credit by ID |
| `update_vendor_credit` | Update vendor credit |
| `delete_vendor_credit` | Delete a vendor credit |
| `search_vendor_credits` | Search vendor credits |

</details>

<details>
<summary><strong>Time Tracking Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_time_activity` | Create a time activity |
| `get_time_activity` | Get time activity by ID |
| `update_time_activity` | Update time activity |
| `delete_time_activity` | Delete a time activity |
| `search_time_activities` | Search time activities |

</details>

<details>
<summary><strong>Classification Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_class` | Create a class |
| `get_class` | Get class by ID |
| `update_class` | Update class details |
| `search_classes` | Search classes |
| `create_department` | Create a department |
| `get_department` | Get department by ID |
| `update_department` | Update department |
| `search_departments` | Search departments |

</details>

<details>
<summary><strong>Settings Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `create_term` | Create a payment term |
| `get_term` | Get term by ID |
| `update_term` | Update term details |
| `search_terms` | Search terms |
| `create_payment_method` | Create a payment method |
| `get_payment_method` | Get payment method by ID |
| `update_payment_method` | Update payment method |
| `search_payment_methods` | Search payment methods |

</details>

<details>
<summary><strong>Tax Tools</strong></summary>

| Tool | Description |
|------|-------------|
| `get_tax_code` | Get tax code by ID |
| `search_tax_codes` | Search tax codes |
| `get_tax_rate` | Get tax rate by ID |
| `search_tax_rates` | Search tax rates |
| `get_tax_agency` | Get tax agency by ID |
| `search_tax_agencies` | Search tax agencies |

</details>

<details>
<summary><strong>Company & Attachments</strong></summary>

| Tool | Description |
|------|-------------|
| `get_company_info` | Get company information |
| `update_company_info` | Update company info |
| `create_attachable` | Create an attachment |
| `get_attachable` | Get attachment by ID |
| `update_attachable` | Update attachment |
| `delete_attachable` | Delete an attachment |
| `search_attachables` | Search attachments |

</details>

---

## Authentication

This server uses OAuth 2.0 to authenticate to a QuickBooks Online company. You'll set up an app on the [Intuit Developer Portal](https://developer.intuit.com/) and connect it to either a **sandbox** (for development) or your **production** QBO company.

### Important: Sandbox vs Production

| Mode | When to use | Redirect URI accepted | Setup difficulty |
|------|-------------|------------------------|------------------|
| **Sandbox** | Development, testing, demos | `http://localhost:8000/callback` works | Easy |
| **Production** | Real company data | Localhost **rejected** — must be a public HTTPS URL | Harder (see below) |

If you only want to read your own company's data, you still need to set up an app — Intuit does not offer per-user API keys. There is no shortcut around the OAuth + app-creation flow.

### Sandbox Setup (recommended for first run)

1. Go to the [Intuit Developer Portal](https://developer.intuit.com/) and create a new app
2. Open the app → **Settings** (left sidebar) → **Redirect URIs** → add: `http://localhost:8000/callback`
3. Get your **Client ID** and **Client Secret** from the app's **Keys & Credentials** page (Development keys)
4. Create or use a sandbox company under the **Sandbox** top-level menu item in the dev portal
5. Set `QUICKBOOKS_ENVIRONMENT=sandbox` in your `.env`
6. Run `npm run auth` to complete the OAuth handshake — your browser will open, you sign in to the sandbox company, tokens are saved to `.env`

### Production Setup

The Intuit Developer Portal **rejects `http://localhost` redirect URIs in production mode** — every contributor hits this. Two known workarounds:

1. **ngrok tunnel (most common):** run `ngrok http 8000`, then on your Intuit app go to **Settings → Redirect URIs** and add the generated `https://<id>.ngrok-free.app/callback` URL. Use that URL for the OAuth handshake, then revert to localhost afterwards.
2. **Deploy a small public callback handler** (e.g., on a VPS or serverless function) that captures the auth code and hands it back to your local setup. More involved; only needed if you can't use ngrok.

After completing the production OAuth handshake, the refresh token is what matters — once it's in `.env`, you no longer need the public redirect URL for day-to-day use. Refresh tokens auto-rotate; the server persists the new token on each refresh.

### Once you have tokens

```env
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REFRESH_TOKEN=your_refresh_token
QUICKBOOKS_REALM_ID=your_realm_id
QUICKBOOKS_ENVIRONMENT=sandbox  # or 'production'
```

### Common pitfalls

- **`.env` loaded from the wrong directory.** The server resolves `.env` relative to the compiled module, not your shell's CWD. If you launch via Claude Desktop, this matters — make sure you're on current `main`.
- **Redirect URI mismatch.** The URI you register in the Intuit portal must match **exactly** — protocol, host, port, path. `http://localhost:8000/callback` .

---

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

The test suite includes **396 tests** with **100% code coverage** across all metrics (statements, branches, functions, lines).

### Project Structure

```
src/
├── clients/          # QuickBooks API client
├── handlers/         # Business logic handlers (87 files)
├── tools/           # MCP tool definitions
├── helpers/         # Utility functions
├── types/           # TypeScript types
└── index.ts         # Server entry point

tests/
├── unit/            # Unit tests (396 tests)
│   ├── handlers/    # Handler tests (15 test files)
│   └── helpers/     # Helper tests
└── mocks/           # Test mocks

docs/
├── ARCHITECTURE.md  # System architecture & design patterns
├── TESTING.md       # Testing guide & patterns
└── plans/           # Development plans
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Version history and all changes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, patterns, and design decisions |
| [docs/TESTING.md](docs/TESTING.md) | Testing strategy, ESM patterns, and coverage guide |

---

## Error Handling

If you encounter connection errors:

1. Verify all environment variables are set correctly
2. Check that tokens are valid and not expired
3. Ensure the QuickBooks app has the correct redirect URIs
4. For sandbox testing, use `QUICKBOOKS_ENVIRONMENT=sandbox`

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Based on [Intuit's QuickBooks Online MCP Server](https://github.com/intuit/quickbooks-online-mcp-server)
- Built with the [Model Context Protocol](https://modelcontextprotocol.io/)
