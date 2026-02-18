import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpotDetails } from '../$spotId';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import { useSpotQuery } from 'src/hooks/useSpotQueries';
import { useParams } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';

// Mock Router
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    createFileRoute: vi.fn(() => (options: any) => ({
      ...options,
      options,
    })),
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(),
  };
});

// Mock hooks from 'src/hooks/useSpotQueries'
vi.mock('src/hooks/useSpotQueries', () => ({
  useSpotQuery: vi.fn(),
  useDeleteSpotMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  spotKeys: {
    details: vi.fn(),
  },
}));

// Mock other hooks
vi.mock('src/hooks/useSpotFavorites', () => ({
  useSpotFavorites: vi.fn(() => ({ isFavorited: false, toggleFavorite: vi.fn() })),
}));

vi.mock('src/hooks/useMediaLikes', () => ({
  useMediaLikes: vi.fn(() => ({ toggleLike: vi.fn(), loading: {} })),
}));

vi.mock('src/hooks/useFlagging', () => ({
  useFlagging: vi.fn(() => ({ flagSpot: vi.fn() })),
}));

// Mock jotai
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jotai')>();
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  };
});

// Mock sub-components used in SpotDetails
vi.mock('../-components/MediaCarousel', () => ({
  MediaCarousel: () => <div data-testid="media-carousel" />,
}));

vi.mock('../-components/Lightbox', () => ({
  Lightbox: () => null,
}));

vi.mock('../-components/DetailsSidebar', () => ({
  DetailsSidebar: () => <div data-testid="sidebar" />,
}));

vi.mock('../-components/DetailsInfo', () => ({
  DetailsInfo: () => <div data-testid="info" />,
}));

vi.mock('../-components/DetailsActions', () => ({
  DetailsActions: () => <div data-testid="actions" />,
}));

vi.mock('../-components/DetailsMediaSection', () => ({
  DetailsMediaSection: () => <div data-testid="media-section" />,
}));

vi.mock('src/routes/feed/-components/FeedCommentDialog', () => ({
  FeedCommentDialog: () => null,
}));

const theme = createTheme();

describe('SpotDetails Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ spotId: 's1' });
    vi.mocked(useAtomValue).mockReturnValue({ user: { id: 'u1' } });
    vi.mocked(useSetAtom).mockReturnValue(vi.fn());
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <SpotDetails />
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    );
  };

  it('renders loading state', () => {
    vi.mocked(useSpotQuery).mockReturnValue({
      isLoading: true,
    } as any);

    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useSpotQuery).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    renderComponent();
    expect(screen.getByText(/Failed to load spot details/i)).toBeInTheDocument();
  });

  it('renders spot details when loaded', () => {
    const mockSpot = {
      id: 's1',
      name: 'Test Spot',
      media: [],
      creator: { username: 'skater1' },
      author: { id: 'u1', username: 'skater1' }
    };

    vi.mocked(useSpotQuery).mockReturnValue({
      data: mockSpot,
      isLoading: false,
    } as any);

    renderComponent();

    expect(screen.getByTestId('media-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('info')).toBeInTheDocument();
    expect(screen.getByTestId('actions')).toBeInTheDocument();
    expect(screen.getByTestId('media-section')).toBeInTheDocument();
  });
});