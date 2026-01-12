import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpotInfo } from '../SpotInfo/SpotInfo';
import { reverseGeocode } from 'src/utils/geocoding';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('src/utils/geocoding', () => ({
    reverseGeocode: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    useRouter: () => ({
        history: { back: vi.fn() },
        invalidate: vi.fn(),
    }),
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                    maybeSingle: vi.fn(),
                })),
            })),
        })),
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        }
    }
}));

const mockSpot = {
    id: 'spot-123',
    name: 'Test Spot',
    description: 'A great spot',
    latitude: 40.7128,
    longitude: -74.0060,
    address: '', // Missing address
    city: 'New York',
    state: 'NY',
    country: 'USA',
    difficulty: 'intermediate' as const,
    kickout_risk: 5,
    is_lit: true,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
};

describe('SpotInfo Address Formatting', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
    });

    const renderWithProviders = (ui: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {ui}
            </QueryClientProvider>
        );
    };

    it('renders the address from the database when available', async () => {
        const spotWithAddress = { ...mockSpot, address: '123 Main St' };
        renderWithProviders(
            <SpotInfo
                spot={spotWithAddress as any}
                isFavorited={false}
                onToggleFavorite={() => { }}
                isLoggedIn={true}
                onReportSuccess={() => { }}
            />
        );

        // Address building is immediate now for basic data
        expect(screen.getByText(/123 Main St, New York, NY, USA/i)).toBeInTheDocument();
    });

    it('falls back to reverse geocoding when address is missing', async () => {
        vi.mocked(reverseGeocode).mockResolvedValue({
            streetNumber: '306',
            street: 'Caleb Avenue',
            city: 'Syracuse',
            state: 'NY',
            country: 'United States',
            formattedAddress: '306 Caleb Avenue, Syracuse, NY 13215, USA'
        });

        const spotWithoutAddress = { ...mockSpot, address: '' };

        renderWithProviders(
            <SpotInfo
                spot={spotWithoutAddress as any}
                isFavorited={false}
                onToggleFavorite={() => { }}
                isLoggedIn={true}
                onReportSuccess={() => { }}
            />
        );

        // Expected format from useSpotAddress: "306 Caleb Avenue, Syracuse, NY, United States"
        await screen.findByText(/306 Caleb Avenue, Syracuse, NY, United States/i, {}, { timeout: 3000 });
    });

    it('correctly formats addresses without redundant information', async () => {
        vi.mocked(reverseGeocode).mockResolvedValue({
            streetNumber: '108',
            street: 'Jalan Pantai Permai 1',
            city: 'Kuala Lumpur',
            state: 'KL',
            country: 'Malaysia',
            formattedAddress: '108, Jalan Pantai Permai 1, 59200 Kuala Lumpur, Malaysia'
        });

        renderWithProviders(
            <SpotInfo
                spot={mockSpot as any}
                isFavorited={false}
                onToggleFavorite={() => { }}
                isLoggedIn={true}
                onReportSuccess={() => { }}
            />
        );

        await screen.findByText(/108 Jalan Pantai Permai 1, Kuala Lumpur, KL, Malaysia/i, {}, { timeout: 3000 });
    });
});
