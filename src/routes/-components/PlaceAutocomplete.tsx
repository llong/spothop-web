import { useCallback, useEffect, useRef, useState } from "react";
import { InputBase } from "@mui/material";
import { styled } from "@mui/material/styles";
import { isGoogleMapsReady, loadGoogleMaps } from "@/lib/googleMaps";

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

        const autocomplete = new window.google.maps.places.Autocomplete(inputElement);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                const pacContainers = Array.from(document.querySelectorAll<HTMLElement>('.pac-container'));
                const visibleContainer = pacContainers.find(
                    (c) => c.style.display !== 'none' && window.getComputedStyle(c).display !== 'none'
                );

                if (visibleContainer) {
                    const pacItems = visibleContainer.querySelectorAll<HTMLElement>('.pac-item');
                    if (pacItems.length > 0) {
                        // 1. Check if an item is hovered by mouse
                        const hoveredItem =
                            visibleContainer.querySelector<HTMLElement>('.pac-item:hover') ||
                            visibleContainer.querySelector<HTMLElement>(':hover')?.closest<HTMLElement>('.pac-item');

                        if (hoveredItem) {
                            event.preventDefault();
                            event.stopPropagation();
                            hoveredItem.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            hoveredItem.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                            hoveredItem.click();
                            return;
                        }

                        // 2. Check if an item is selected via arrow keys
                        const selectedItem = visibleContainer.querySelector<HTMLElement>('.pac-item-selected');
                        if (!selectedItem) {
                            const downEvent = new KeyboardEvent('keydown', {
                                key: 'ArrowDown',
                                code: 'ArrowDown',
                                keyCode: 40,
                                which: 40,
                                bubbles: true,
                                cancelable: true,
                            });
                            Object.defineProperty(downEvent, 'keyCode', { value: 40 });
                            Object.defineProperty(downEvent, 'which', { value: 40 });
                            inputElement.dispatchEvent(downEvent);
                        }
                    }
                }
            }
        };

        inputElement.addEventListener('keydown', handleKeyDown, true);

        const listener = autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place) {
                if (place.geometry?.location) {
                    onPlaceSelectRef.current(place);
                } else if ((place.name || inputElement.value) && window.google?.maps?.Geocoder) {
                    const query = place.name || inputElement.value;
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ address: query }, (results, status) => {
                        if (status === 'OK' && results && results[0]) {
                            onPlaceSelectRef.current(results[0] as unknown as google.maps.places.PlaceResult);
                        }
                    });
                }
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
