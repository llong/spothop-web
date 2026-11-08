import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NewSpotPopup } from '@/routes/-components/NewSpotPopup';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import L from 'leaflet';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('react-leaflet', () => ({
    Popup: ({ children }: any) => <div data-testid="leaflet-popup">{children}</div>,
}));

const theme = createTheme();

describe('NewSpotPopup', () => {
    const mockNewSpot = {
        latlng: L.latLng(43.0481, -76.1474),
        address: "1146 E Water St, Syracuse, NY 13210, USA"
    };

    it('renders the popup with title, address, and action button', () => {
        render(
            <ThemeProvider theme={theme}>
                <NewSpotPopup newSpot={mockNewSpot} onClose={vi.fn()} />
            </ThemeProvider>
        );

        expect(screen.getByText('New Spot')).toBeInTheDocument();
        expect(screen.getByText("1146 E Water St, Syracuse, NY 13210, USA")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add spot here/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('calls onClose when close icon button is clicked', () => {
        const onClose = vi.fn();
        render(
            <ThemeProvider theme={theme}>
                <NewSpotPopup newSpot={mockNewSpot} onClose={onClose} />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('navigates to /spots/new with coordinates when Add Spot Here is clicked', () => {
        render(
            <ThemeProvider theme={theme}>
                <NewSpotPopup newSpot={mockNewSpot} onClose={vi.fn()} />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: /add spot here/i }));
        expect(mockNavigate).toHaveBeenCalledWith({
            to: '/spots/new',
            search: { lat: 43.0481, lng: -76.1474 }
        });
    });
});
