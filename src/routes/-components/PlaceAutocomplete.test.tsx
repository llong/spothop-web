import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const mockAutocomplete = vi.fn().mockImplementation(function () {
    return {
        addListener: vi.fn(),
        getPlace: vi.fn().mockReturnValue({ geometry: { location: { lat: () => 1, lng: () => 2 } } }),
    };
});

const mockGoogle = {
    maps: {
        places: { Autocomplete: mockAutocomplete },
        event: { clearInstanceListeners: vi.fn() },
    },
};

const loaderMocks = vi.hoisted(() => ({
    isGoogleMapsReady: vi.fn(),
    loadGoogleMaps: vi.fn(),
}));
vi.mock('@/lib/googleMaps', () => loaderMocks);

const theme = createTheme();

const renderComponent = (inputRef: any) =>
    render(
        <ThemeProvider theme={theme}>
            <PlaceAutocomplete inputRef={inputRef} onPlaceSelect={vi.fn()} />
        </ThemeProvider>
    );

describe('PlaceAutocomplete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete (window as any).google;
        loaderMocks.isGoogleMapsReady.mockReturnValue(false);
        loaderMocks.loadGoogleMaps.mockImplementation(() => {
            (window as any).google = mockGoogle;
            return Promise.resolve();
        });
    });

    it('does not load Google Maps on mount', () => {
        renderComponent({ current: null });
        expect(loaderMocks.loadGoogleMaps).not.toHaveBeenCalled();
        expect(mockAutocomplete).not.toHaveBeenCalled();
    });

    it('loads Google Maps on first focus and then initializes Autocomplete', async () => {
        const inputRef = { current: null as HTMLInputElement | null };
        renderComponent(inputRef);

        fireEvent.focus(screen.getByPlaceholderText('Search…'));

        expect(loaderMocks.loadGoogleMaps).toHaveBeenCalledTimes(1);
        // The component assigns the rendered <input> to inputRef.current
        await waitFor(() => expect(mockAutocomplete).toHaveBeenCalledWith(inputRef.current));
        expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    });

    it('initializes immediately when Google Maps is already loaded', () => {
        (window as any).google = mockGoogle;
        loaderMocks.isGoogleMapsReady.mockReturnValue(true);
        const inputRef = { current: null as HTMLInputElement | null };

        renderComponent(inputRef);

        expect(mockAutocomplete).toHaveBeenCalledWith(inputRef.current);
        expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
        expect(loaderMocks.loadGoogleMaps).not.toHaveBeenCalled();
    });

    it('stays usable as a plain input if loading fails', async () => {
        loaderMocks.loadGoogleMaps.mockRejectedValue(new Error('blocked'));
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        renderComponent({ current: document.createElement('input') });

        fireEvent.focus(screen.getByPlaceholderText('Search…'));

        await waitFor(() => expect(warn).toHaveBeenCalled());
        expect(mockAutocomplete).not.toHaveBeenCalled();
        expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
        warn.mockRestore();
    });

    it('renders input with correct placeholder', () => {
        renderComponent({ current: null });
        expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
    });
});
