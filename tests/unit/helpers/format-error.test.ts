import { formatError } from '../../../src/helpers/format-error';

describe('formatError', () => {
  it('returns the bare message for Error instances', () => {
    expect(formatError(new Error('Something went wrong'))).toBe(
      'Something went wrong'
    );
  });

  it('returns string inputs unchanged', () => {
    expect(formatError('A string error')).toBe('A string error');
  });

  it('surfaces a QBO REST Fault nested under response.data.Fault', () => {
    // node-quickbooks/axios shape: the generic ".message" is useless; the
    // actionable detail lives in response.data.Fault.
    const fault = {
      Error: [{ Message: 'Invalid Reference Id', code: '610' }],
      type: 'ValidationFault',
    };
    const err = {
      message: 'Request failed with status code 400',
      response: { data: { Fault: fault } },
    };
    expect(formatError(err)).toBe(JSON.stringify(fault));
  });

  it('surfaces a top-level Fault', () => {
    const fault = { type: 'AuthenticationFault' };
    expect(formatError({ Fault: fault })).toBe(JSON.stringify(fault));
  });

  it('returns response.data when it is a string', () => {
    expect(formatError({ response: { data: 'Bad Request' } })).toBe(
      'Bad Request'
    );
  });

  it('stringifies response.data when it is an object without a Fault', () => {
    const data = { warnings: ['rate limit near'] };
    expect(formatError({ response: { data } })).toBe(JSON.stringify(data));
  });

  it('falls back to String() for primitive and nullish inputs', () => {
    expect(formatError(null)).toBe('null');
    expect(formatError(undefined)).toBe('undefined');
    expect(formatError(404)).toBe('404');
  });
});
