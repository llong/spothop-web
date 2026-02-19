import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService, blockService } from '../chatService';
import supabase from '@/supabase';

vi.mock('@/supabase', () => ({
    default: {
        from: vi.fn(),
        rpc: vi.fn(),
    }
}));

describe('chatService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchConversations', () => {
        it('returns empty array when user has no conversations', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockResolvedValue({ data: [], error: null })
            } as any);

            const result = await chatService.fetchConversations('u1');
            expect(result).toEqual([]);
        });

        it('fetches and enriches conversations', async () => {
            const mockParticipation = [{ conversation_id: 'c1' }];
            const mockConversations = [{
                id: 'c1',
                conversation_participants: [{ user_id: 'u1' }, { user_id: 'u2' }],
                messages: [{ id: 'm1', content: 'hi', sender_id: 'u2', is_read: false, created_at: new Date().toISOString() }]
            }];
            const mockProfiles = [
                { id: 'u1', username: 'user1' },
                { id: 'u2', username: 'user2' }
            ];

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockImplementation((table: string) => {
                if (table === 'conversation_participants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockResolvedValue({ data: mockParticipation, error: null })
                    } as any;
                }
                if (table === 'conversations') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue({ data: mockConversations, error: null })
                    } as any;
                }
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
                    } as any;
                }
                return {} as any;
            });

            const result = await chatService.fetchConversations('u1');
            expect(result).toHaveLength(1);
            expect(result[0].unreadCount).toBe(1);
            expect(result[0].participants[1].profile.username).toBe('user2');
        });
    });

    describe('sendMessage', () => {
        it('inserts message and returns it', async () => {
            const mockMessage = { id: 'm1', content: 'test' };
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockMessage, error: null })
            } as any);

            const result = await chatService.sendMessage('c1', 'u1', 'test');
            expect(result).toEqual(mockMessage);
        });
    });

    describe('getOrCreate1on1', () => {
        it('returns existing conversation id from rpc', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({ data: 'c1', error: null } as any);
            const result = await chatService.getOrCreate1on1('u1', 'u2');
            expect(result).toBe('c1');
        });

        it('creates new conversation if none exists', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'new-c1' }, error: null }),
                eq: vi.fn().mockReturnThis(),
                // For the subsequent inserts
                then: (cb: any) => Promise.resolve(cb({ data: [], error: null }))
            } as any);

            const result = await chatService.getOrCreate1on1('u1', 'u2');
            expect(result).toBe('new-c1');
        });
    });
});

describe('blockService', () => {
    it('blocks a user', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            insert: vi.fn().mockResolvedValue({ error: null })
        } as any);

        await blockService.blockUser('u1', 'u2');
        expect(mockFrom).toHaveBeenCalledWith('user_blocks');
    });

    it('unblocks a user', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve(cb({ error: null }))
        } as any);

        await blockService.unblockUser('u1', 'u2');
        expect(mockFrom).toHaveBeenCalledWith('user_blocks');
    });
});
