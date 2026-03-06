import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Mock hooks - hoisted
const { mockUseMessagesQuery, mockUseConversationQuery, mockUseSendMessageMutation } = vi.hoisted(() => ({
    mockUseMessagesQuery: vi.fn(),
    mockUseConversationQuery: vi.fn(),
    mockUseSendMessageMutation: vi.fn(),
}));

vi.mock('src/hooks/useChatQueries', () => ({
    useMessagesQuery: (...args: any[]) => mockUseMessagesQuery(...args),
    useConversationQuery: (...args: any[]) => mockUseConversationQuery(...args),
    useSendMessageMutation: (...args: any[]) => mockUseSendMessageMutation(...args),
}));
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn().mockReturnValue({ user: { id: 'test-user-id' } }),
    };
});
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: vi.fn().mockReturnValue({
        invalidateQueries: vi.fn(),
    }),
    QueryClient: class QueryClient {
        constructor() { }
        setDefaultOptions() { }
        clear() { }
    },
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock TanStack Router
const { mockRoute, mockHistoryBack } = vi.hoisted(() => ({
    mockRoute: {
        options: {
            component: (props: any) => <div {...props} />,
        },
        useParams: vi.fn().mockReturnValue({}),
        useSearch: vi.fn().mockReturnValue({}),
    },
    mockHistoryBack: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    createFileRoute: vi.fn(() => (options: any) => {
        mockRoute.options = options;
        return mockRoute;
    }),
    lazyRouteComponent: vi.fn(async (fn) => await fn()),
    useRouter: vi.fn().mockReturnValue({
        history: {
            back: mockHistoryBack,
        },
    }),
    Route: mockRoute,
}));

vi.mock('src/supabase', () => ({
    default: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } } }),
        },
    },
}));

// Now import Route
import { Route } from '../$conversationId';

// Mock Route.useParams
(Route as any).useParams = vi.fn().mockReturnValue({ conversationId: 'test-chat-id' });

const theme = createTheme();

const renderComponent = async (component: React.ReactElement) => {
    const queryClient = new QueryClient();
    return render(
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    {component}
                </ThemeProvider>
            </QueryClientProvider>
        </HelmetProvider>
    );
};

describe('ChatRoomComponent', () => {
    const mockMessages = [
        { id: '1', content: 'Hello', sender_id: 'other-user-id', created_at: new Date().toISOString(), author: { avatarUrl: 'avatar.png', username: 'OtherUser' } },
        { id: '2', content: 'Hi there', sender_id: 'test-user-id', created_at: new Date().toISOString(), author: { avatarUrl: 'me.png', username: 'Me' } },
    ];
    const mockChat = {
        id: 'test-chat-id',
        is_group: false,
        name: null,
        participants: [
            { user_id: 'test-user-id', status: 'accepted', role: 'member', profile: { displayName: 'Me', username: 'me' } },
            { user_id: 'other-user-id', status: 'accepted', role: 'member', profile: { displayName: 'OtherUser', username: 'otheruser', avatarUrl: 'avatar.png' } },
        ],
    };
    const mockSendMessageMutation = {
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseMessagesQuery.mockReturnValue({ data: mockMessages, isLoading: false });
        mockUseConversationQuery.mockReturnValue({ data: mockChat, isLoading: false });
        mockUseSendMessageMutation.mockReturnValue(mockSendMessageMutation);

        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders chat messages', async () => {
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        await renderComponent(React.createElement(actualComponent));

        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there')).toBeInTheDocument();
        expect(screen.getByText('OtherUser')).toBeInTheDocument();
    }, 30000);

    it('sends a message', async () => {
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        await renderComponent(React.createElement(actualComponent));

        const inputs = screen.getAllByPlaceholderText('Type a message...');
        const input = inputs[inputs.length - 1]; // Use the last one in case of multiple renders
        fireEvent.change(input, { target: { value: 'New message' } });

        const form = input.closest('form');
        fireEvent.submit(form!);

        await waitFor(() => {
            expect(mockSendMessageMutation.mutateAsync).toHaveBeenCalledWith({
                senderId: 'test-user-id',
                content: 'New message',
            });
        });
    });

    it('navigates back when back button is clicked', async () => {
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        await renderComponent(React.createElement(actualComponent));

        const backButton = screen.getByTestId('ArrowBackIcon').closest('button');
        fireEvent.click(backButton!);

        expect(mockHistoryBack).toHaveBeenCalled();
    });

    it('shows loading state', async () => {
        mockUseMessagesQuery.mockReturnValue({ data: [], isLoading: true });
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        await renderComponent(React.createElement(actualComponent));

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
