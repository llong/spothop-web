import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useConversationsQuery, useMessagesQuery, useConversationQuery, useSendMessageMutation, chatKeys } from '../useChatQueries';
import { chatService } from '../../services/chatService';
import supabase from '../../supabase';

// Mock TanStack Query hooks internally as well for isolated testing of this module
vi.mock("@tanstack/react-query", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        useQuery: vi.fn(),
        useMutation: vi.fn(),
        useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    };
});

vi.mock("../../services/chatService");
vi.mock("../../supabase");

// Explicitly mock jotai to handle the `atom.debugLabel` error
vi.mock("jotai", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
    };
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('useChatQueries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(chatService.fetchConversations).mockResolvedValue([]);
        vi.mocked(chatService.fetchMessages).mockResolvedValue([]);
        vi.mocked(chatService.fetchConversationDetails).mockResolvedValue(null);
        vi.mocked(chatService.sendMessage).mockResolvedValue({});

        // Mock useQuery and useMutation to return basic structure for testing
        vi.mocked(useQuery).mockImplementation((options) => ({
            data: options.queryFn(),
            isLoading: false,
            isFetching: false,
            error: null,
        }));
        vi.mocked(useMutation).mockImplementation((options) => ({
            mutate: options.mutationFn,
            mutateAsync: vi.fn(() => Promise.resolve(options.mutationFn)),
            isPending: false,
            isSuccess: false,
            isError: false,
            data: null,
            error: null,
        }));
    });

    describe('useConversationsQuery', () => {
        it('fetches conversations for a given user ID', async () => {
            const mockConversations = [{ id: 'c1', name: 'Chat 1' }];
            vi.mocked(chatService.fetchConversations).mockResolvedValue(mockConversations as any);
            vi.mocked(useQuery).mockImplementation((options) => ({
                data: mockConversations, isLoading: false, isFetching: false, error: null
            }));

            const { result } = renderHook(() => useConversationsQuery('u1'), { wrapper });

            await waitFor(() => expect(result.current.isLoading).toBeFalsy());
            expect(result.current.data).toEqual(mockConversations);
            expect(chatService.fetchConversations).toHaveBeenCalledWith('u1');
        });

        it('does not fetch if userId is undefined', () => {
            vi.mocked(useQuery).mockImplementation((options) => ({
                data: null, isLoading: false, isFetching: false, error: null
            }));
            renderHook(() => useConversationsQuery(undefined), { wrapper });
            expect(chatService.fetchConversations).not.toHaveBeenCalled();
        });

        // Need more advanced mocking for useEffect based real-time updates
    });

    describe('useMessagesQuery', () => {
        it('fetches messages for a given conversation ID', async () => {
            const mockMessages = [{ id: 'm1', content: 'hello' }];
            vi.mocked(chatService.fetchMessages).mockResolvedValue(mockMessages as any);
            vi.mocked(useQuery).mockImplementation((options) => ({
                data: mockMessages, isLoading: false, isFetching: false, error: null
            }));

            const { result } = renderHook(() => useMessagesQuery('conv1'), { wrapper });

            await waitFor(() => expect(result.current.isLoading).toBeFalsy());
            expect(result.current.data).toEqual(mockMessages);
            expect(chatService.fetchMessages).toHaveBeenCalledWith('conv1');
        });

        it('does not fetch if conversationId is undefined', () => {
            vi.mocked(useQuery).mockImplementation((options) => ({
                data: null, isLoading: false, isFetching: false, error: null
            }));
            renderHook(() => useMessagesQuery(undefined), { wrapper });
            expect(chatService.fetchMessages).not.toHaveBeenCalled();
        });
    });

    describe('useConversationQuery', () => {
        it('fetches details for a single conversation', async () => {
            const mockConversation = { id: 'conv1', name: 'Single Chat' };
            vi.mocked(chatService.fetchConversationDetails).mockResolvedValue(mockConversation as any);
            vi.mocked(useQuery).mockImplementation((options) => ({
                data: mockConversation, isLoading: false, isFetching: false, error: null
            }));

            const { result } = renderHook(() => useConversationQuery('conv1', 'u1'), { wrapper });

            await waitFor(() => expect(result.current.isLoading).toBeFalsy());
            expect(result.current.data).toEqual(mockConversation);
            expect(chatService.fetchConversationDetails).toHaveBeenCalledWith('conv1');
        });

        it('does not fetch if conversationId or userId is undefined', () => {
            vi.mocked(useQuery).mockImplementation((options) => ({
                data: null, isLoading: false, isFetching: false, error: null
            }));
            renderHook(() => useConversationQuery(undefined, 'u1'), { wrapper });
            expect(chatService.fetchConversationDetails).not.toHaveBeenCalled();
        });
    });

    describe('useSendMessageMutation', () => {
        it('sends a message and invalidates queries on success', async () => {
            const invalidateQueries = vi.fn();
            vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as any);
            
            vi.mocked(useMutation).mockImplementation((options) => ({
                mutateAsync: vi.fn((args) => {
                    options.onSuccess();
                    return Promise.resolve(options.mutationFn(args));
                }),
                isPending: false,
            }));

            const { result } = renderHook(() => useSendMessageMutation('conv1'), { wrapper });

            await result.current.mutateAsync({ senderId: 'u1', content: 'test message' });

            expect(chatService.sendMessage).toHaveBeenCalledWith('conv1', 'u1', 'test message');
            expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: chatKeys.thread('conv1') });
        });
    });
});
