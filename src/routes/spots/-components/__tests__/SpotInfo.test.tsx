import { render, screen } from '@testing-library/react';
import { SpotInfo } from '../SpotInfo';
import { vi, describe, it, expect } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Spot } from 'src/types';

// Mock RouterLink
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>,
}));

const theme = createTheme();

describe('SpotInfo', () => {
    const mockSpot: Spot = {
        id: '123',
        name: 'Spot Name',
        description: 'Test Description',
        latitude: 1.23,
        longitude: 4.56,
        address: '123 Address',
        city: 'City',
        state: 'ST',
        country: 'Country',
        difficulty: 'intermediate',
        kickout_risk: 1,
        is_lit: true,
        spot_type: ['rail', 'ledge'],
        created_at: '2025-01-01',
    };

    it('renders basic spot information', () => {
        render(
            <ThemeProvider theme={theme}>
                <SpotInfo spot={mockSpot} />
            </ThemeProvider>
        );

        expect(screen.getByText('Spot Name')).toBeInTheDocument();
        expect(screen.getByText(/123 Address, City, ST, Country/i)).toBeInTheDocument();
        expect(screen.getAllByText('Intermediate')[0]).toBeInTheDocument();
        expect(screen.getByText('1/10')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument(); // Lit at night
    });

    it('renders spot types as chips', () => {
        render(
            <ThemeProvider theme={theme}>
                <SpotInfo spot={mockSpot} />
            </ThemeProvider>
        );

        expect(screen.getByText('RAIL')).toBeInTheDocument();
        expect(screen.getByText('LEDGE')).toBeInTheDocument();
    });

    it('shows favorite info if count > 0', () => {
        const spotWithFavs: Spot = { ...mockSpot, favoriteCount: 3, favoritedBy: ['user1', 'user2'] };
        render(
            <ThemeProvider theme={theme}>
                <SpotInfo spot={spotWithFavs} />
            </ThemeProvider>
        );

        expect(screen.getByText(/Saved by/i)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('user1')).toBeInTheDocument();
    });
});
