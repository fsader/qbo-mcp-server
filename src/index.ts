#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { QuickbooksMCPServer } from "./server/qbo-mcp-server.js";
// import { ListInvoicesTool } from "./tools/list-invoices.tool.js";
// import { CreateCustomerTool } from "./tools/create-customer.tool.js";
import { CreateInvoiceTool } from "./tools/create-invoice.tool.js";
import { RegisterTool } from "./helpers/register-tool.js";
import {
  loadToolModeConfig,
  isToolAllowed,
} from "./helpers/tool-mode.js";
import { ReadInvoiceTool } from "./tools/read-invoice.tool.js";
import { SearchInvoicesTool } from "./tools/search-invoices.tool.js";
import { UpdateInvoiceTool } from "./tools/update-invoice.tool.js";
import { CreateAccountTool } from "./tools/create-account.tool.js";
import { UpdateAccountTool } from "./tools/update-account.tool.js";
import { SearchAccountsTool } from "./tools/search-accounts.tool.js";
import { ReadItemTool } from "./tools/read-item.tool.js";
import { SearchItemsTool } from "./tools/search-items.tool.js";
import { CreateItemTool } from "./tools/create-item.tool.js";
import { UpdateItemTool } from "./tools/update-item.tool.js";
import { DeleteItemTool } from "./tools/delete-item.tool.js";
import { GetAccountTool } from "./tools/get-account.tool.js";
import { DeleteInvoiceTool } from "./tools/delete-invoice.tool.js";
// import { ListAccountsTool } from "./tools/list-accounts.tool.js";
// import { UpdateCustomerTool } from "./tools/update-customer.tool.js";
import { CreateCustomerTool } from "./tools/create-customer.tool.js";
import { GetCustomerTool } from "./tools/get-customer.tool.js";
import { UpdateCustomerTool } from "./tools/update-customer.tool.js";
import { DeleteCustomerTool } from "./tools/delete-customer.tool.js";
import { CreateEstimateTool } from "./tools/create-estimate.tool.js";
import { GetEstimateTool } from "./tools/get-estimate.tool.js";
import { UpdateEstimateTool } from "./tools/update-estimate.tool.js";
import { DeleteEstimateTool } from "./tools/delete-estimate.tool.js";
import { SearchCustomersTool } from "./tools/search-customers.tool.js";
import { SearchEstimatesTool } from "./tools/search-estimates.tool.js";
import { CreateBillTool } from "./tools/create-bill.tool.js";
import { UpdateBillTool } from "./tools/update-bill.tool.js";
import { DeleteBillTool } from "./tools/delete-bill.tool.js";
import { GetBillTool } from "./tools/get-bill.tool.js";
import { CreateVendorTool } from "./tools/create-vendor.tool.js";
import { UpdateVendorTool } from "./tools/update-vendor.tool.js";
import { DeleteVendorTool } from "./tools/delete-vendor.tool.js";
import { GetVendorTool } from "./tools/get-vendor.tool.js";
import { SearchBillsTool } from "./tools/search-bills.tool.js";
import { SearchVendorsTool } from "./tools/search-vendors.tool.js";

// Employee tools
import { CreateEmployeeTool } from "./tools/create-employee.tool.js";
import { GetEmployeeTool } from "./tools/get-employee.tool.js";
import { UpdateEmployeeTool } from "./tools/update-employee.tool.js";
import { SearchEmployeesTool } from "./tools/search-employees.tool.js";
import { DeleteEmployeeTool } from "./tools/delete-employee.tool.js";

// Journal Entry tools
import { CreateJournalEntryTool } from "./tools/create-journal-entry.tool.js";
import { GetJournalEntryTool } from "./tools/get-journal-entry.tool.js";
import { UpdateJournalEntryTool } from "./tools/update-journal-entry.tool.js";
import { DeleteJournalEntryTool } from "./tools/delete-journal-entry.tool.js";
import { SearchJournalEntriesTool } from "./tools/search-journal-entries.tool.js";

