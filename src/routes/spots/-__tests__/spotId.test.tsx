import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route } from '../$spotId.lazy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock Router
vi.mock('@tanstack/react-router', () => ({
    createLazyFileRoute: () => (config: any) => {
        const component = config.component;
        component.useParams = vi.fn().mockReturnValue({ spotId: 's1' });
        return {
            useParams: component.useParams,
            options: { component } // TanStack Router stores component in options for lazy routes
        };
    },
}));

// Mock sub-components to reduce complexity
vi.mock('../-components/SpotGallery', () => ({ SpotGallery: () => <div data-testid="gallery" /> }));
vi.mock('../-components/SpotInfo/SpotInfo', () => ({ SpotInfo: () => <div data-testid="info" /> }));
vi.mock('../-components/SpotSidebar/SpotSidebar', () => ({ SpotSidebar: () => <div data-testid="sidebar" /> }));
vi.mock('../-components/SpotCreatorInfo', () => ({ SpotCreatorInfo: () => <div data-testid="creator" /> }));
vi.mock('../-components/CommentSection', () => ({ CommentSection: () => <div data-testid="comments" /> }));
vi.mock('../-components/AddMediaDialog', () => ({ AddMediaDialog: () => <div data-testid="media-dialog" /> }));
vi.mock('../-components/SpotCardSkeleton', () => ({ SpotDetailSkeleton: () => <div data-testid="skeleton" /> }));

// Mock hooks
vi.mock('src/hooks/useSpotQueries', () => ({
    useSpotQuery: vi.fn(() => ({ data: { id: 's1', name: 'Test Spot' }, isLoading: false }))
}));

vi.mock('src/hooks/useSpotFavorites', () => ({
    useSpotFavorites: vi.fn(() => ({ isFavorited: false, toggleFavorite: vi.fn() }))
}));

// Mock jotai
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn(() => ({ user: { id: 'u1' } })),
    };
});

const theme = createTheme();
const queryClient = new QueryClient();

describe('SpotDetailsComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders spot details when loaded', () => {
        const Component = (Route as any).options.component;
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <Component />
                </ThemeProvider>
            </QueryClientProvider>
        );

        expect(screen.getByTestId('gallery')).toBeInTheDocument();
        expect(screen.getByTestId('info')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
});
