import { renderHook, act } from '@testing-library/react';
import { useFlagging } from '../useFlagging';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import supabase from 'src/supabase';
import { useAtomValue } from 'jotai';

// Mock dependencies
vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            insert: vi.fn(),
        })),
    },
}));

vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn(),
    };
});

describe('useFlagging hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAtomValue).mockReturnValue({ user: { id: 'test-user-id' } });
    });

    it('submits a flag successfully', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useFlagging());

        let success;
        await act(async () => {
            success = await result.current.flagSpot('123', 'inappropriate_content', 'details');
        });

        expect(success).toBe(true);
        expect(mockInsert).toHaveBeenCalledWith({
            spot_id: '123',
            user_id: 'test-user-id',
            reason: 'inappropriate_content',
            details: 'details'
        });
        expect(result.current.error).toBeNull();
    });

    it('handles "Other" reason without details', async () => {
        const { result } = renderHook(() => useFlagging());

        let success;
        await act(async () => {
            success = await result.current.flagSpot('123', 'other', '');
        });

        expect(success).toBe(false);
        expect(result.current.error).toContain('Please provide details for choosing "Other"');
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('handles duplicate flagging error', async () => {
        const mockInsert = vi.fn().mockResolvedValue({
            error: { code: '23505', message: 'Unique constraint violation' }
        });
        (supabase.from as any).mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useFlagging());

        let success;
        await act(async () => {
            success = await result.current.flagSpot('123', 'duplicate_spot');
        });

        expect(success).toBe(false);
        expect(result.current.error).toContain('already reported this spot');
    });

    it('handles general API errors', async () => {
        const mockInsert = vi.fn().mockResolvedValue({
            error: { message: 'Some database error' }
        });
        (supabase.from as any).mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useFlagging());

        let success;
        await act(async () => {
            success = await result.current.flagSpot('123', 'incorrect_information');
        });

        expect(success).toBe(false);
        expect(result.current.error).toBe('Some database error');
    });

    it('requires login', async () => {
        // Re-mocking useAtomValue for this specific test
        const { useAtomValue } = await import('jotai');
        vi.mocked(useAtomValue).mockReturnValueOnce(null);

        const { result } = renderHook(() => useFlagging());

        let success;
        await act(async () => {
            success = await result.current.flagSpot('123', 'inappropriate_content');
        });

        expect(success).toBe(false);
        expect(result.current.error).toContain('must be logged in');
    });
});
