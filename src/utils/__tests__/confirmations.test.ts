import { describe, it, expect, vi } from 'vitest';
import { confirmAction } from '../confirmations';

describe('confirmAction', () => {
    it('returns true when window.confirm is true', async () => {
        window.confirm = vi.fn().mockReturnValue(true);
        const result = await confirmAction('test message');
        expect(result).toBe(true);
        expect(window.confirm).toHaveBeenCalledWith('test message');
    });

    it('returns false when window.confirm is false', async () => {
        window.confirm = vi.fn().mockReturnValue(false);
        const result = await confirmAction('test message');
        expect(result).toBe(false);
    });
});
