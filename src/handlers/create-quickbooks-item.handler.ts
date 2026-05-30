import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";

export interface CreateItemInput {
  name: string;
  type: string; // Service, Inventory, NonInventory, etc.
  income_account_ref: string; // account id
  expense_account_ref?: string; // account id (COGS for inventory)
  unit_price?: number;
  description?: string;
  // Inventory-specific fields. Required by QBO when type === "Inventory".
  sku?: string;
  asset_account_ref?: string; // Inventory Asset account id
  purchase_cost?: number; // "Cost" per unit
  track_qty_on_hand?: boolean;
  qty_on_hand?: number;
  inv_start_date?: string; // YYYY-MM-DD
  sales_tax_code_ref?: string; // e.g. "NON"
  purchase_tax_code_ref?: string; // e.g. "NON"
  taxable?: boolean;
}

export async function createQuickbooksItem(data: CreateItemInput): Promise<ToolResponse<any>> {
  try {
    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();

    const payload: any = {
      Name: data.name,
      Type: data.type,
      IncomeAccountRef: { value: data.income_account_ref },
      ExpenseAccountRef: data.expense_account_ref ? { value: data.expense_account_ref } : undefined,
      UnitPrice: data.unit_price,
      Description: data.description,
      Sku: data.sku,
      PurchaseCost: data.purchase_cost,
      AssetAccountRef: data.asset_account_ref ? { value: data.asset_account_ref } : undefined,
      TrackQtyOnHand: data.track_qty_on_hand,
      QtyOnHand: data.qty_on_hand,
      InvStartDate: data.inv_start_date,
      SalesTaxCodeRef: data.sales_tax_code_ref ? { value: data.sales_tax_code_ref } : undefined,
      PurchaseTaxCodeRef: data.purchase_tax_code_ref ? { value: data.purchase_tax_code_ref } : undefined,
      Taxable: data.taxable,
    };

    // Drop undefined keys so we never send empty refs to QBO.
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    return new Promise((resolve) => {
      (quickbooks as any).createItem(payload, (err: any, item: any) => {
        if (err) resolve({ result: null, isError: true, error: formatError(err) });
        else resolve({ result: item, isError: false, error: null });
      });
    });
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
