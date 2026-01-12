import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpotsListCard from './SpotsListCard';
import type { Spot } from 'src/types';

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, params, style }: any) => (
        <a href={to} data-params={JSON.stringify(params)} style={style}>
            {children}
        </a>
    ),
}));

// Mock Supabase
vi.mock('src/supabase', () => ({
    default: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        }
    }
}));

// Mock geocoding util to resolve address construction
vi.mock('src/utils/geocoding', () => ({
    reverseGeocode: vi.fn(() => Promise.resolve({
        streetNumber: '123',
        street: 'Skate St',
        city: 'Skate City',
        state: 'SC',
        country: 'Skate Country'
    }))
}));

describe('SpotsListCard', () => {
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
        photoUrl: 'https://example.com/photo.jpg',
        thumbnail_small_url: 'https://example.com/thumb_small.jpg',
        spot_type: ['rail', 'ledge']
    };

    it('renders the spot name and location correctly', async () => {
        render(<SpotsListCard spot={mockSpot} />);

        expect(screen.getByText('Test Skate Spot')).toBeInTheDocument();
        // Since useSpotAddress is async, we use findByText
        expect(await screen.findByText(/123 Skate St/)).toBeInTheDocument();
    });

    it('renders the correct difficulty chip', () => {
        render(<SpotsListCard spot={mockSpot} />);

        expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    it('renders the spot types', () => {
        render(<SpotsListCard spot={mockSpot} />);

        expect(screen.getByText('rail • ledge')).toBeInTheDocument();
    });

    it('uses the thumbnail_small_url when present', () => {
        render(<SpotsListCard spot={mockSpot} />);

        const image = screen.getByRole('img');
        expect(image.getAttribute('src')).toContain('thumb_small.jpg');
    });

    it('falls back to photoUrl if thumbnails are missing', () => {
        const spotWithoutThumb: Spot = {
            ...mockSpot,
            thumbnail_small_url: undefined,
            thumbnail_large_url: undefined,
        };

        render(<SpotsListCard spot={spotWithoutThumb} />);

        const image = screen.getByRole('img');
        expect(image.getAttribute('src')).toContain('photo.jpg');
    });
});