// Bill Payment tools
import { CreateBillPaymentTool } from "./tools/create-bill-payment.tool.js";
import { GetBillPaymentTool } from "./tools/get-bill-payment.tool.js";
import { UpdateBillPaymentTool } from "./tools/update-bill-payment.tool.js";
import { DeleteBillPaymentTool } from "./tools/delete-bill-payment.tool.js";
import { SearchBillPaymentsTool } from "./tools/search-bill-payments.tool.js";

// Purchase tools
import { CreatePurchaseTool } from "./tools/create-purchase.tool.js";
import { GetPurchaseTool } from "./tools/get-purchase.tool.js";
import { UpdatePurchaseTool } from "./tools/update-purchase.tool.js";
import { DeletePurchaseTool } from "./tools/delete-purchase.tool.js";
import { SearchPurchasesTool } from "./tools/search-purchases.tool.js";

// Payment tools
import { CreatePaymentTool } from "./tools/create-payment.tool.js";
import { GetPaymentTool } from "./tools/get-payment.tool.js";
import { UpdatePaymentTool } from "./tools/update-payment.tool.js";
import { DeletePaymentTool } from "./tools/delete-payment.tool.js";
import { SearchPaymentsTool } from "./tools/search-payments.tool.js";

// Sales Receipt tools
import { CreateSalesReceiptTool } from "./tools/create-sales-receipt.tool.js";
import { GetSalesReceiptTool } from "./tools/get-sales-receipt.tool.js";
import { UpdateSalesReceiptTool } from "./tools/update-sales-receipt.tool.js";
import { DeleteSalesReceiptTool } from "./tools/delete-sales-receipt.tool.js";
import { SearchSalesReceiptsTool } from "./tools/search-sales-receipts.tool.js";

// Credit Memo tools
import { CreateCreditMemoTool } from "./tools/create-credit-memo.tool.js";
import { GetCreditMemoTool } from "./tools/get-credit-memo.tool.js";
import { UpdateCreditMemoTool } from "./tools/update-credit-memo.tool.js";
import { DeleteCreditMemoTool } from "./tools/delete-credit-memo.tool.js";
import { SearchCreditMemosTool } from "./tools/search-credit-memos.tool.js";

// Refund Receipt tools
import { CreateRefundReceiptTool } from "./tools/create-refund-receipt.tool.js";
import { GetRefundReceiptTool } from "./tools/get-refund-receipt.tool.js";
import { UpdateRefundReceiptTool } from "./tools/update-refund-receipt.tool.js";
import { DeleteRefundReceiptTool } from "./tools/delete-refund-receipt.tool.js";
import { SearchRefundReceiptsTool } from "./tools/search-refund-receipts.tool.js";

// Purchase Order tools
import { CreatePurchaseOrderTool } from "./tools/create-purchase-order.tool.js";
import { GetPurchaseOrderTool } from "./tools/get-purchase-order.tool.js";
import { UpdatePurchaseOrderTool } from "./tools/update-purchase-order.tool.js";
import { DeletePurchaseOrderTool } from "./tools/delete-purchase-order.tool.js";
import { SearchPurchaseOrdersTool } from "./tools/search-purchase-orders.tool.js";

// Vendor Credit tools
import { CreateVendorCreditTool } from "./tools/create-vendor-credit.tool.js";
import { GetVendorCreditTool } from "./tools/get-vendor-credit.tool.js";
import { UpdateVendorCreditTool } from "./tools/update-vendor-credit.tool.js";
import { DeleteVendorCreditTool } from "./tools/delete-vendor-credit.tool.js";
import { SearchVendorCreditsTool } from "./tools/search-vendor-credits.tool.js";

// Deposit tools
import { CreateDepositTool } from "./tools/create-deposit.tool.js";
import { GetDepositTool } from "./tools/get-deposit.tool.js";
import { UpdateDepositTool } from "./tools/update-deposit.tool.js";
import { DeleteDepositTool } from "./tools/delete-deposit.tool.js";
import { SearchDepositsTool } from "./tools/search-deposits.tool.js";

// Transfer tools
import { CreateTransferTool } from "./tools/create-transfer.tool.js";
import { GetTransferTool } from "./tools/get-transfer.tool.js";
import { UpdateTransferTool } from "./tools/update-transfer.tool.js";
import { DeleteTransferTool } from "./tools/delete-transfer.tool.js";
import { SearchTransfersTool } from "./tools/search-transfers.tool.js";

