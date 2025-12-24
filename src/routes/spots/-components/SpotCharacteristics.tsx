import {
    Box,
    Typography,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    FormControlLabel,
    Switch,
    Slider
} from '@mui/material';

interface SpotCharacteristicsProps {
    spotType: string[];
    setSpotType: (types: string[]) => void;
    difficulty: string;
    setDifficulty: (difficulty: string) => void;
    isLit: boolean;
    setIsLit: (isLit: boolean) => void;
    kickoutRisk: number;
    setKickoutRisk: (risk: number) => void;
}

export const SpotCharacteristics = ({
    spotType,
    setSpotType,
    difficulty,
    setDifficulty,
    isLit,
    setIsLit,
    kickoutRisk,
    setKickoutRisk
}: SpotCharacteristicsProps) => {
    return (
        <>
            <Divider />

            <Box>
                <Typography variant="subtitle2" gutterBottom>Spot Type</Typography>
                <ToggleButtonGroup
                    value={spotType}
                    onChange={(_, newFormats) => setSpotType(newFormats)}
                    aria-label="spot type"
                    color="primary"
                    size="small"
                    sx={{ flexWrap: 'wrap', display: 'flex', gap: 1, '& .MuiToggleButton-root': { border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '16px !important', px: 2 } }}
                >
                    {['rail', 'ledge', 'gap', 'wall_ride', 'skatepark', 'manual_pad'].map((type) => (
                        <ToggleButton key={type} value={type} sx={{ textTransform: 'capitalize' }}>
                            {type.replace('_', ' ')}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                        <InputLabel>Difficulty</InputLabel>
                        <Select
                            value={difficulty}
                            label="Difficulty"
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <MenuItem value="beginner">
                                <Chip label="Beginner" color="success" size="small" sx={{ mr: 1 }} />
                            </MenuItem>
                            <MenuItem value="intermediate">
                                <Chip label="Intermediate" color="warning" size="small" sx={{ mr: 1 }} />
                            </MenuItem>
                            <MenuItem value="advanced">
                                <Chip label="Advanced" color="error" size="small" sx={{ mr: 1 }} />
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ border: '1px solid #c4c4c4', borderRadius: 1, p: 1, px: 2, height: '56px', display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={<Switch checked={isLit} onChange={(e) => setIsLit(e.target.checked)} />}
                            label="Lit at Night"
                            sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Kickout Risk</Typography>
                    <Chip
                        label={kickoutRisk <= 1 ? 'Low' : kickoutRisk <= 3 ? 'Medium' : 'High'}
                        color={kickoutRisk <= 1 ? 'success' : kickoutRisk <= 3 ? 'warning' : 'error'}
                        size="small"
                    />
                </Box>
                <Slider
                    value={kickoutRisk}
                    onChange={(_, value) => setKickoutRisk(value as number)}
                    step={1}
                    marks
                    min={1}
                    max={5}
                    valueLabelDisplay="auto"
                    sx={{
                        color: kickoutRisk <= 1 ? 'success.main' : kickoutRisk <= 3 ? 'warning.main' : 'error.main'
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Chill (1)</Typography>
                    <Typography variant="caption" color="text.secondary">Instant Kickout (5)</Typography>
                </Box>
            </Box>
        </>
    );
};
