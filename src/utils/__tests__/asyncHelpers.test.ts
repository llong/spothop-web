import { describe, it, expect, vi } from 'vitest';
import { withErrorHandling } from '../asyncHelpers';

describe('asyncHelpers', () => {
    describe('withErrorHandling', () => {
        it('returns data on successful operation', async () => {
            const operation = vi.fn().mockResolvedValue('success-data');
            const result = await withErrorHandling(operation);

            expect(result.data).toBe('success-data');
            expect(result.error).toBeUndefined();
        });

        it('returns error message on failed operation', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('failed-error'));
            const result = await withErrorHandling(operation);

            expect(result.data).toBeUndefined();
            expect(result.error).toBe('failed-error');
        });

        it('calls custom errorHandler on failure', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('failed-error'));
            const errorHandler = vi.fn();
            await withErrorHandling(operation, errorHandler);

            expect(errorHandler).toHaveBeenCalled();
        });
    });
});
