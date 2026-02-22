import {
    Grid,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    FormControlLabel,
    Switch,
    Slider,
    Box,
    Divider,
} from '@mui/material';
import { SearchInput } from '@/components/SearchInput/SearchInput';
import type { Contest } from '../../../types';

interface ContestSubmissionCriteriaFieldsProps {
    formData: Partial<Contest>;
    onCriteriaChange: (key: any, value: any) => void;
    radiusUnit: 'km' | 'miles';
    onRadiusUnitChange: (unit: 'km' | 'miles') => void;
    onLocationSearch: (loc: any) => void;
}

export function ContestSubmissionCriteriaFields({
    formData,
    onCriteriaChange,
    radiusUnit,
    onRadiusUnitChange,
    onLocationSearch,
}: ContestSubmissionCriteriaFieldsProps) {
    return (
        <>
            <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Submission Criteria</Typography></Grid>

            <Grid size={{ xs: 12 }}>
                <Typography variant="caption" display="block" gutterBottom color="text.secondary">Allowed Spot Types</Typography>
                <ToggleButtonGroup
                    value={formData.criteria?.allowed_spot_types || []}
                    onChange={(_, val) => onCriteriaChange('allowed_spot_types', val)}
                    size="small"
                    sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                    {['rail', 'ledge', 'gap', 'wall_ride', 'skatepark', 'manual_pad'].map(t => (
                        <ToggleButton key={t} value={t} sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>{t}</ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Typography variant="caption" display="block" gutterBottom color="text.secondary">Allowed Rider Types</Typography>
                <ToggleButtonGroup
                    value={formData.criteria?.allowed_rider_types || []}
                    onChange={(_, val) => onCriteriaChange('allowed_rider_types', val)}
                    size="small"
                    sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                    {['inline', 'skateboard', 'bmx', 'scooter'].map(t => (
                        <ToggleButton key={t} value={t} sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>{t}</ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Typography variant="caption" display="block" gutterBottom color="text.secondary">Allowed Difficulties</Typography>
                <ToggleButtonGroup
                    value={formData.criteria?.allowed_difficulties || []}
                    onChange={(_, val) => onCriteriaChange('allowed_difficulties', val)}
                    size="small"
                    sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                    {['beginner', 'intermediate', 'advanced'].map(t => (
                        <ToggleButton key={t} value={t} sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>{t}</ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.criteria?.allowed_is_lit === true}
                            onChange={(e) => onCriteriaChange('allowed_is_lit', e.target.checked)}
                        />
                    }
                    label="Must be Lit"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ px: 1 }}>
                    <Typography variant="caption" color="text.secondary">Max Kickout Risk: {formData.criteria?.allowed_kickout_risk_max ?? 5}</Typography>
                    <Slider
                        value={formData.criteria?.allowed_kickout_risk_max ?? 5}
                        min={1}
                        max={5}
                        step={1}
                        marks
                        onChange={(_, val) => onCriteriaChange('allowed_kickout_risk_max', val as number)}
                    />
                </Box>
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Location Restrictions</Typography></Grid>

            <Grid size={{ xs: 12 }}>
                <Typography variant="caption" display="block" gutterBottom color="text.secondary">Center Location</Typography>
                <SearchInput
                    onSearch={(_, loc) => onLocationSearch(loc)}
                    placeholder="Search for center location..."
                />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flexGrow: 1, px: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Radius: {radiusUnit === 'miles'
                                ? ((formData.criteria?.location_radius_km || 0) / 1.60934).toFixed(1)
                                : (formData.criteria?.location_radius_km || 0).toFixed(1)} {radiusUnit}
                        </Typography>
                        <Slider
                            value={radiusUnit === 'miles' ? (formData.criteria?.location_radius_km || 0) / 1.60934 : (formData.criteria?.location_radius_km || 0)}
                            min={0}
                            max={100}
                            onChange={(_, val) => {
                                const km = radiusUnit === 'miles' ? (val as number) * 1.60934 : (val as number);
                                onCriteriaChange('location_radius_km', km);
                            }}
                        />
                    </Box>
                    <ToggleButtonGroup
                        value={radiusUnit}
                        exclusive
                        onChange={(_, val) => val && onRadiusUnitChange(val)}
                        size="small"
                    >
                        <ToggleButton value="miles">Miles</ToggleButton>
                        <ToggleButton value="km">KM</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Grid>
        </>
    );
}
