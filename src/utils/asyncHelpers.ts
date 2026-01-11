export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<{ data?: T; error?: string }> => {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const message = (error as Error)?.message || 'An unexpected error occurred';
    errorHandler?.(error as Error);
    return { error: message };
  }
};