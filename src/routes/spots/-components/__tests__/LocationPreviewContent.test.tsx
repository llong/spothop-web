import { render, screen } from '@testing-library/react';
import LocationPreviewContent from '../LocationPreviewContent';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Mock Leaflet
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: () => <div data-testid="marker" />,
}));

describe('LocationPreviewContent', () => {
    it('renders lat, lng and address correctly', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <LocationPreviewContent lat={3.125} lng={101.677} address="123 Test St" />
            </QueryClientProvider>
        );

        expect(screen.getByText('123 Test St')).toBeInTheDocument();
        expect(screen.getByText(/Lat: 3.125000, Lng: 101.677000/i)).toBeInTheDocument();
        expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    it('shows fetching status if address is empty', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <LocationPreviewContent lat={3.125} lng={101.677} address="" />
            </QueryClientProvider>
        );
        expect(screen.getByText(/Fetching address\.\.\./i)).toBeInTheDocument();
    });
});
