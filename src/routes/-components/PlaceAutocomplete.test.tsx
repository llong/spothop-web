import { render, screen } from '@testing-library/react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { vi, describe, it, expect } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock Google Maps
const mockAutocomplete = vi.fn().mockImplementation(function () {
    return {
        addListener: vi.fn(),
        getPlace: vi.fn().mockReturnValue({ geometry: { location: { lat: () => 1, lng: () => 2 } } }),
    };
});

(window as any).google = {
    maps: {
        places: {
            Autocomplete: mockAutocomplete,
        },
    },
};

const theme = createTheme();

describe('PlaceAutocomplete', () => {
    it('initializes Google Autocomplete on mount', () => {
        const inputRef = { current: document.createElement('input') };
        const onPlaceSelect = vi.fn();

        render(
            <ThemeProvider theme={theme}>
                <PlaceAutocomplete inputRef={inputRef} onPlaceSelect={onPlaceSelect} />
            </ThemeProvider>
        );

        expect(mockAutocomplete).toHaveBeenCalledWith(inputRef.current);
    });

    it('renders input with correct placeholder', () => {
        const inputRef = { current: null };
        const onPlaceSelect = vi.fn();

        render(
            <ThemeProvider theme={theme}>
                <PlaceAutocomplete inputRef={inputRef as any} onPlaceSelect={onPlaceSelect} />
            </ThemeProvider>
        );

        expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
    });
});
