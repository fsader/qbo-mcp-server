export function formatError(error: unknown): string {
  // node-quickbooks surfaces QBO REST faults as axios-style errors whose
  // `.message` is only the generic "Request failed with status code 400".
  // The actionable detail lives in `error.response.data.Fault`, so dig it out
  // when present before falling back to the plain message.
  const anyErr = error as any;
  const fault = anyErr?.response?.data?.Fault ?? anyErr?.Fault ?? anyErr?.fault;
  if (fault) {
    try {
      return JSON.stringify(fault);
    } catch {
      /* fall through */
    }
  }
  const data = anyErr?.response?.data;
  if (data) {
    try {
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      /* fall through */
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
