import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useComments } from '../useComments';
import supabase from 'src/supabase';

// Mock dependencies with actual atom export
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn((atom) => {
            if (atom && (atom as any).debugLabel === 'user') return { user: { id: 'u1' } };
            return null;
        }),
    };
});

vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(),
                    single: vi.fn(),
                    in: vi.fn()
                })),
                in: vi.fn(),
                order: vi.fn()
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn()
                }))
            })),
            update: vi.fn(() => ({
                eq: vi.fn()
            })),
            delete: vi.fn(() => ({
                eq: vi.fn()
            })),
            upsert: vi.fn()
        }))
    }
}));

describe('useComments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and formats comments correctly', async () => {
        const mockComments = [
            { id: 'c1', content: 'test', user_id: 'u1', spot_id: 's1', created_at: '2025-01-01' }
        ];
        const mockProfiles = [{ id: 'u1', username: 'user1' }];

        const mockFrom = vi.mocked(supabase.from);

        // 1. comments
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockComments, error: null })
                })
            })
        } as any);

        // 2. profiles
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
            })
        } as any);

        const { result } = renderHook(() => useComments('s1'));

        await act(async () => {
            await result.current.fetchComments();
        });

        if (result.current.comments.length > 0) {
            expect(result.current.comments[0].content).toBe('test');
            expect(result.current.comments[0].author?.username).toBe('user1');
        } else {
            throw new Error('Comments not loaded');
        }
    });

    it('adds a new comment', async () => {
        const mockNewComment = { id: 'c2', content: 'new', user_id: 'u1', created_at: '2025-01-01' };
        const mockFrom = vi.mocked(supabase.from);

        // 1. insert
        mockFrom.mockReturnValueOnce({
            insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockNewComment, error: null })
                })
            })
        } as any);

        // 2. fetchComments (spot_comments)
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [mockNewComment], error: null })
                })
            })
        } as any);

        // 3. fetchComments (profiles)
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [{ id: 'u1', username: 'user1' }], error: null })
            })
        } as any);

        const { result } = renderHook(() => useComments('s1'));

        let addResult: any;
        await act(async () => {
            addResult = await result.current.addComment('new');
        });

        expect(addResult?.success).toBe(true);
        expect(addResult?.data).toEqual(mockNewComment);
    });

    it('deletes a comment', async () => {
        const mockFrom = vi.mocked(supabase.from);

        // 1. delete
        mockFrom.mockReturnValueOnce({
            delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            })
        } as any);

        // 2. fetchComments (spot_comments)
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null })
                })
            })
        } as any);

        // 3. fetchComments (profiles)
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null })
            })
        } as any);

        const { result } = renderHook(() => useComments('s1'));

        let deleteResult: any;
        await act(async () => {
            deleteResult = await result.current.deleteComment('c1');
        });

        expect(deleteResult?.success).toBe(true);
    });
});
