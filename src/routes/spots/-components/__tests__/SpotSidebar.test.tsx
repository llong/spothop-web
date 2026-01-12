import { render, screen, fireEvent } from '@testing-library/react';
import { SpotSidebar } from '../SpotSidebar/SpotSidebar';
import { vi, describe, it, expect } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Spot } from 'src/types';

const theme = createTheme();

describe('SpotSidebar', () => {
    const mockSpot: Spot = {
        id: '123',
        name: 'Spot Name',
        description: 'About this spot',
        latitude: 1.23,
        longitude: 4.56,
        created_at: '2025-01-01',
    };

    it('renders description correctly', () => {
        render(
            <ThemeProvider theme={theme}>
                <SpotSidebar
                    spot={mockSpot as any}
                    isFavorited={false}
                    onToggleFavorite={vi.fn()}
                    onAddMedia={vi.fn()}
                    isLoggedIn={true}
                />
            </ThemeProvider>
        );

        expect(screen.getAllByText(/About this spot/i)[0]).toBeInTheDocument();
    });

    it('shows login-only buttons when logged in', () => {
        render(
            <ThemeProvider theme={theme}>
                <SpotSidebar
                    spot={mockSpot as any}
                    isFavorited={false}
                    onToggleFavorite={vi.fn()}
                    onAddMedia={vi.fn()}
                    isLoggedIn={true}
                />
            </ThemeProvider>
        );

        expect(screen.getByText(/Save Spot/i)).toBeInTheDocument();
        expect(screen.getByText(/Add Photo\/Video/i)).toBeInTheDocument();
    });

    it('hides login-only buttons when logged out', () => {
        render(
            <ThemeProvider theme={theme}>
                <SpotSidebar
                    spot={mockSpot as any}
                    isFavorited={false}
                    onToggleFavorite={vi.fn()}
                    onAddMedia={vi.fn()}
                    isLoggedIn={false}
                />
            </ThemeProvider>
        );

        expect(screen.queryByText(/Save Spot/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Add Photo\/Video/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Get Directions/i)).toBeInTheDocument();
    });

    it('calls handleOpenInMaps on click', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        render(
            <ThemeProvider theme={theme}>
                <SpotSidebar
                    spot={mockSpot as any}
                    isFavorited={false}
                    onToggleFavorite={vi.fn()}
                    onAddMedia={vi.fn()}
                    isLoggedIn={false}
                />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByText(/Get Directions/i));
        expect(openSpy).toHaveBeenCalled();
    });
});
