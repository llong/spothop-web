import { useCallback, useEffect, useRef, useState } from "react";
import { InputBase } from "@mui/material";
import { styled } from "@mui/material/styles";
import { isGoogleMapsReady, loadGoogleMaps } from "@/lib/googleMaps";
import { useSearchBias, type LatLngLiteral } from "@/hooks/useSearchBias";

/** Results are favored (not restricted) within this distance of the user. */
const BIAS_RADIUS_M = 50_000;
/** Only request what the app uses: fewer fields means a cheaper Places lookup. */
const PLACE_FIELDS = ['geometry', 'name', 'formatted_address', 'types'];

const biasBounds = ({ lat, lng }: LatLngLiteral) => {
    const dLat = BIAS_RADIUS_M / 111_000;
    const dLng = dLat / Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
    return new window.google.maps.LatLngBounds({ lat: lat - dLat, lng: lng - dLng }, { lat: lat + dLat, lng: lng + dLng });
};

/**
 * Looks up exactly what the user typed (when they press Enter without choosing a suggestion), near `bias`.
 * Text search understands place names ("ormond spencer park"); the geocoder is the fallback for addresses.
 */
async function findPlace(query: string, bias: LatLngLiteral | null): Promise<google.maps.places.PlaceResult | null> {
    const { maps } = window.google;

    const byText = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
        new maps.places.PlacesService(document.createElement('div')).textSearch(
            { query, ...(bias && { location: bias, radius: BIAS_RADIUS_M }) },
            (results, status) => resolve(status === maps.places.PlacesServiceStatus.OK ? results?.[0] ?? null : null)
        );
    });
    if (byText) return byText;

    return new Promise((resolve) => {
        new maps.Geocoder().geocode(
            { address: query, ...(bias && { bounds: biasBounds(bias) }) },
            (results, status) => resolve(status === 'OK' && results?.[0] ? (results[0] as unknown as google.maps.places.PlaceResult) : null)
        );
    });
}

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: theme.palette.text.primary,
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(2.5)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        flexGrow: 1,
    },
    width: '100%',
}));

interface PlaceAutocompleteProps {
    onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    endAdornment?: React.ReactNode;
    placeholder?: string;
}

export const PlaceAutocomplete = ({ onPlaceSelect, inputRef, endAdornment, placeholder = "Search…" }: PlaceAutocompleteProps) => {
    const [isLoaded, setIsLoaded] = useState(isGoogleMapsReady);
    const onPlaceSelectRef = useRef(onPlaceSelect);
    onPlaceSelectRef.current = onPlaceSelect;
    const bias = useSearchBias();
    const biasRef = useRef(bias);
    biasRef.current = bias;
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // Load the Google Maps script lazily, the first time the user interacts with the input.
    const ensureLoaded = useCallback(() => {
        if (isLoaded) return;
        loadGoogleMaps()
            .then(() => setIsLoaded(true))
            .catch((error) => console.warn('Google Places unavailable:', error));
    }, [isLoaded]);

    useEffect(() => {
        const inputElement = inputRef.current;
        if (!isLoaded || !inputElement || !window.google?.maps?.places?.Autocomplete) return;

        const autocomplete = new window.google.maps.places.Autocomplete(inputElement, { fields: PLACE_FIELDS });
        autocompleteRef.current = autocomplete;

        // Enter picks the suggestion under the mouse. With nothing highlighted it must NOT pick the first
        // suggestion: that silently "corrects" what the user typed into something else.
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Enter') return;

            const visibleContainer = Array.from(document.querySelectorAll<HTMLElement>('.pac-container')).find(
                (c) => c.style.display !== 'none' && window.getComputedStyle(c).display !== 'none'
            );
            const hoveredItem =
                visibleContainer?.querySelector<HTMLElement>('.pac-item:hover') ||
                visibleContainer?.querySelector<HTMLElement>(':hover')?.closest<HTMLElement>('.pac-item');
            if (!hoveredItem) return;

            event.preventDefault();
            event.stopPropagation();
            hoveredItem.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            hoveredItem.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            hoveredItem.click();
        };

        inputElement.addEventListener('keydown', handleKeyDown, true);

        const listener = autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place?.geometry?.location) {
                onPlaceSelectRef.current(place);
                return;
            }
            // Enter without choosing a suggestion: search for exactly what was typed
            const query = inputElement.value.trim();
            if (query) {
                findPlace(query, biasRef.current).then((result) => result && onPlaceSelectRef.current(result));
            }
        });

        return () => {
            inputElement.removeEventListener('keydown', handleKeyDown, true);
            if (window.google?.maps?.event?.removeListener) {
                window.google.maps.event.removeListener(listener);
            }
            if (window.google?.maps?.event?.clearInstanceListeners) {
                window.google.maps.event.clearInstanceListeners(autocomplete);
            }
        };
    }, [isLoaded, inputRef]);

    // Favor suggestions near the user; re-applied when the location becomes known or the widget is (re)created
    useEffect(() => {
        if (bias && isLoaded && autocompleteRef.current) autocompleteRef.current.setBounds(biasBounds(bias));
    }, [bias, isLoaded]);

    return (
        <StyledInputBase
            placeholder={placeholder}
            fullWidth
            endAdornment={endAdornment}
            onFocus={ensureLoaded}
            onPointerEnter={ensureLoaded}
            inputProps={{ 'aria-label': 'Search spots', ref: inputRef }}
        />
    );
};
