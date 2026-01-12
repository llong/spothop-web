import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from '../chatService';
import supabase from '../../supabase';

vi.mock('../../supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    neq: vi.fn(() => ({
                        single: vi.fn(),
                        order: vi.fn()
                    })),
                    order: vi.fn(),
                    in: vi.fn(),
                    single: vi.fn(),
                    is: vi.fn(() => ({
                        order: vi.fn(() => ({
                            range: vi.fn()
                        }))
                    }))
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
                eq: vi.fn(() => ({
                    eq: vi.fn()
                }))
            }))
        })),
        rpc: vi.fn(),
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }))
        }
    }
}));

describe('chatService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchMessages', () => {
        it('fetches and formats messages with authors', async () => {
            const mockMessages = [
                { id: 'm1', sender_id: 'u1', content: 'hello' }
            ];
            const mockProfiles = [
                { id: 'u1', username: 'user1', avatarUrl: 'u1.jpg' }
            ];

            const mockFrom = vi.mocked(supabase.from);

            // First call for messages
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockMessages, error: null })
                    })
                })
            } as any);

            // Second call for profiles
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
                })
            } as any);

            const result = await chatService.fetchMessages('conv1');
            expect(result[0].author).toEqual(mockProfiles[0]);
            expect(result[0].content).toBe('hello');
        });
    });

    describe('sendMessage', () => {
        it('inserts a new message and returns it', async () => {
            const mockMsg = { id: 'm2', content: 'hi' };

            vi.mocked(supabase.from).mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockMsg, error: null })
                    })
                })
            } as any);

            const result = await chatService.sendMessage('conv1', 'u1', 'hi');
            expect(result).toEqual(mockMsg);
        });
    });

    describe('fetchConversations', () => {
        it('fetches and formats conversations correctly', async () => {
            const mockParticipation = [{ conversation_id: 'c1' }];
            const mockConversations = [{
                id: 'c1',
                conversation_participants: [{ user_id: 'u1' }],
                messages: [{ id: 'm1', sender_id: 'u1', content: 'test', created_at: '2025-01-01' }]
            }];
            const mockProfiles = [{ id: 'u1', username: 'user1' }];

            const mockFrom = vi.mocked(supabase.from);

            // 1. participation
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        neq: vi.fn().mockResolvedValue({ data: mockParticipation, error: null })
                    })
                })
            } as any);

            // 2. conversations
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockConversations, error: null })
                    })
                })
            } as any);

            // 3. profiles
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
                })
            } as any);

            const result = await chatService.fetchConversations('u1');
            expect(result[0].id).toBe('c1');
            expect(result[0].participants[0].profile).toEqual(mockProfiles[0]);
            expect(result[0].lastMessage?.content).toBe('test');
        });
    });

    describe('getOrCreate1on1', () => {
        it('returns existing conversation if RPC succeeds', async () => {
            vi.mocked(supabase.rpc).mockResolvedValue({ data: 'conv_existing', error: null } as any);
            const result = await chatService.getOrCreate1on1('u1', 'u2');
            expect(result).toBe('conv_existing');
        });

        it('creates new conversation if none exists', async () => {
            // 1. RPC fails or returns null
            vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);

            const mockFrom = vi.mocked(supabase.from);

            // 2. Create conversation
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { id: 'new_conv' }, error: null })
                    })
                })
            } as any);

            // 3. Add participants
            const mockInsertParts = vi.fn().mockResolvedValue({ error: null });
            mockFrom.mockReturnValueOnce({
                insert: mockInsertParts
            } as any);

            const result = await chatService.getOrCreate1on1('u1', 'u2');
            expect(result).toBe('new_conv');
            expect(mockInsertParts).toHaveBeenCalled();
        });
    });

    describe('createGroup', () => {
        it('creates a conversation and adds participants', async () => {
            const mockConv = { id: 'c2' };
            const mockFrom = vi.mocked(supabase.from);

            // 1. create conversation
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockConv, error: null })
                    })
                })
            } as any);

            // 2. add participants
            const mockInsertPart = vi.fn().mockResolvedValue({ error: null });
            mockFrom.mockReturnValueOnce({
                insert: mockInsertPart
            } as any);

            const result = await chatService.createGroup('Group', ['u2'], 'u1');
            expect(result).toBe('c2');
            expect(mockInsertPart).toHaveBeenCalled();
        });
    });
});
