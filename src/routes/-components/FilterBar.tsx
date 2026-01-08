import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Slider,
    ToggleButton,
    ToggleButtonGroup,
    Switch,
    FormControlLabel,
    Stack,
    Collapse,
    Paper,
    Button,
    Popover
} from '@mui/material';
import { useAtom } from 'jotai';
import type { SpotFilters } from 'src/types';
import { isFiltersOpenAtom } from 'src/atoms/spots';

interface FilterBarProps {
    filters: SpotFilters;
    onFiltersChange: (filters: SpotFilters) => void;
    anchorEl?: HTMLElement | null;
}

export const FilterBar = ({ filters, onFiltersChange, anchorEl }: FilterBarProps) => {
    const [isFiltersOpen, setIsFiltersOpen] = useAtom(isFiltersOpenAtom);

    const handleTypeChange = (_: React.MouseEvent<HTMLElement>, newFormats: string[]) => {
        onFiltersChange({ ...filters, spot_type: newFormats });
    };

    const handleDifficultyChange = (event: any) => {
        onFiltersChange({ ...filters, difficulty: event.target.value });
    };

    const handleKickoutChange = (_: Event, newValue: number | number[]) => {
        onFiltersChange({ ...filters, kickout_risk: newValue as number });
    };

    const handleLitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, is_lit: event.target.checked });
    };

    const activeFilterCount = [
        filters.difficulty && filters.difficulty !== 'all',
        filters.spot_type && filters.spot_type.length > 0,
        filters.is_lit,
        filters.kickout_risk !== undefined && filters.kickout_risk < 10
    ].filter(Boolean).length;

    return (
        <Popover
            open={isFiltersOpen}
            anchorEl={anchorEl}
            onClose={() => setIsFiltersOpen(false)}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            PaperProps={{
                sx: {
                    p: 2,
                    mt: 1,
                    width: 300,
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    borderRadius: 2
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Filters</Typography>
            </Box>

            <Stack spacing={3}>
                <FormControl fullWidth size="small">
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                        value={filters.difficulty || 'all'}
                        label="Difficulty"
                        onChange={handleDifficultyChange}
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="beginner">Beginner</MenuItem>
                        <MenuItem value="intermediate">Intermediate</MenuItem>
                        <MenuItem value="advanced">Advanced</MenuItem>
                    </Select>
                </FormControl>

                <Box>
                    <Typography variant="caption" gutterBottom fontWeight={600} display="block">
                        Spot Type
                    </Typography>
                    <ToggleButtonGroup
                        value={filters.spot_type || []}
                        onChange={handleTypeChange}
                        aria-label="spot type"
                        size="small"
                        sx={{ flexWrap: 'wrap', gap: 0.5 }}
                    >
                        {['rail', 'ledge', 'gap', 'wall_ride', 'skatepark', 'manual_pad'].map((type) => (
                            <ToggleButton key={type} value={type} sx={{ textTransform: 'capitalize', fontSize: '0.7rem', py: 0.5, px: 1 }}>
                                {type.replace('_', ' ')}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                <FormControlLabel
                    control={
                        <Switch
                            checked={!!filters.is_lit}
                            onChange={handleLitChange}
                            size="small"
                        />
                    }
                    label={<Typography variant="body2">Lit at Night Only</Typography>}
                />

                <Box>
                    <Typography variant="caption" gutterBottom fontWeight={600} display="block">
                        Max Kickout Risk: {filters.kickout_risk || 10}
                    </Typography>
                    <Slider
                        value={filters.kickout_risk || 10}
                        onChange={handleKickoutChange}
                        min={1}
                        max={10}
                        step={1}
                        valueLabelDisplay="auto"
                        size="small"
                    />
                </Box>

                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onFiltersChange({})}
                    disabled={activeFilterCount === 0}
                    fullWidth
                >
                    Reset Filters
                </Button>
            </Stack>
        </Popover>
    );
};
