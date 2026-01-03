import { render, screen, fireEvent } from '@testing-library/react';
import { SpotCharacteristics } from '../SpotCharacteristics';
import { vi, describe, it, expect } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const theme = createTheme();
const queryClient = new QueryClient();

describe('SpotCharacteristics', () => {
    const defaultProps = {
        spotType: [],
        setSpotType: vi.fn(),
        difficulty: 'beginner',
        setDifficulty: vi.fn(),
        isLit: false,
        setIsLit: vi.fn(),
        kickoutRisk: 1,
        setKickoutRisk: vi.fn(),
    };

    it('renders all characteristic selectors', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotCharacteristics {...defaultProps} />
                </ThemeProvider>
            </QueryClientProvider>
        );
        expect(screen.getAllByText(/Spot Type/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Difficulty/i)[0]).toBeInTheDocument();
        expect(screen.getByLabelText(/Lit at Night/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Kickout Risk/i)[0]).toBeInTheDocument();
    });

    it('calls setSpotType when a type is toggled', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotCharacteristics {...defaultProps} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        const railButton = screen.getByRole('button', { name: /rail/i });
        fireEvent.click(railButton);
        expect(defaultProps.setSpotType).toHaveBeenCalledWith(['rail']);
    });

    it('calls setIsLit when switch is toggled', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SpotCharacteristics {...defaultProps} />
                </ThemeProvider>
            </QueryClientProvider>
        );

        const litSwitch = screen.getByLabelText(/Lit at Night/i);
        fireEvent.click(litSwitch);
        expect(defaultProps.setIsLit).toHaveBeenCalledWith(true);
    });
});