// Time Activity tools
import { CreateTimeActivityTool } from "./tools/create-time-activity.tool.js";
import { GetTimeActivityTool } from "./tools/get-time-activity.tool.js";
import { UpdateTimeActivityTool } from "./tools/update-time-activity.tool.js";
import { DeleteTimeActivityTool } from "./tools/delete-time-activity.tool.js";
import { SearchTimeActivitiesTool } from "./tools/search-time-activities.tool.js";

// Class tools
import { CreateClassTool } from "./tools/create-class.tool.js";
import { GetClassTool } from "./tools/get-class.tool.js";
import { UpdateClassTool } from "./tools/update-class.tool.js";
import { SearchClassesTool } from "./tools/search-classes.tool.js";

// Department tools
import { CreateDepartmentTool } from "./tools/create-department.tool.js";
import { GetDepartmentTool } from "./tools/get-department.tool.js";
import { UpdateDepartmentTool } from "./tools/update-department.tool.js";
import { SearchDepartmentsTool } from "./tools/search-departments.tool.js";

// Term tools
import { CreateTermTool } from "./tools/create-term.tool.js";
import { GetTermTool } from "./tools/get-term.tool.js";
import { UpdateTermTool } from "./tools/update-term.tool.js";
import { SearchTermsTool } from "./tools/search-terms.tool.js";

// Payment Method tools
import { CreatePaymentMethodTool } from "./tools/create-payment-method.tool.js";
import { GetPaymentMethodTool } from "./tools/get-payment-method.tool.js";
import { UpdatePaymentMethodTool } from "./tools/update-payment-method.tool.js";
import { SearchPaymentMethodsTool } from "./tools/search-payment-methods.tool.js";

// Budget tools (read-only in QBO v3 API)
import { SearchBudgetsTool } from "./tools/search-budgets.tool.js";

// Tax Code tools
import { GetTaxCodeTool } from "./tools/get-tax-code.tool.js";
import { SearchTaxCodesTool } from "./tools/search-tax-codes.tool.js";

// Tax Rate tools
import { GetTaxRateTool } from "./tools/get-tax-rate.tool.js";
import { SearchTaxRatesTool } from "./tools/search-tax-rates.tool.js";

// Tax Agency tools
import { GetTaxAgencyTool } from "./tools/get-tax-agency.tool.js";
import { SearchTaxAgenciesTool } from "./tools/search-tax-agencies.tool.js";

// Company Info tools
import { GetCompanyInfoTool } from "./tools/get-company-info.tool.js";
import { UpdateCompanyInfoTool } from "./tools/update-company-info.tool.js";

// Attachable tools
import { CreateAttachableTool } from "./tools/create-attachable.tool.js";
import { GetAttachableTool } from "./tools/get-attachable.tool.js";
import { UpdateAttachableTool } from "./tools/update-attachable.tool.js";
import { DeleteAttachableTool } from "./tools/delete-attachable.tool.js";
import { SearchAttachablesTool } from "./tools/search-attachables.tool.js";

// Financial Report tools
import { GetBalanceSheetTool } from "./tools/get-balance-sheet.tool.js";
import { GetProfitAndLossTool } from "./tools/get-profit-and-loss.tool.js";
import { GetCashFlowTool } from "./tools/get-cash-flow.tool.js";
import { GetTrialBalanceTool } from "./tools/get-trial-balance.tool.js";
import { GetGeneralLedgerTool } from "./tools/get-general-ledger.tool.js";

// Sales/AR Report tools
import { GetCustomerSalesTool } from "./tools/get-customer-sales.tool.js";
import { GetAgedReceivablesTool } from "./tools/get-aged-receivables.tool.js";
import { GetCustomerBalanceTool } from "./tools/get-customer-balance.tool.js";

// Expense/AP Report tools
import { GetAgedPayablesTool } from "./tools/get-aged-payables.tool.js";
import { GetVendorExpensesTool } from "./tools/get-vendor-expenses.tool.js";
import { GetVendorBalanceTool } from "./tools/get-vendor-balance.tool.js";

