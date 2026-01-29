import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import SpotsListCard from './SpotsListCard';
import type { Spot } from 'src/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, params, style }: any) => (
        <a href={to} data-params={JSON.stringify(params)} style={style}>
            {children}
        </a>
    ),
}));

// Mock Geocoding hook
vi.mock('src/hooks/useGeocoding', () => ({
    useGeocoding: vi.fn(() => ({
        buildLocationString: vi.fn().mockResolvedValue('123 Skate St, Skate City, Skate Country')
    }))
}));

const mockSpot: Spot = {
    id: '1',
    name: 'Test Skate Spot',
    description: 'A great place to skate',
    address: '123 Skate St',
    city: 'Skate City',
    country: 'Skate Country',
    latitude: 1.23,
    longitude: 4.56,
    difficulty: 'intermediate',
    kickout_risk: 5,
    is_lit: true,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    status: 'active',
    upvotes: 0,
    downvotes: 0,
    flagCount: 0,
    photoUrl: 'https://example.com/photo.jpg',
    thumbnail_small_url: 'https://example.com/thumb_small.jpg',
    spot_type: ['rail', 'ledge']
};

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

describe('SpotsListCard', () => {
    it('renders the spot name and location correctly', async () => {
        await act(async () => {
            render(<SpotsListCard spot={mockSpot} />, { wrapper });
        });

        expect(screen.getByText('Test Skate Spot')).toBeInTheDocument();
        expect(await screen.findByText(/123 Skate St/)).toBeInTheDocument();
    });

    it('renders the correct difficulty chip', async () => {
        await act(async () => {
            render(<SpotsListCard spot={mockSpot} />, { wrapper });
        });

        expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    it('renders the spot types', async () => {
        await act(async () => {
            render(<SpotsListCard spot={mockSpot} />, { wrapper });
        });

        expect(screen.getByText(/rail/)).toBeInTheDocument();
        expect(screen.getByText(/ledge/)).toBeInTheDocument();
    });

    it('uses the thumbnail_small_url when present', async () => {
        await act(async () => {
            render(<SpotsListCard spot={mockSpot} />, { wrapper });
        });

        const image = screen.getByRole('img');
        expect(image.getAttribute('src')).toContain('thumb_small.jpg');
    });

    it('falls back to photoUrl if thumbnails are missing', async () => {
        const spotWithoutThumb: Spot = {
            ...mockSpot,
            thumbnail_small_url: undefined,
            thumbnail_large_url: undefined,
        };

        await act(async () => {
            render(<SpotsListCard spot={spotWithoutThumb} />, { wrapper });
        });

        const image = screen.getByRole('img');
        expect(image.getAttribute('src')).toContain('photo.jpg');
    });
});