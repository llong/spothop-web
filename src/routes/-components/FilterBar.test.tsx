import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilterBar } from './FilterBar';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock jotai to handle the atom state
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtom: vi.fn((atom) => {
            if (atom && (atom as any).debugLabel === 'isFiltersOpen') return [true, vi.fn()];
            return [null, vi.fn()];
        }),
    };
});

// Mock MUI Popover to render children directly instead of using a portal
vi.mock('@mui/material', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@mui/material')>();
    return {
        ...actual,
        Popover: ({ open, children }: any) => open ? <div data-testid="mock-popover">{children}</div> : null,
    };
});

const theme = createTheme();

describe('FilterBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockFilters = {
        difficulty: 'all',
        spot_type: [],
        is_lit: false,
        kickout_risk: 10
    };

    it('renders filters when open', () => {
        const anchorEl = document.createElement('button');
        render(
            <ThemeProvider theme={theme}>
                <FilterBar
                    anchorEl={anchorEl}
                    filters={mockFilters as any}
                    onFiltersChange={vi.fn()}
                />
            </ThemeProvider>
        );

        expect(screen.getByTestId('mock-popover')).toBeInTheDocument();
        expect(screen.getByText('Filters')).toBeInTheDocument();
        // Use getAllByText for labels that MUI might render twice
        expect(screen.getAllByText('Difficulty')[0]).toBeInTheDocument();
    });

    it('calls onFiltersChange when resetting filters', () => {
        const anchorEl = document.createElement('button');
        const onFiltersChange = vi.fn();
        const customFilters = { ...mockFilters, difficulty: 'advanced' };

        render(
            <ThemeProvider theme={theme}>
                <FilterBar
                    anchorEl={anchorEl}
                    filters={customFilters as any}
                    onFiltersChange={onFiltersChange}
                />
            </ThemeProvider>
        );

        const resetButton = screen.getByText('Reset Filters');
        fireEvent.click(resetButton);

        expect(onFiltersChange).toHaveBeenCalledWith({});
    });
});
