import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const mockGeocoder = vi.fn().mockImplementation(function () {
    return {
        geocode: vi.fn().mockImplementation((_req, callback) => {
            callback([{ geometry: { location: { lat: () => 3, lng: () => 4 } }, name: 'Geocoded Place' }], 'OK');
        }),
    };
});

let placeChangedListener: (() => void) | null = null;
const mockAutocomplete = vi.fn().mockImplementation(function () {
    return {
        addListener: vi.fn().mockImplementation((event, callback) => {
            if (event === 'place_changed') placeChangedListener = callback;
            return { remove: vi.fn() };
        }),
        getPlace: vi.fn().mockReturnValue({ geometry: { location: { lat: () => 1, lng: () => 2 } } }),
    };
});

const mockGoogle = {
    maps: {
        places: { Autocomplete: mockAutocomplete },
        event: { clearInstanceListeners: vi.fn(), removeListener: vi.fn() },
        Geocoder: mockGeocoder,
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

    it('simulates ArrowDown when Enter is pressed and suggestions exist without active selection', () => {
        (window as any).google = mockGoogle;
        loaderMocks.isGoogleMapsReady.mockReturnValue(true);
        const inputRef = { current: null as HTMLInputElement | null };
        renderComponent(inputRef);

        const pacContainer = document.createElement('div');
        pacContainer.className = 'pac-container';
        pacContainer.style.display = 'block';
        const pacItem = document.createElement('div');
        pacItem.className = 'pac-item';
        pacContainer.appendChild(pacItem);
        document.body.appendChild(pacContainer);

        const dispatchedEvents: KeyboardEvent[] = [];
        const originalDispatchEvent = inputRef.current!.dispatchEvent.bind(inputRef.current!);
        vi.spyOn(inputRef.current!, 'dispatchEvent').mockImplementation((event: Event) => {
            if (event instanceof KeyboardEvent && event.key === 'ArrowDown') {
                dispatchedEvents.push(event);
            }
            return originalDispatchEvent(event);
        });

        fireEvent.keyDown(inputRef.current!, { key: 'Enter', code: 'Enter' });

        expect(dispatchedEvents.length).toBe(1);
        expect(dispatchedEvents[0].key).toBe('ArrowDown');
        expect(dispatchedEvents[0].keyCode).toBe(40);

        document.body.removeChild(pacContainer);
    });

    it('clicks hovered option when Enter is pressed while mouse is hovering an option', () => {
        (window as any).google = mockGoogle;
        loaderMocks.isGoogleMapsReady.mockReturnValue(true);
        const inputRef = { current: null as HTMLInputElement | null };
        renderComponent(inputRef);

        const pacContainer = document.createElement('div');
        pacContainer.className = 'pac-container';
        pacContainer.style.display = 'block';
        const pacItem = document.createElement('div');
        pacItem.className = 'pac-item';
        pacContainer.appendChild(pacItem);
        document.body.appendChild(pacContainer);

        // Mock querySelector for :hover
        const clickSpy = vi.fn();
        pacItem.click = clickSpy;
        vi.spyOn(pacContainer, 'querySelector').mockImplementation((selector: string) => {
            if (selector.includes(':hover')) return pacItem;
            return null;
        });

        fireEvent.keyDown(inputRef.current!, { key: 'Enter', code: 'Enter' });

        expect(clickSpy).toHaveBeenCalled();

        document.body.removeChild(pacContainer);
    });

    it('falls back to Geocoder when place_changed fires without geometry', () => {
        (window as any).google = mockGoogle;
        loaderMocks.isGoogleMapsReady.mockReturnValue(true);
        const inputRef = { current: null as HTMLInputElement | null };
        const onPlaceSelect = vi.fn();

        mockAutocomplete.mockImplementationOnce(function () {
            return {
                addListener: vi.fn().mockImplementation((event, callback) => {
                    if (event === 'place_changed') placeChangedListener = callback;
                    return { remove: vi.fn() };
                }),
                getPlace: vi.fn().mockReturnValue({ name: 'Central Park' }),
            };
        });

        render(
            <ThemeProvider theme={theme}>
                <PlaceAutocomplete inputRef={inputRef} onPlaceSelect={onPlaceSelect} />
            </ThemeProvider>
        );

        // Call the placeChangedListener with no geometry
        placeChangedListener?.();

        expect(onPlaceSelect).toHaveBeenCalledWith(expect.objectContaining({
            geometry: expect.objectContaining({
                location: expect.any(Object),
            }),
            name: 'Geocoded Place',
        }));
    });
});
