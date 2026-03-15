import { useEffect } from "react";
import { InputBase, GlobalStyles } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAtomValue } from "jotai";
import { isGoogleMapsLoadedAtom } from "src/atoms/map";

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: theme.palette.text.primary,
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
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
    const isLoaded = useAtomValue(isGoogleMapsLoadedAtom);

    useEffect(() => {
        if (isLoaded && inputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                onPlaceSelect(place);
            });

            return () => {
                window.google.maps.event.clearInstanceListeners(autocomplete);
            };
        }
    }, [isLoaded, onPlaceSelect, inputRef]);

    return (
        <>
            <GlobalStyles styles={(theme) => ({
                '.pac-container': {
                    backgroundColor: theme.palette.background.paper,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                    boxShadow: theme.shadows[4],
                },
                '.pac-item': {
                    borderTop: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                    }
                },
                '.pac-item-query': {
                    color: theme.palette.text.primary,
                },
                '.pac-matched': {
                    color: theme.palette.text.primary,
                },
                '.pac-logo:after': {
                     // Can't easily change the logo without a custom image, but doing our best
                     display: theme.palette.mode === 'dark' ? 'none' : 'block'
                }
            })} />
            <StyledInputBase placeholder={placeholder} fullWidth endAdornment={endAdornment} inputProps={{ 'aria-label': 'Search spots', ref: inputRef }} />
        </>
    );
}
