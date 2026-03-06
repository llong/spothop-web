import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Mock TanStack Router
const { mockRoute } = vi.hoisted(() => ({
    mockRoute: {
        options: {
            component: (props: any) => <div {...props} />,
        },
        useParams: vi.fn(() => ({})),
        useSearch: vi.fn(() => ({})),
    }
}));

vi.mock('@tanstack/react-router', () => ({
    createFileRoute: vi.fn(() => (options: any) => {
        mockRoute.options = options;
        return mockRoute;
    }),
    lazyRouteComponent: vi.fn(async (fn) => await fn()),
    Link: vi.fn(({ children, ...props }: any) => <a {...props}>{children}</a>),
    redirect: vi.fn((opts) => opts),
    useNavigate: vi.fn(() => vi.fn()),
    Route: mockRoute,
}));

// Mock hooks - hoisted
const { mockUseConversationsQuery } = vi.hoisted(() => ({
    mockUseConversationsQuery: vi.fn(),
}));

vi.mock('src/hooks/useChatQueries', () => ({
    useConversationsQuery: (...args: any[]) => mockUseConversationsQuery(...args),
}));
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn().mockReturnValue({ user: { id: 'test-user-id' } }),
    };
});
vi.mock('src/services/chatService', () => ({
    chatService: {
        sendMessage: vi.fn().mockResolvedValue({}),
        markAsRead: vi.fn().mockResolvedValue({}),
    },
}));
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

// We MUST mock supabase before importing the component that uses it directly outside of functions
vi.mock('src/supabase', () => {
    return {
        default: {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } } }),
                onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            },
            channel: vi.fn().mockReturnValue({
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn()
            })
        },
    };
});

// Now import Route
import { Route } from '../index';

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

describe('ChatInboxComponent', () => {
    const mockConversations = [
        {
            id: '1',
            participants: [
                { user_id: 'test-user-id', status: 'accepted', profile: { id: 'test-user-id', displayName: 'Me', username: 'me' } },
                { user_id: 'other-user-id', status: 'accepted', profile: { id: 'other-user-id', displayName: 'OtherUser', username: 'otheruser', avatarUrl: 'avatar.png' } }
            ],
            is_group: false,
            unreadCount: 2,
            lastMessage: { content: 'Hello', author: { username: 'OtherUser' } },
            last_message_at: new Date().toISOString(),
        },
        {
            id: '2',
            participants: [
                { user_id: 'test-user-id', status: 'pending', profile: { id: 'test-user-id', displayName: 'Me', username: 'me' } },
                { user_id: 'inviter-id', status: 'accepted', profile: { id: 'inviter-id', displayName: 'Inviter', username: 'inviter', avatarUrl: 'inviter.png' } }
            ],
            is_group: true,
            name: 'New Group',
            created_by: 'inviter-id',
            created_at: new Date().toISOString(),
            unreadCount: 0,
            lastMessage: null,
            last_message_at: new Date().toISOString(),
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseConversationsQuery.mockReturnValue({
            data: mockConversations,
            isLoading: false,
            isSuccess: true,
            refetch: vi.fn(),
            hasNextPage: false,
            fetchNextPage: vi.fn()
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('renders component without crashing', async () => {
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        await renderComponent(React.createElement(actualComponent));

        await waitFor(() => {
            const chatHeader = screen.queryByText('Chat');
            const messagesTab = screen.queryByText(/Messages/i);
            const invitesTab = screen.queryByText(/Invites/i);

            expect(chatHeader || messagesTab || invitesTab).toBeInTheDocument();
        });
    }, 30000);
});
