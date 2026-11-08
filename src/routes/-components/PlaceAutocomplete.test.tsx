import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createStore, Provider } from 'jotai';
import { userLocationAtom } from '@/atoms/map';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const geocode = vi.fn();
const mockGeocoder = vi.fn().mockImplementation(function () {
    return { geocode };
});

const textSearch = vi.fn();
const mockPlacesService = vi.fn().mockImplementation(function () {
    return { textSearch };
});
const setBounds = vi.fn();

let placeChangedListener: (() => void) | null = null;
const mockAutocomplete = vi.fn().mockImplementation(function () {
    return {
        addListener: vi.fn().mockImplementation((event, callback) => {
            if (event === 'place_changed') placeChangedListener = callback;
            return { remove: vi.fn() };
        }),
        setBounds,
        getPlace: vi.fn().mockReturnValue({ geometry: { location: { lat: () => 1, lng: () => 2 } } }),
    };
});

const mockGoogle = {
    maps: {
        places: { Autocomplete: mockAutocomplete, PlacesService: mockPlacesService, PlacesServiceStatus: { OK: 'OK' } },
        event: { clearInstanceListeners: vi.fn(), removeListener: vi.fn() },
        Geocoder: mockGeocoder,
        LatLngBounds: vi.fn().mockImplementation(function (sw, ne) {
            return { sw, ne };
        }),
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
        await waitFor(() => expect(mockAutocomplete).toHaveBeenCalledWith(inputRef.current, expect.objectContaining({ fields: expect.any(Array) })));
        expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    });

    it('initializes immediately when Google Maps is already loaded', () => {
        (window as any).google = mockGoogle;
        loaderMocks.isGoogleMapsReady.mockReturnValue(true);
        const inputRef = { current: null as HTMLInputElement | null };

        renderComponent(inputRef);

        expect(mockAutocomplete).toHaveBeenCalledWith(inputRef.current, expect.objectContaining({ fields: expect.any(Array) }));
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

    it('does NOT pick the first suggestion when Enter is pressed with nothing highlighted', () => {
        (window as any).google = mockGoogle;
        loaderMocks.isGoogleMapsReady.mockReturnValue(true);
        const inputRef = { current: null as HTMLInputElement | null };
        renderComponent(inputRef);

        const pacContainer = document.createElement('div');
        pacContainer.className = 'pac-container';
        pacContainer.style.display = 'block';
        const pacItem = document.createElement('div');
        pacItem.className = 'pac-item';
        pacItem.click = vi.fn();
        pacContainer.appendChild(pacItem);
        document.body.appendChild(pacContainer);

        const dispatched: string[] = [];
        const original = inputRef.current!.dispatchEvent.bind(inputRef.current!);
        vi.spyOn(inputRef.current!, 'dispatchEvent').mockImplementation((event: Event) => {
            dispatched.push(event.type + ':' + ((event as KeyboardEvent).key ?? ''));
            return original(event);
        });

        fireEvent.keyDown(inputRef.current!, { key: 'Enter', code: 'Enter' });

        expect(dispatched).not.toContain('keydown:ArrowDown');
        expect(pacItem.click).not.toHaveBeenCalled();

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

    describe('Enter without choosing a suggestion', () => {
        const setup = (typed: string, store = createStore()) => {
            (window as any).google = mockGoogle;
            loaderMocks.isGoogleMapsReady.mockReturnValue(true);
            const inputRef = { current: null as HTMLInputElement | null };
            const onPlaceSelect = vi.fn();
            mockAutocomplete.mockImplementationOnce(function () {
                return {
                    addListener: vi.fn().mockImplementation((_event, callback) => {
                        placeChangedListener = callback;
                        return { remove: vi.fn() };
                    }),
                    setBounds,
                    getPlace: vi.fn().mockReturnValue({ name: typed }), // the widget only reports the typed text
                };
            });
            render(
                <Provider store={store}>
                    <ThemeProvider theme={theme}>
                        <PlaceAutocomplete inputRef={inputRef} onPlaceSelect={onPlaceSelect} />
                    </ThemeProvider>
                </Provider>
            );
            inputRef.current!.value = typed;
            return { onPlaceSelect };
        };

        it('searches for exactly what was typed (text search) and selects the result', async () => {
            textSearch.mockImplementation((_req, cb) => cb([{ name: 'Ormond Spencer Park', geometry: { location: {} } }], 'OK'));
            const { onPlaceSelect } = setup('ormand spencer park');

            placeChangedListener?.();

            await waitFor(() => expect(onPlaceSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ormond Spencer Park' })));
            expect(textSearch).toHaveBeenCalledWith(expect.objectContaining({ query: 'ormand spencer park' }), expect.any(Function));
        });

        it('falls back to the geocoder (for addresses) when text search finds nothing', async () => {
            textSearch.mockImplementation((_req, cb) => cb([], 'ZERO_RESULTS'));
            geocode.mockImplementation((_req, cb) => cb([{ geometry: { location: {} }, name: 'Geocoded Place' }], 'OK'));
            const { onPlaceSelect } = setup('123 Main St');

            placeChangedListener?.();

            await waitFor(() => expect(onPlaceSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Geocoded Place' })));
        });

        it('biases the lookup near the user', async () => {
            textSearch.mockImplementation((_req, cb) => cb([{ name: 'X', geometry: { location: {} } }], 'OK'));
            const store = createStore();
            store.set(userLocationAtom, { latitude: 43.05, longitude: -76.15 });
            setup('park', store);

            placeChangedListener?.();

            await waitFor(() => expect(textSearch).toHaveBeenCalled());
            expect(textSearch.mock.calls[0][0]).toMatchObject({ location: { lat: 43.05, lng: -76.15 }, radius: 50000 });
        });

        it('does nothing for empty input', () => {
            const { onPlaceSelect } = setup('   ');
            placeChangedListener?.();
            expect(textSearch).not.toHaveBeenCalled();
            expect(onPlaceSelect).not.toHaveBeenCalled();
        });
    });

    describe('suggestion bias', () => {
        it('requests only the needed fields and favors results around the user', () => {
            (window as any).google = mockGoogle;
            loaderMocks.isGoogleMapsReady.mockReturnValue(true);
            const store = createStore();
            store.set(userLocationAtom, { latitude: 43.05, longitude: -76.15 });
            const inputRef = { current: null as HTMLInputElement | null };

            render(
                <Provider store={store}>
                    <ThemeProvider theme={theme}>
                        <PlaceAutocomplete inputRef={inputRef} onPlaceSelect={vi.fn()} />
                    </ThemeProvider>
                </Provider>
            );

            expect(mockAutocomplete).toHaveBeenCalledWith(inputRef.current, { fields: ['geometry', 'name', 'formatted_address', 'types'] });
            expect(setBounds).toHaveBeenCalledTimes(1);
            const { sw, ne } = setBounds.mock.calls[0][0];
            expect(sw.lat).toBeLessThan(43.05);
            expect(ne.lat).toBeGreaterThan(43.05);
            expect(sw.lng).toBeLessThan(-76.15);
            expect(ne.lng).toBeGreaterThan(-76.15);
        });

        it('updates the bias when the user location becomes known later', async () => {
            (window as any).google = mockGoogle;
            loaderMocks.isGoogleMapsReady.mockReturnValue(true);
            const store = createStore();
            render(
                <Provider store={store}>
                    <ThemeProvider theme={theme}>
                        <PlaceAutocomplete inputRef={{ current: null }} onPlaceSelect={vi.fn()} />
                    </ThemeProvider>
                </Provider>
            );
            expect(setBounds).not.toHaveBeenCalled();

            store.set(userLocationAtom, { latitude: 43.05, longitude: -76.15 });

            await waitFor(() => expect(setBounds).toHaveBeenCalledTimes(1));
        });

        it('does not bias when no location is known', () => {
            (window as any).google = mockGoogle;
            loaderMocks.isGoogleMapsReady.mockReturnValue(true);
            renderComponent({ current: null });
            expect(setBounds).not.toHaveBeenCalled();
        });
    });
});
