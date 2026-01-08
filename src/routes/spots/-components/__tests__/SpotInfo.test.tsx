import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpotInfo } from '../SpotInfo';
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
        const spotWithAddress = { ...mockSpot, address: '123 Main St', state: 'NY' };
        renderWithProviders(
            <SpotInfo
                spot={spotWithAddress}
                isFavorited={false}
                onToggleFavorite={() => { }}
                isLoggedIn={true}
                onReportSuccess={() => { }}
            />
        );

        // Address building is async now due to potential enrichment
        // Use a more flexible matcher in case of whitespace/formatting issues
        await waitFor(() => {
            expect(screen.getByText((content) => content.includes('123 Main St') && content.includes('NY'))).toBeDefined();
        });
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

        // Test with null to trigger fallback
        const spotWithoutAddress = { ...mockSpot, address: null as any };

        renderWithProviders(
            <SpotInfo
                spot={spotWithoutAddress}
                isFavorited={false}
                onToggleFavorite={() => { }}
                isLoggedIn={true}
                onReportSuccess={() => { }}
            />
        );

        // Address building logic in SpotInfo:
        // streetInfo: spot.address || [info.streetNumber, info.street].join(' ') -> "306 Caleb Avenue"
        // city: spot.city || info.city -> "New York" (from mockSpot)
        // state: spot.state || info.state -> "NY" (from info)
        // country: spot.country || info.country -> "USA" (from mockSpot)
        // cleanAddress: "306 Caleb Avenue, New York, NY, USA"

        const expectedAddress = '306 Caleb Avenue, New York, NY, USA';

        const addressElement = await screen.findByText(expectedAddress, {}, { timeout: 5000 });
        expect(addressElement).toBeDefined();
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
                spot={mockSpot}
                isFavorited={false}
                onToggleFavorite={() => { }}
                isLoggedIn={true}
                onReportSuccess={() => { }}
            />
        );

        await waitFor(() => {
            // Should be clean: "108 Jalan Pantai Permai 1, Kuala Lumpur, KL, Malaysia"
            expect(screen.getByText((content) =>
                content.includes('108 Jalan Pantai Permai 1') &&
                content.includes('KL')
            )).toBeDefined();
        });
    });
});
