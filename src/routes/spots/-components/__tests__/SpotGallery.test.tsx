import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpotGallery } from '../SpotGallery';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('src/hooks/useMediaLikes', () => ({
    useMediaLikes: () => ({
        toggleLike: vi.fn().mockResolvedValue({ success: true }),
        loading: {},
    }),
}));

vi.mock('@tanstack/react-router', () => ({
    useRouter: () => ({
        history: { back: vi.fn() },
    }),
    useBlocker: vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// Mock Embla Carousel to avoid complex gesture testing in unit tests
vi.mock('embla-carousel-react', () => ({
    default: () => [vi.fn(), {
        canScrollPrev: () => false,
        canScrollNext: () => true,
        scrollPrev: vi.fn(),
        scrollNext: vi.fn(),
        selectedScrollSnap: () => 0,
        on: vi.fn(),
        reInit: vi.fn(),
    }],
}));

const mockMedia = [
    {
        id: '1',
        url: 'https://example.com/photo1.jpg',
        type: 'photo' as const,
        createdAt: new Date().toISOString(),
        author: { id: 'u1', username: 'user1', avatarUrl: null },
        likeCount: 10,
        isLiked: false,
    },
    {
        id: '2',
        url: 'https://example.com/photo2.jpg',
        type: 'photo' as const,
        createdAt: new Date().toISOString(),
        author: { id: 'u1', username: 'user1', avatarUrl: null },
        likeCount: 5,
        isLiked: true,
    }
];

describe('SpotGallery', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient();
    });

    const renderGallery = () => render(
        <QueryClientProvider client={queryClient}>
            <SpotGallery media={mockMedia} />
        </QueryClientProvider>
    );

    it('renders the main carousel with media', () => {
        renderGallery();
        expect(screen.getAllByAltText('Spot').length).toBeGreaterThan(0);
        expect(screen.getByText(/View all 2/i)).toBeDefined();
    });

    it('opens the full gallery grid when "View all" is clicked', async () => {
        renderGallery();
        fireEvent.click(screen.getByText(/View all 2/i));

        expect(screen.getByText(/All Media \(2\)/i)).toBeDefined();
    });

    it('launches the lightbox when a main carousel item is clicked', async () => {
        renderGallery();

        // Click the first image area
        fireEvent.click(screen.getAllByAltText('Spot')[0]);

        // Check if lightbox elements appear (e.g. close button)
        expect(screen.getByTestId('CloseIcon')).toBeDefined();
    });

    it('cycles through lightbox media items (mocked navigation)', async () => {
        renderGallery();
        fireEvent.click(screen.getAllByAltText('Spot')[0]);

        // In the lightbox, verify author of first item
        expect(screen.getByText(/@user1/i)).toBeDefined();
    });
});
