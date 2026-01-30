import { useState } from 'react';
import {
    Box,
    Typography,
    Stack,
    Slider,
    Switch,
    FormControlLabel,
    Button,
    Divider,
    IconButton,
    Paper,
    Chip,
    Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { INITIAL_FEED_FILTERS } from 'src/atoms/feed';
import type { FeedFilters } from 'src/atoms/feed';
import { UserSearchInput } from './UserSearchInput';
import { PlaceAutocomplete } from 'src/routes/-components/PlaceAutocomplete';
import { useRef } from 'react';

interface FeedFilterPanelProps {
    filters: FeedFilters;
    onApply: (filters: FeedFilters) => void;
    onClose: () => void;
}

export const FeedFilterPanel = ({ filters: initialFilters, onApply, onClose }: FeedFilterPanelProps) => {
    const [tempFilters, setTempFilters] = useState<FeedFilters>(initialFilters);
    const locationInputRef = useRef<HTMLInputElement | null>(null);

    const handleApply = () => {
        onApply(tempFilters);
    };

    const handleReset = () => {
        setTempFilters(INITIAL_FEED_FILTERS);
        if (locationInputRef.current) {
            locationInputRef.current.value = '';
        }
        onApply(INITIAL_FEED_FILTERS);
    };

    const toggleArrayItem = (array: string[], item: string) => {
        return array.includes(item) 
            ? array.filter(i => i !== item)
            : [...array, item];
    };

    const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
        if (place.geometry?.location) {
            setTempFilters(prev => ({
                ...prev,
                nearMe: false, // Disable near me when explicit location is selected
                selectedLocation: {
                    lat: place.geometry!.location!.lat(),
                    lng: place.geometry!.location!.lng(),
                    name: place.name || 'Selected Location'
                }
            }));
        }
    };

    const spotTypes = ['rail', 'ledge', 'gap', 'wall_ride', 'skatepark', 'manual_pad'];
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    const riderTypes = ['skateboard', 'inline', 'bmx', 'scooter'];

    return (
        <Paper sx={{ p: 3, borderRadius: '20px 20px 0 0', height: '100%', overflowY: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={800}>Feed Filters</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Stack>

            <Stack spacing={4} sx={{ pb: 10 }}>
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Search by User
                    </Typography>
                    {tempFilters.author ? (
                        <Chip
                            avatar={<Avatar src={tempFilters.author.avatarUrl || undefined} alt={tempFilters.author.username} />}
                            label={`@${tempFilters.author.username}`}
                            onDelete={() => setTempFilters(f => ({ ...f, author: undefined }))}
                            color="primary"
                            variant="outlined"
                            sx={{ borderRadius: '16px' }}
                        />
                    ) : (
                        <UserSearchInput 
                            value={tempFilters.author}
                            onChange={(user) => setTempFilters(f => ({ ...f, author: user || undefined }))}
                        />
                    )}
                </Box>

                <Divider />

                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Location
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={tempFilters.nearMe}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setTempFilters(f => ({ 
                                            ...f, 
                                            nearMe: checked,
                                            selectedLocation: checked ? undefined : f.selectedLocation 
                                        }));
                                        if (checked && locationInputRef.current) {
                                            locationInputRef.current.value = '';
                                        }
                                    }}
                                />
                            }
                            label="Near Me"
                        />
                    </Stack>
                    
                    {!tempFilters.nearMe && (
                        <Box sx={{ mb: 2 }}>
                            <PlaceAutocomplete 
                                onPlaceSelect={handlePlaceSelect}
                                inputRef={locationInputRef}
                            />
                            {tempFilters.selectedLocation && (
                                <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                                    Selected: {tempFilters.selectedLocation.name}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Box sx={{ px: 1, mt: 2, opacity: (tempFilters.nearMe || tempFilters.selectedLocation) ? 1 : 0.5 }}>
                        <Typography variant="caption" gutterBottom>
                            Search Distance: {tempFilters.maxDistKm} km
                        </Typography>
                        <Slider
                            disabled={!tempFilters.nearMe && !tempFilters.selectedLocation}
                            value={tempFilters.maxDistKm}
                            onChange={(_, val) => setTempFilters(f => ({ ...f, maxDistKm: val as number }))}
                            min={1}
                            max={500}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </Box>

                <Divider />

                <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Spot Types
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {spotTypes.map(type => (
                            <Chip
                                key={type}
                                label={type.replace('_', ' ').toUpperCase()}
                                onClick={() => setTempFilters(f => ({ ...f, spotTypes: toggleArrayItem(f.spotTypes, type) }))}
                                color={tempFilters.spotTypes.includes(type) ? "primary" : "default"}
                                variant={tempFilters.spotTypes.includes(type) ? "filled" : "outlined"}
                                size="small"
                            />
                        ))}
                    </Box>
                </Box>

                <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Difficulty
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {difficulties.map(diff => (
                            <Chip
                                key={diff}
                                label={diff.toUpperCase()}
                                onClick={() => setTempFilters(f => ({ ...f, difficulties: toggleArrayItem(f.difficulties, diff) }))}
                                color={tempFilters.difficulties.includes(diff) ? "primary" : "default"}
                                variant={tempFilters.difficulties.includes(diff) ? "filled" : "outlined"}
                                size="small"
                            />
                        ))}
                    </Box>
                </Box>

                <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Rider Type
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {riderTypes.map(type => (
                            <Chip
                                key={type}
                                label={type.toUpperCase()}
                                onClick={() => setTempFilters(f => ({ ...f, riderTypes: toggleArrayItem(f.riderTypes, type) }))}
                                color={tempFilters.riderTypes.includes(type) ? "primary" : "default"}
                                variant={tempFilters.riderTypes.includes(type) ? "filled" : "outlined"}
                                size="small"
                            />
                        ))}
                    </Box>
                </Box>

                <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Maximum Kickout Risk: {tempFilters.maxRisk}
                    </Typography>
                    <Box sx={{ px: 1 }}>
                        <Slider
                            value={tempFilters.maxRisk}
                            onChange={(_, val) => setTempFilters(f => ({ ...f, maxRisk: val as number }))}
                            min={1}
                            max={5}
                            marks
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </Box>

                <Box sx={{ pt: 2, display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        fullWidth 
                        onClick={handleReset}
                        sx={{ borderRadius: 10 }}
                    >
                        Reset
                    </Button>
                    <Button 
                        variant="contained" 
                        fullWidth 
                        onClick={handleApply}
                        sx={{ borderRadius: 10, fontWeight: 700 }}
                    >
                        Apply Filters
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
};