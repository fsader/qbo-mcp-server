/**
 * Normalise the `criteria` argument shared by the criteria-based search tools
 * (search_accounts, search_items, search_invoices).
 *
 * These tools historically rejected an empty call (`{}`) because their runtime
 * validation only accepts an object or an array — never `undefined`. Callers
 * therefore had to pass `criteria: []` explicitly just to "list everything".
 *
 * This helper makes the ergonomic default explicit: a missing/empty criteria
 * resolves to `[]`, which every search handler treats as "no filter, return
 * all". Any caller-supplied value is passed through untouched so existing
 * filtering behaviour is preserved.
 */
export function resolveSearchCriteria(criteria?: unknown): unknown {
  if (criteria === undefined || criteria === null) {
    return [];
  }
  return criteria;
}
