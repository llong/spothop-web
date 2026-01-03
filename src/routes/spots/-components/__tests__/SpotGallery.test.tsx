import { render, screen, fireEvent } from '@testing-library/react';
import { SpotGallery } from '../SpotGallery';
import { vi, describe, it, expect } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MediaItem } from 'src/types';

const queryClient = new QueryClient();

// Mock dependencies
vi.mock('src/hooks/useMediaLikes', () => ({
    useMediaLikes: () => ({
        toggleLike: vi.fn().mockResolvedValue({ success: true }),
        loading: {},
    }),
}));

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>,
}));

const theme = createTheme();

describe('SpotGallery', () => {
    const mockMedia: MediaItem[] = [
        {
            id: 'm1',
            url: 'http://example.com/p1.jpg',
            type: 'photo',
            createdAt: '2025-01-01',
            likeCount: 5,
            isLiked: false,
            author: { id: 'u1', username: 'user1', avatarUrl: null }
        },
        {
            id: 'm2',
            url: 'http://example.com/v1.mp4',
            type: 'video',
            createdAt: '2025-01-02',
            likeCount: 10,
            isLiked: true,
            author: { id: 'u2', username: 'user2', avatarUrl: null }
        }
    ];

    it('renders the first item in the gallery', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotGallery media={mockMedia} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        // First item is photo
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', expect.stringContaining('p1.jpg'));
    });

    it('navigates between items', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotGallery media={mockMedia} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        const nextBtn = screen.getByLabelText(/Next slide/i);
        fireEvent.click(nextBtn);

        // Second item is video
        expect(screen.getByText(/Your browser does not support the video tag/i)).toBeInTheDocument();
    });

    it('shows placeholder when media is empty', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotGallery media={[]} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        expect(screen.getByText(/No photos or videos available/i)).toBeInTheDocument();
    });
});
