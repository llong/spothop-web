import {
    Grid,
    TextField,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    FormControlLabel,
    Switch,
    MenuItem,
    Divider,
} from '@mui/material';
import type { Contest } from '../../../types';

interface ContestUsageRestrictionFieldsProps {
    formData: Partial<Contest>;
    onCriteriaChange: (key: any, value: any) => void;
}

export function ContestUsageRestrictionFields({ formData, onCriteriaChange }: ContestUsageRestrictionFieldsProps) {
    return (
        <>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label="Specific Spot ID Restriction (Optional)"
                    value={formData.criteria?.specific_spot_id || ''}
                    onChange={(e) => onCriteriaChange('specific_spot_id', e.target.value)}
                    helperText="Enter a spot UUID to restrict this contest to one location."
                />
            </Grid>

            <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Usage Restrictions</Typography></Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.criteria?.require_spot_creator_is_competitor === true}
                            onChange={(e) => onCriteriaChange('require_spot_creator_is_competitor', e.target.checked)}
                        />
                    }
                    label="Require Competitor Created the Spot"
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    select
                    fullWidth
                    label="Spot Creation Time Frame"
                    value={formData.criteria?.spot_creation_time_frame || 'anytime'}
                    onChange={(e) => onCriteriaChange('spot_creation_time_frame', e.target.value)}
                >
                    <MenuItem value="anytime">Anytime</MenuItem>
                    <MenuItem value="during_competition">During Competition</MenuItem>
                    <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                    <MenuItem value="last_60_days">Last 60 Days</MenuItem>
                    <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    select
                    fullWidth
                    label="Media Creation Time Frame"
                    value={formData.criteria?.media_creation_time_frame || 'anytime'}
                    onChange={(e) => onCriteriaChange('media_creation_time_frame', e.target.value)}
                >
                    <MenuItem value="anytime">Anytime</MenuItem>
                    <MenuItem value="during_competition">During Competition</MenuItem>
                    <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                    <MenuItem value="last_60_days">Last 60 Days</MenuItem>
                    <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Typography variant="caption" display="block" gutterBottom color="text.secondary">Allowed Media Types (Default: Video)</Typography>
                <ToggleButtonGroup
                    value={formData.criteria?.required_media_types || ['video']}
                    onChange={(_, val) => onCriteriaChange('required_media_types', val)}
                    size="small"
                    sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                    <ToggleButton value="video" sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>Video</ToggleButton>
                    <ToggleButton value="photo" sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>Photo</ToggleButton>
                </ToggleButtonGroup>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    fullWidth
                    label="Max Entries Per User"
                    type="number"
                    value={formData.criteria?.max_entries_per_user || 1}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onCriteriaChange('max_entries_per_user', isNaN(val) ? 1 : val);
                    }}
                    helperText="Set to 1 for typical contests, or more for multi-entry challenges."
                />
            </Grid>
        </>
    );
}
