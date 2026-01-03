import { renderHook, act } from '@testing-library/react';
import { useComments } from '../useComments';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import supabase from 'src/supabase';
import { useAtomValue } from 'jotai';

// Mock dependencies
vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            single: vi.fn(),
            upsert: vi.fn(),
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

describe('useComments hook', () => {
    const spotId = 'spot123';
    const mockUser = { user: { id: 'user1' } };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAtomValue as any).mockReturnValue(mockUser);
    });

    it('fetches and formats comments correctly', async () => {
        const mockCommentsData = [
            { id: 'c1', content: 'Root', user_id: 'user1', created_at: '2025-01-02', comment_reactions: [] },
            { id: 'c2', content: 'Reply', user_id: 'user2', parent_id: 'c1', created_at: '2025-01-03', comment_reactions: [] }
        ];

        const mockProfiles = [
            { id: 'user1', username: 'userone' },
            { id: 'user2', username: 'usertwo' }
        ];

        const mockFrom = supabase.from as any;
        mockFrom.mockImplementation((table: string) => {
            if (table === 'spot_comments') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: mockCommentsData, error: null })
                };
            }
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnThis(),
                    in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
                };
            }
            return {};
        });

        const { result } = renderHook(() => useComments(spotId));

        await act(async () => {
            await result.current.fetchComments();
        });

        expect(result.current.comments).toHaveLength(1); // Only 1 root comment
        expect(result.current.comments[0]!.replies!).toHaveLength(1);
        expect(result.current.comments[0]!.author!.username).toBe('userone');
    });

    it('adds a comment successfully', async () => {
        const mockInsert = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new' }, error: null });
        (supabase.from as any).mockReturnValue({
            insert: mockInsert,
            select: vi.fn().mockReturnThis(),
            single: mockSingle,
            // Also need to handle the fetchComments call inside addComment
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
        });

        const { result } = renderHook(() => useComments(spotId));

        let response: any;
        await act(async () => {
            response = await result.current.addComment('New comment');
        });

        expect(response?.success).toBe(true);
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            content: 'New comment',
            spot_id: spotId,
            user_id: 'user1'
        }));
    });

    it('deletes a comment successfully', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({
            delete: mockDelete,
            eq: mockEq,
            // Mocking fetchComments part
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
        });

        const { result } = renderHook(() => useComments(spotId));

        let response: any;
        await act(async () => {
            response = await result.current.deleteComment('c1');
        });

        expect(response?.success).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith('id', 'c1');
    });
});
