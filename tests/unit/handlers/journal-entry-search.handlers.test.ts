import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockQuickbooksClient, mockQuickBooksInstance, resetAllMocks } from '../../mocks/quickbooks.mock';

// ESM-compatible module mocking
jest.unstable_mockModule('../../../src/clients/quickbooks-client', () => ({
  quickbooksClient: mockQuickbooksClient,
}));

const { searchQuickbooksJournalEntries } = await import('../../../src/handlers/search-quickbooks-journal-entries.handler');

describe('search_journal_entries handler', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should return the SDK result on success', async () => {
    const mockResponse = { QueryResponse: { JournalEntry: [{ Id: '1' }], totalCount: 1 } };
    (mockQuickBooksInstance.findJournalEntries as jest.Mock).mockImplementation(
      (_criteria: any, cb: any) => cb(null, mockResponse)
    );

    const result = await searchQuickbooksJournalEntries({});

    expect(result.isError).toBe(false);
    expect(result.result).toEqual(mockResponse);
  });

  it('should strip the unsupported count flag before querying (QBO 400 guard)', async () => {
    let captured: any;
    (mockQuickBooksInstance.findJournalEntries as jest.Mock).mockImplementation(
      (criteria: any, cb: any) => {
        captured = criteria;
        cb(null, { QueryResponse: {} });
      }
    );

    const result = await searchQuickbooksJournalEntries({ count: true, limit: 5 });

    expect(result.isError).toBe(false);
    const flat = JSON.stringify(captured);
    expect(flat).not.toContain('count');
    expect(flat).toContain('limit');
  });

  it('should tolerate being called with no params at all', async () => {
    (mockQuickBooksInstance.findJournalEntries as jest.Mock).mockImplementation(
      (_criteria: any, cb: any) => cb(null, { QueryResponse: {} })
    );

    const result = await searchQuickbooksJournalEntries(undefined);

    expect(result.isError).toBe(false);
  });

  it('should handle API errors', async () => {
    (mockQuickBooksInstance.findJournalEntries as jest.Mock).mockImplementation(
      (_criteria: any, cb: any) => cb(new Error('API Error'), null)
    );

    const result = await searchQuickbooksJournalEntries({});

    expect(result.isError).toBe(true);
  });

  it('should handle authentication errors', async () => {
    (mockQuickbooksClient.authenticate as any).mockRejectedValue(new Error('Auth failed'));

    const result = await searchQuickbooksJournalEntries({});

    expect(result.isError).toBe(true);
    expect(result.error).toContain('Auth failed');
  });
});
