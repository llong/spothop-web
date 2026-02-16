import {
    Box,
    Typography,
    Stack,
    Slider,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { PlaceAutocomplete } from 'src/routes/-components/PlaceAutocomplete';
import { useGeolocation } from 'src/hooks/useGeolocation';
import { type FeedFilters } from 'src/atoms/feed';
import { type MutableRefObject } from 'react';

interface LocationFilterProps {
    nearMe: boolean;
    selectedLocation: FeedFilters['selectedLocation'];
    maxDistKm: number;
    locationInputRef: MutableRefObject<HTMLInputElement | null>;
    onNearMeChange: (checked: boolean) => void;
    onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
    onDistChange: (val: number) => void;
}

export const LocationFilter = ({
    nearMe,
    selectedLocation,
    maxDistKm,
    locationInputRef,
    onNearMeChange,
    onPlaceSelect,
    onDistChange,
}: LocationFilterProps) => {
    const { centerMapOnUser } = useGeolocation(null);

    const handleToggleNearMe = async (checked: boolean) => {
        if (checked) {
            const userLocation = await centerMapOnUser();
            if (userLocation) {
                onNearMeChange(true);
            } else {
                // If permission denied or error, revert switch state (effectively do nothing as it was false)
                onNearMeChange(false);
            }
        } else {
            onNearMeChange(false);
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                    Location
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={nearMe}
                            onChange={(e) => handleToggleNearMe(e.target.checked)}
                        />
                    }
                    label="Near Me"
                />
            </Stack>

            {!nearMe && (
                <Box sx={{ mb: 2 }}>
                    <PlaceAutocomplete
                        onPlaceSelect={onPlaceSelect}
                        inputRef={locationInputRef}
                    />
                    {selectedLocation && (
                        <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                            Selected: {selectedLocation.name}
                        </Typography>
                    )}
                </Box>
            )}

            <Box sx={{ px: 1, mt: 2, opacity: (nearMe || selectedLocation) ? 1 : 0.5 }}>
                <Typography variant="caption" gutterBottom>
                    Search Distance: {maxDistKm} km
                </Typography>
                <Slider
                    disabled={!nearMe && !selectedLocation}
                    value={maxDistKm}
                    onChange={(_, val) => onDistChange(val as number)}
                    min={1}
                    max={500}
                    valueLabelDisplay="auto"
                />
            </Box>
        </Box>
    );
};
