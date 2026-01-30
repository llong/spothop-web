import { useEffect } from "react";
import { InputBase } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAtomValue } from "jotai";
import { isGoogleMapsLoadedAtom } from "src/atoms/map";

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
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
}

export const PlaceAutocomplete = ({ onPlaceSelect, inputRef, endAdornment }: PlaceAutocompleteProps) => {
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

    return <StyledInputBase placeholder="Search…" fullWidth endAdornment={endAdornment} inputProps={{ 'aria-label': 'Search spots', ref: inputRef }} />;
}
