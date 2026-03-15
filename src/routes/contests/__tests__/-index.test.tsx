import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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
    Route: mockRoute,
}));

// Mock hooks - hoisted
const { mockUseQuery } = vi.hoisted(() => ({
    mockUseQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: (...args: any[]) => mockUseQuery(...args),
    QueryClient: class QueryClient {
        constructor() {}
        setDefaultOptions() {}
        clear() {}
    },
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Now import Route
import { Route } from '../index';

// Mock other dependencies
vi.mock('@/services/contestService', () => ({
    contestService: {
        fetchActiveContests: vi.fn(),
    },
}));
vi.mock('@/components/SEO/SEO', () => ({
    default: () => null,
}));

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

describe('ContestsPage', () => {
    const mockContests = [
        {
            id: '1',
            title: 'Contest 1',
            description: 'Description 1',
            status: 'active',
            flyer_url: 'flyer1.jpg',
            end_date: new Date().toISOString(),
            entry_count: 5,
            criteria: { required_media_types: ['video'] },
            prize_info: 'Win a deck',
        },
        {
            id: '2',
            title: 'Contest 2',
            description: 'Description 2',
            status: 'voting',
            flyer_url: 'flyer2.jpg',
            end_date: new Date().toISOString(),
            entry_count: 10,
            criteria: { required_media_types: ['photo'] },
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseQuery.mockReturnValue({
            data: mockContests,
            isLoading: false,
            error: null,
        });
    });

    it('renders contests list', async () => {
        const component = (Route as any).options.component;
        console.log("Component is:", typeof component, component);
        if (component && typeof component === 'object') {
            console.log("Component keys:", Object.keys(component));
        }
        const ActualComponent = component.component || component;
        const { getByText } = await renderComponent(<ActualComponent />);

        await waitFor(() => {
            expect(getByText('Contests & Challenges')).toBeInTheDocument();
        });
        expect(getByText('Contest 1')).toBeInTheDocument();
        expect(getByText('Contest 2')).toBeInTheDocument();
        expect(getByText('ACTIVE')).toBeInTheDocument();
        expect(getByText('VOTING')).toBeInTheDocument();
    });

    it('shows loading state', async () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        });
        const component = (Route as any).options.component;
        const ActualComponent = component.component || component;
        const { container } = await renderComponent(<ActualComponent />);

        expect(container.getElementsByClassName('MuiSkeleton-root').length).toBeGreaterThan(0);
    });

    it('shows error state', async () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Failed to fetch'),
        });
        const component = (Route as any).options.component;
        const ActualComponent = component.component || component;
        await renderComponent(<ActualComponent />);

        expect(screen.getByText('Error loading contests: Failed to fetch')).toBeInTheDocument();
    });

    it('shows empty state', async () => {
        mockUseQuery.mockReturnValue({
            data: [],
            isLoading: false,
            error: null,
        });
        const component = (Route as any).options.component;
        const ActualComponent = component.component || component;
        await renderComponent(<ActualComponent />);

        expect(screen.getByText('No active contests right now. Check back soon!')).toBeInTheDocument();
    });

    it('opens image preview on click', async () => {
        const component = (Route as any).options.component;
        const ActualComponent = component.component || component;
        await renderComponent(<ActualComponent />);

        const viewFullButton = screen.getAllByText('View Full')[0];
        fireEvent.click(viewFullButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Full size flyer' })).toBeInTheDocument();
    });
});
