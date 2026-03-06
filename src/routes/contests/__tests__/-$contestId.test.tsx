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
        useParams: vi.fn().mockReturnValue({}),
        useSearch: vi.fn().mockReturnValue({}),
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
    Route: mockRoute,
}));

// Mock hooks - hoisted
const { mockUseContestDetails } = vi.hoisted(() => ({
    mockUseContestDetails: vi.fn(),
}));

vi.mock('../hooks/useContestDetails', () => ({
    useContestDetails: (...args: any[]) => mockUseContestDetails(...args),
}));
vi.mock('@/hooks/useProfileQueries', () => ({
    useProfileQuery: vi.fn().mockReturnValue({ data: { role: 'user' }, isLoading: false }),
}));
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn().mockReturnValue({ user: { id: 'test-user-id' } }),
    };
});
vi.mock('@/components/SEO/SEO', () => ({
    default: () => null,
}));
vi.mock('../-components/ContestSubmissionModal', () => ({
    ContestSubmissionModal: () => <div data-testid="submission-modal" />,
}));
vi.mock('../-components/ContestCriteriaInfo', () => ({
    ContestCriteriaInfo: () => <div data-testid="criteria-info" />,
}));
vi.mock('../-components/ContestEntryCard', () => ({
    ContestEntryCard: () => <div data-testid="entry-card" />,
}));

vi.mock('@tanstack/react-query', () => ({
    QueryClient: class QueryClient {
        constructor() {}
        setDefaultOptions() {}
        clear() {}
    },
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Now import Route
import { Route } from '../$contestId';

// Mock Route.useParams
(Route as any).useParams = vi.fn().mockReturnValue({ contestId: 'test-contest-id' });

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

describe('ContestDetailPage', () => {
    const mockContest = {
        id: 'test-contest-id',
        title: 'Test Contest',
        description: 'Test Description',
        status: 'active',
        flyer_url: 'flyer.jpg',
        voting_type: 'public',
    };
    const mockEntries = [
        { id: '1', author: { username: 'user1' } },
        { id: '2', author: { username: 'user2' } },
    ];
    
    const mockContestDetails = {
        user: { user: { id: 'test-user-id' } },
        isAdmin: false,
        isJudge: false,
        contest: mockContest,
        contestLoading: false,
        entries: mockEntries,
        entriesLoading: false,
        userVotes: [],
        retractEntry: vi.fn(),
        voteForEntry: vi.fn(),
        isVoting: false,
        disqualifyEntry: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseContestDetails.mockReturnValue(mockContestDetails);
    });

    afterEach(() => {
        cleanup();
    });

    it('renders contest details', async () => {
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        const { getByText, getByTestId } = await renderComponent(React.createElement(actualComponent));

        await waitFor(() => {
            expect(getByText('Test Contest')).toBeInTheDocument();
        });
        expect(getByText('Test Description')).toBeInTheDocument();
        expect(getByTestId('criteria-info')).toBeInTheDocument();
    });

    it('renders entries', async () => {
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        const { getByText, getAllByTestId } = await renderComponent(React.createElement(actualComponent));

        await waitFor(() => {
            expect(getByText('Entries (2)')).toBeInTheDocument();
        });
        expect(getAllByTestId('entry-card')).toHaveLength(2);
    });

    it('shows loading skeleton when loading contest', async () => {
        mockUseContestDetails.mockReturnValue({ ...mockContestDetails, contestLoading: true });
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        const { container } = await renderComponent(React.createElement(actualComponent));

        expect(container.getElementsByClassName('MuiSkeleton-root').length).toBeGreaterThan(0);
    });

    it('shows not found message when no contest', async () => {
        mockUseContestDetails.mockReturnValue({ ...mockContestDetails, contest: null });
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        await renderComponent(React.createElement(actualComponent));

        expect(screen.getByText('Contest not found')).toBeInTheDocument();
    });

    it('shows enter contest button when active', async () => {
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        await renderComponent(React.createElement(actualComponent));

        expect(screen.getByText('Enter Contest')).toBeInTheDocument();
    });

    it('shows sign up button when not logged in', async () => {
        mockUseContestDetails.mockReturnValue({ ...mockContestDetails, user: null });
        const Component = (Route as any).options.component as any;
        const resolved = await Component;
        const actualComponent = resolved.component || resolved;
        await renderComponent(React.createElement(actualComponent));

        expect(screen.getByText('Sign Up To Enter')).toBeInTheDocument();
    });
});
