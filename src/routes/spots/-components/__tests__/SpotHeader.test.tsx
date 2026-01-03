import { render, screen, fireEvent } from '@testing-library/react';
import { SpotHeader } from '../SpotHeader';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Mock FlagSpotDialog
vi.mock('../FlagSpotDialog', () => ({
    FlagSpotDialog: () => <div data-testid="flag-dialog" />,
}));

const theme = createTheme();

describe('SpotHeader', () => {
    const defaultProps = {
        spotId: '123',
        spotName: 'Test Spot',
        onBack: vi.fn(),
        isFavorited: false,
        favoriteCount: 5,
        flagCount: 2,
        onToggleFavorite: vi.fn(),
        isLoggedIn: true,
        onReportSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly when logged in', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotHeader {...defaultProps} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        expect(screen.getByText(/Back to search/i)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Favorite count
        expect(screen.getByText('2')).toBeInTheDocument(); // Flag count
    });

    it('calls onBack when back button is clicked', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotHeader {...defaultProps} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        fireEvent.click(screen.getByText(/Back to search/i));
        expect(defaultProps.onBack).toHaveBeenCalled();
    });

    it('calls onToggleFavorite when favorite button is clicked', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotHeader {...defaultProps} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        const favBtn = screen.getByLabelText(/Add to favorites/i);
        fireEvent.click(favBtn);
        expect(defaultProps.onToggleFavorite).toHaveBeenCalled();
    });

    it('hides social actions when not logged in', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotHeader {...defaultProps} isLoggedIn={false} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        expect(screen.queryByLabelText(/Add to favorites/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Report this spot/i)).not.toBeInTheDocument();
    });
});
