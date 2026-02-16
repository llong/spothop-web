import { useState } from 'react';
import { TextField } from '@mui/material';

interface SearchInputProps {
    onSearch: (query: string, location?: { lat: number; lng: number }) => void;
    placeholder?: string;
}

export function SearchInput({ onSearch, placeholder }: SearchInputProps) {
    const [inputValue, setInputValue] = useState('');

    return (
        <TextField
            fullWidth
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    // Simple mock implementation: parse "lat,lng" or default to 0,0
                    const parts = inputValue.split(',').map(s => parseFloat(s.trim()));
                    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                        onSearch(inputValue, { lat: parts[0], lng: parts[1] });
                    } else {
                        // Just pass null location
                        onSearch(inputValue, undefined);
                    }
                }
            }}
            placeholder={placeholder || "Search location (enter 'lat,lng' and Enter)"}
            helperText="Enter 'latitude, longitude' and press Enter to set location coordinate"
        />
    );
}
