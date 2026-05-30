import { describe, it, expect } from '@jest/globals';
import { resolveSearchCriteria } from '../../../src/helpers/resolve-search-criteria';

/**
 * Ergonomics fix: search_accounts, search_items and search_invoices must accept
 * an empty call ({}) and default internally to `criteria: []` (list all), rather
 * than rejecting the request because `criteria` was undefined.
 */
describe('resolveSearchCriteria', () => {
  it('defaults undefined criteria (the {} call) to an empty array', () => {
    expect(resolveSearchCriteria(undefined)).toEqual([]);
  });

  it('defaults null criteria to an empty array', () => {
    expect(resolveSearchCriteria(null)).toEqual([]);
  });

  it('passes an explicit empty array through unchanged', () => {
    const input: unknown[] = [];
    expect(resolveSearchCriteria(input)).toBe(input);
  });

  it('passes a caller-supplied filter array through unchanged', () => {
    const input = [{ field: 'Active', value: true, operator: '=' }];
    expect(resolveSearchCriteria(input)).toBe(input);
  });

  it('passes a caller-supplied criteria object through unchanged', () => {
    const input = { Name: 'Cash' };
    expect(resolveSearchCriteria(input)).toBe(input);
  });
});
