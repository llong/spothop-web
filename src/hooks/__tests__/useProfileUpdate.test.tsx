import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfileUpdate } from '../useProfileUpdate';
import { useQueryClient } from '@tanstack/react-query';
import supabase from '../../supabase';

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: vi.fn(),
    useMutation: vi.fn().mockImplementation((options) => {
        return {
            mutateAsync: options.mutationFn,
            onSuccess: options.onSuccess
        };
    })
}));

vi.mock('../../supabase', () => ({
    default: {
        from: vi.fn().mockReturnValue({
            upsert: vi.fn()
        })
    }
}));

describe('useProfileUpdate', () => {
    const mockInvalidateQueries = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useQueryClient as any).mockReturnValue({
            invalidateQueries: mockInvalidateQueries
        });
        
        // Mock the Date object to have a consistent date for tests
        const mockDate = new Date('2023-01-01T00:00:00.000Z');
        vi.setSystemTime(mockDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should successfully update profile', async () => {
        const mockUpsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

        const { result } = renderHook(() => useProfileUpdate());
        
        const updates = { id: 'user-1', name: 'Test User', followerCount: 5, followingCount: 10 };
        
        const res = await (result.current as any).mutateAsync(updates);
        
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(mockUpsert).toHaveBeenCalledWith({
            id: 'user-1',
            name: 'Test User',
            updatedAt: expect.any(Date)
        });
        
        // Follower counts should not be in the update
        expect(mockUpsert.mock.calls[0][0].followerCount).toBeUndefined();
        expect(mockUpsert.mock.calls[0][0].followingCount).toBeUndefined();
        
        // The return value is wrapped in withErrorHandling { data, error }
        expect(res).toEqual({ data: { id: 'user-1', name: 'Test User', followerCount: 5, followingCount: 10 } });
    });

    it('should throw error if upsert fails', async () => {
        const mockError = new Error('Upsert failed');
        const mockUpsert = vi.fn().mockResolvedValue({ error: mockError });
        (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

        const { result } = renderHook(() => useProfileUpdate());
        
        const res = await (result.current as any).mutateAsync({ id: 'user-1', name: 'Test User' });
        
        expect(res).toEqual({ error: 'Upsert failed' });
    });

    it('should invalidate queries on success', () => {
        const { result } = renderHook(() => useProfileUpdate());
        
        (result.current as any).onSuccess(null, { id: 'user-1' });
        
        expect(mockInvalidateQueries).toHaveBeenCalledTimes(3);
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile', 'detail', 'user-1'] });
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile', 'social', 'user-1'] });
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile', 'content', 'user-1'] });
    });

    it('should not invalidate queries if no userId is provided', () => {
        const { result } = renderHook(() => useProfileUpdate());
        
        (result.current as any).onSuccess(null, { name: 'Test User' });
        
        expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
});
