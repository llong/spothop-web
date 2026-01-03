import { useEffect } from "react";
import { InputBase } from "@mui/material";
import { styled } from "@mui/material/styles";

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
    inputRef: React.RefObject<HTMLInputElement>;
    endAdornment?: React.ReactNode;
}

export const PlaceAutocomplete = ({ onPlaceSelect, inputRef, endAdornment }: PlaceAutocompleteProps) => {
    useEffect(() => {
        if (inputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                onPlaceSelect(place);
            });
        }
    }, [onPlaceSelect, inputRef]);

    return <StyledInputBase placeholder="Search…" fullWidth endAdornment={endAdornment} inputProps={{ 'aria-label': 'Search spots', ref: inputRef }} />;
}