const main = async () => {
  // Create an MCP server
  const server = QuickbooksMCPServer.GetServer();

  // Safe tool gating: only register tools permitted by the current QBO_TOOL_MODE
  // (default: read). Delete tools require QBO_TOOL_MODE=all AND
  // QBO_ENABLE_DELETE_TOOLS=true. See src/helpers/tool-mode.ts.
  const toolConfig = loadToolModeConfig();
  const registeredTools: string[] = [];
  const skippedTools: string[] = [];

  const register = <T extends { name: string }>(tool: T) => {
    if (isToolAllowed(tool.name, toolConfig)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      RegisterTool(server, tool as any);
      registeredTools.push(tool.name);
    } else {
      skippedTools.push(tool.name);
    }
  };

  // Add tools for customers
  register(CreateCustomerTool);
  register(GetCustomerTool);
  register(UpdateCustomerTool);
  register(DeleteCustomerTool);
  register(SearchCustomersTool);
  // Add tools for estimates
  register(CreateEstimateTool);
  register(GetEstimateTool);
  register(UpdateEstimateTool);
  register(DeleteEstimateTool);
  register(SearchEstimatesTool);
  
  // Add tools for bills
  register(CreateBillTool);
  register(UpdateBillTool);
  register(DeleteBillTool);
  register(GetBillTool);
  register(SearchBillsTool);


  // Add tool to read a single invoice
  register(ReadInvoiceTool);

  // Add tool to search invoices
  register(SearchInvoicesTool);

  // Add tool to create invoice
  register(CreateInvoiceTool);

  // Add tool to update invoice
  register(UpdateInvoiceTool);
  register(DeleteInvoiceTool);

  // Chart of accounts tools
  register(CreateAccountTool);
  register(GetAccountTool);
  register(UpdateAccountTool);
  register(SearchAccountsTool);

  // Add tool to read item
  register(ReadItemTool);
  register(SearchItemsTool);
  register(CreateItemTool);
  register(UpdateItemTool);
  register(DeleteItemTool);

  // // Add a tool to create a customer
  // register(CreateCustomerTool);

  // // Add tool to list accounts
  // register(ListAccountsTool);

  // // Add tool to update a customer
  // register(UpdateCustomerTool);

  // Add tools for vendors
  register(CreateVendorTool);
  register(UpdateVendorTool);
  register(DeleteVendorTool);
  register(GetVendorTool);
  register(SearchVendorsTool);

  // Add tools for employees
  register(CreateEmployeeTool);
  register(GetEmployeeTool);
  register(UpdateEmployeeTool);
  register(DeleteEmployeeTool);
  register(SearchEmployeesTool);

  // Add tools for journal entries
  register(CreateJournalEntryTool);
  register(GetJournalEntryTool);
  register(UpdateJournalEntryTool);
  register(DeleteJournalEntryTool);
  register(SearchJournalEntriesTool);

  // Add tools for bill payments
  register(CreateBillPaymentTool);
  register(GetBillPaymentTool);
  register(UpdateBillPaymentTool);
  register(DeleteBillPaymentTool);
  register(SearchBillPaymentsTool);

  // Add tools for purchases
  register(CreatePurchaseTool);
  register(GetPurchaseTool);
  register(UpdatePurchaseTool);
  register(DeletePurchaseTool);
  register(SearchPurchasesTool);

  // Add tools for payments
  register(CreatePaymentTool);
  register(GetPaymentTool);
  register(UpdatePaymentTool);
  register(DeletePaymentTool);
  register(SearchPaymentsTool);

  // Add tools for sales receipts
  register(CreateSalesReceiptTool);
  register(GetSalesReceiptTool);
  register(UpdateSalesReceiptTool);
  register(DeleteSalesReceiptTool);
  register(SearchSalesReceiptsTool);

  // Add tools for credit memos
  register(CreateCreditMemoTool);
  register(GetCreditMemoTool);
  register(UpdateCreditMemoTool);
  register(DeleteCreditMemoTool);
  register(SearchCreditMemosTool);

  // Add tools for refund receipts
  register(CreateRefundReceiptTool);
  register(GetRefundReceiptTool);
  register(UpdateRefundReceiptTool);
  register(DeleteRefundReceiptTool);
  register(SearchRefundReceiptsTool);

  // Add tools for purchase orders
  register(CreatePurchaseOrderTool);
  register(GetPurchaseOrderTool);
  register(UpdatePurchaseOrderTool);
  register(DeletePurchaseOrderTool);
  register(SearchPurchaseOrdersTool);

  // Add tools for vendor credits
  register(CreateVendorCreditTool);
  register(GetVendorCreditTool);
  register(UpdateVendorCreditTool);
  register(DeleteVendorCreditTool);
  register(SearchVendorCreditsTool);

  // Add tools for deposits
  register(CreateDepositTool);
  register(GetDepositTool);
  register(UpdateDepositTool);
  register(DeleteDepositTool);
  register(SearchDepositsTool);

  // Add tools for transfers
  register(CreateTransferTool);
  register(GetTransferTool);
  register(UpdateTransferTool);
  register(DeleteTransferTool);
  register(SearchTransfersTool);

  // Add tools for time activities
  register(CreateTimeActivityTool);
  register(GetTimeActivityTool);
  register(UpdateTimeActivityTool);
  register(DeleteTimeActivityTool);
  register(SearchTimeActivitiesTool);

  // Add tools for classes
  register(CreateClassTool);
  register(GetClassTool);
  register(UpdateClassTool);
  register(SearchClassesTool);

  // Add tools for departments
  register(CreateDepartmentTool);
  register(GetDepartmentTool);
  register(UpdateDepartmentTool);
  register(SearchDepartmentsTool);

  // Add tools for terms
  register(CreateTermTool);
  register(GetTermTool);
  register(UpdateTermTool);
  register(SearchTermsTool);

  // Add tools for payment methods
  register(CreatePaymentMethodTool);
  register(GetPaymentMethodTool);
  register(UpdatePaymentMethodTool);
  register(SearchPaymentMethodsTool);

  // Add tools for budgets (read-only)
  register(SearchBudgetsTool);

  // Add tools for tax codes
  register(GetTaxCodeTool);
  register(SearchTaxCodesTool);

  // Add tools for tax rates
  register(GetTaxRateTool);
  register(SearchTaxRatesTool);

  // Add tools for tax agencies
  register(GetTaxAgencyTool);
  register(SearchTaxAgenciesTool);

  // Add tools for company info
  register(GetCompanyInfoTool);
  register(UpdateCompanyInfoTool);

  // Add tools for attachables
  register(CreateAttachableTool);
  register(GetAttachableTool);
  register(UpdateAttachableTool);
  register(DeleteAttachableTool);
  register(SearchAttachablesTool);

  // Add financial report tools
  register(GetBalanceSheetTool);
  register(GetProfitAndLossTool);
  register(GetCashFlowTool);
  register(GetTrialBalanceTool);
  register(GetGeneralLedgerTool);

  // Add sales/AR report tools
  register(GetCustomerSalesTool);
  register(GetAgedReceivablesTool);
  register(GetCustomerBalanceTool);

  // Add expense/AP report tools
  register(GetAgedPayablesTool);
  register(GetVendorExpensesTool);
  register(GetVendorBalanceTool);

  // Startup summary (stderr only — stdout is reserved for the MCP transport).
  console.error(
    `[qbo-mcp] QBO_TOOL_MODE=${toolConfig.mode} | ` +
      `delete tools enabled: ${toolConfig.enableDeleteTools} | ` +
      `registered: ${registeredTools.length} | skipped: ${skippedTools.length}`
  );
  if (toolConfig.allowedTools.size > 0) {
    console.error(
      `[qbo-mcp] QBO_ALLOWED_TOOLS active (${toolConfig.allowedTools.size} names) — ` +
        `intersected with mode rules.`
    );
  }
  // Debug/dev inspection of the full registered/skipped tool lists.
  if (["1", "true", "yes"].includes((process.env.QBO_DEBUG_TOOLS ?? "").toLowerCase())) {
    console.error(
      `[qbo-mcp] registered tools (${registeredTools.length}): ${[...registeredTools].sort().join(", ")}`
    );
    console.error(
      `[qbo-mcp] skipped tools (${skippedTools.length}): ${[...skippedTools].sort().join(", ")}`
    );
  }

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});