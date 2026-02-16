import { Box, Typography, Slider } from '@mui/material';

interface RiskFilterProps {
    maxRisk: number;
    onChange: (value: number) => void;
}

export const RiskFilter = ({ maxRisk, onChange }: RiskFilterProps) => {
    return (
        <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Maximum Kickout Risk: {maxRisk}
            </Typography>
            <Box sx={{ px: 1 }}>
                <Slider
                    value={maxRisk}
                    onChange={(_, val) => onChange(val as number)}
                    min={1}
                    max={5}
                    marks
                    valueLabelDisplay="auto"
                />
            </Box>
        </Box>
    );
};
