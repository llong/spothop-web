import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider, useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useConversationsQuery, useMessagesQuery, useConversationQuery, useSendMessageMutation, chatKeys } from '../useChatQueries';
import { chatService } from '../../services/chatService';
import type { Conversation } from '../../services/chatService';

vi.mock('../../services/chatService');
vi.mock('../../supabase');

// Mock @tanstack/react-query hooks
vi.mock('@tanstack/react-query', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useQuery: vi.fn(),
        useMutation: vi.fn(),
        useQueryClient: vi.fn(),
    };
});

// Explicitly mock jotai to handle the `atom.debugLabel` error
vi.mock("jotai", async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        atom: actual.atom,
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
        vi.mocked(chatService.fetchConversationDetails).mockResolvedValue({ id: 'mock' } as unknown as Conversation);
        vi.mocked(chatService.sendMessage).mockResolvedValue({});
        
        // Default implementation that tries to run queryFn if possible
        vi.mocked(useQuery).mockImplementation((options: any) => ({
            data: options.queryFn ? options.queryFn() : undefined,
            isLoading: false,
            isFetching: false,
            error: null,
            isError: false,
            isPending: false,
            isLoadingError: false,
            isRefetchError: false,
            status: 'success',
            refetch: vi.fn(),
        } as unknown as UseQueryResult<any, any>));

        vi.mocked(useMutation).mockImplementation((options: any) => ({
            mutate: options.mutationFn || vi.fn(),
            mutateAsync: vi.fn((args) => {
                if (options.onSuccess) options.onSuccess(null, args, null);
                return Promise.resolve(options.mutationFn ? options.mutationFn(args) : {});
            }),
            isPending: false,
            isSuccess: false,
            isError: false,
            data: null,
            error: null,
            reset: vi.fn(),
            variables: undefined,
            status: 'idle',
        } as unknown as UseMutationResult<any, any, any, any>));

        vi.mocked(useQueryClient).mockReturnValue({
            invalidateQueries: vi.fn(),
        } as any);
    });

    describe('useConversationsQuery', () => {
        it('fetches conversations for a given user ID', async () => {
            const mockConversations = [{ id: 'c1', name: 'Chat 1' }];
            vi.mocked(chatService.fetchConversations).mockResolvedValue(mockConversations as any);
            
            vi.mocked(useQuery).mockImplementation((options: any) => {
                if (options.queryFn && options.enabled !== false) options.queryFn();
                return {
                    data: mockConversations,
                    isLoading: false,
                    isFetching: false,
                    error: null,
                    status: 'success',
                } as any;
            });

            const { result } = renderHook(() => useConversationsQuery('u1'), { wrapper });

            await waitFor(() => expect(result.current.isLoading).toBeFalsy());
            expect(result.current.data).toEqual(mockConversations);
            expect(chatService.fetchConversations).toHaveBeenCalledWith('u1');
        });

        it('does not fetch if userId is undefined', () => {
            vi.mocked(useQuery).mockImplementation((options: any) => {
                if (options.queryFn && options.enabled !== false) options.queryFn();
                return {
                    data: null,
                    isLoading: false,
                    isFetching: false,
                    error: null,
                    status: 'pending',
                } as any;
            });
            
            renderHook(() => useConversationsQuery(undefined), { wrapper });
            expect(chatService.fetchConversations).not.toHaveBeenCalled();
        });
    });

    describe('useMessagesQuery', () => {
        it('fetches messages for a given conversation ID', async () => {
            const mockMessages = [{ id: 'm1', content: 'hello' }];
            vi.mocked(chatService.fetchMessages).mockResolvedValue(mockMessages as any);
            
            vi.mocked(useQuery).mockImplementation((options: any) => {
                if (options.queryFn && options.enabled !== false) options.queryFn();
                return {
                    data: mockMessages,
                    isLoading: false,
                    isFetching: false,
                    error: null,
                    status: 'success',
                } as any;
            });

            const { result } = renderHook(() => useMessagesQuery('conv1'), { wrapper });

            await waitFor(() => expect(result.current.isLoading).toBeFalsy());
            expect(result.current.data).toEqual(mockMessages);
            expect(chatService.fetchMessages).toHaveBeenCalledWith('conv1');
        });

        it('does not fetch if conversationId is undefined', () => {
            vi.mocked(useQuery).mockImplementation((options: any) => {
                if (options.queryFn && options.enabled !== false) options.queryFn();
                return {
                    data: null,
                    isLoading: false,
                    isFetching: false,
                    error: null,
                    status: 'pending',
                } as any;
            });
            
            renderHook(() => useMessagesQuery(undefined), { wrapper });
            expect(chatService.fetchMessages).not.toHaveBeenCalled();
        });
    });

    describe('useConversationQuery', () => {
        it('fetches details for a single conversation', async () => {
            const mockConversation = { id: 'conv1', name: 'Single Chat' };
            vi.mocked(chatService.fetchConversationDetails).mockResolvedValue(mockConversation as any);
            
            vi.mocked(useQuery).mockImplementation((options: any) => {
                if (options.queryFn && options.enabled !== false) options.queryFn();
                return {
                    data: mockConversation,
                    isLoading: false,
                    isFetching: false,
                    error: null,
                    status: 'success',
                } as any;
            });

            const { result } = renderHook(() => useConversationQuery('conv1', 'u1'), { wrapper });

            await waitFor(() => expect(result.current.isLoading).toBeFalsy());
            expect(result.current.data).toEqual(mockConversation);
            expect(chatService.fetchConversationDetails).toHaveBeenCalledWith('conv1');
        });

        it('does not fetch if conversationId or userId is undefined', () => {
            vi.mocked(useQuery).mockImplementation((options: any) => {
                if (options.queryFn && options.enabled !== false) options.queryFn();
                return {
                    data: null,
                    isLoading: false,
                    isFetching: false,
                    error: null,
                    status: 'pending',
                } as any;
            });
            
            renderHook(() => useConversationQuery(undefined as any, 'u1'), { wrapper });
            expect(chatService.fetchConversationDetails).not.toHaveBeenCalled();
        });
    });

    describe('useSendMessageMutation', () => {
        it('sends a message and invalidates queries on success', async () => {
            const invalidateQueries = vi.fn();
            vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as any);
            
            const { result } = renderHook(() => useSendMessageMutation('conv1'), { wrapper });

            await result.current.mutateAsync({ senderId: 'u1', content: 'test message' });

            expect(chatService.sendMessage).toHaveBeenCalledWith('conv1', 'u1', 'test message');
            expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: chatKeys.thread('conv1') });
        });
    });
});