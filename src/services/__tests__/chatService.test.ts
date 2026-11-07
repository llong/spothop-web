import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService, blockService } from '@/services/chatService';
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
            vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as any);

            const result = await chatService.fetchConversations('u1');
            expect(result).toEqual([]);
            expect(supabase.rpc).toHaveBeenCalledWith('get_inbox_summary');
        });

        it('throws when the inbox summary RPC fails', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('boom') } as any);
            await expect(chatService.fetchConversations('u1')).rejects.toThrow('boom');
        });

        it('fetches and enriches conversations without loading all messages', async () => {
            const lastMessage = { id: 'm1', content: 'hi', sender_id: 'u2', is_read: false, created_at: new Date().toISOString() };
            const mockSummaries = [{ conversation_id: 'c1', unread_count: 3, last_message: lastMessage }];
            const mockConversations = [{
                id: 'c1',
                conversation_participants: [
                    { user_id: 'u1' },
                    { user_id: 'u2' }
                ]
            }];
            const mockProfiles = [
                { id: 'u1', username: 'user1' },
                { id: 'u2', username: 'user2' }
            ];

            vi.mocked(supabase.rpc).mockResolvedValue({ data: mockSummaries, error: null } as any);

            const conversationsSelect = vi.fn().mockReturnThis();
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockImplementation((table: string) => {
                if (table === 'conversations') {
                    return {
                        select: conversationsSelect,
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
            expect(result[0].unreadCount).toBe(3);
            expect(result[0].lastMessage?.content).toBe('hi');
            expect(result[0].lastMessage?.author?.username).toBe('user2');
            expect(result[0].participants[1].profile?.username).toBe('user2');
            // Must not embed messages in the conversations query
            expect(conversationsSelect.mock.calls[0][0]).not.toContain('messages');
        });

        it('defaults unread count to 0 and omits lastMessage when a conversation has no messages', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: [{ conversation_id: 'c1', unread_count: 0, last_message: null }],
                error: null
            } as any);
            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'conversations') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue({ data: [{ id: 'c1', conversation_participants: [{ user_id: 'u1' }] }], error: null })
                    } as any;
                }
                return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
            });

            const result = await chatService.fetchConversations('u1');
            expect(result[0].unreadCount).toBe(0);
            expect(result[0].lastMessage).toBeUndefined();
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