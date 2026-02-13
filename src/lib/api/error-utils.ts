/**
 * Extract error message from various backend error response formats.
 * Handles FastAPI, custom error schemas, and plain string errors.
 */
export function extractErrorMessage(
  errorData: unknown,
  fallback: string = 'An error occurred'
): string {
  if (!errorData) {
    return fallback;
  }

  // Already a string
  if (typeof errorData === 'string') {
    return errorData;
  }

  // Error object
  if (errorData instanceof Error) {
    return errorData.message || fallback;
  }

  // Not an object, convert to string
  if (typeof errorData !== 'object') {
    return String(errorData) || fallback;
  }

  // Handle object with various error formats
  const obj = errorData as Record<string, unknown>;

  // FastAPI format: { detail: "..." }
  if (typeof obj.detail === 'string') {
    return obj.detail;
  }

  // Custom error format: { error: { message: "..." } }
  if (obj.error && typeof obj.error === 'object') {
    const errorObj = obj.error as Record<string, unknown>;
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }

  // Direct error format: { error: "..." }
  if (typeof obj.error === 'string') {
    return obj.error;
  }

  // Direct message format: { message: "..." }
  if (typeof obj.message === 'string') {
    return obj.message;
  }

  // Fallback: try to stringify (but keep it short)
  try {
    const str = JSON.stringify(obj);
    return str.length > 200 ? `${str.slice(0, 200)}...` : str;
  } catch {
    return fallback;
  }
}
