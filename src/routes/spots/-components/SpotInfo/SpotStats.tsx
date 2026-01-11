import { Stack, Box, Typography } from '@mui/material';

interface SpotStatsProps {
    difficulty?: string;
    kickoutRisk?: number;
    isLit?: boolean;
}

export const SpotStats = ({
    difficulty,
    kickoutRisk,
    isLit
}: SpotStatsProps) => {
    return (
        <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
            {difficulty && (
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Difficulty
                    </Typography>
                </Box>
            )}
            {kickoutRisk !== undefined && (
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        {kickoutRisk}/10
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Kickout Risk
                    </Typography>
                </Box>
            )}
            {isLit !== undefined && (
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        {isLit ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Lit at Night
                    </Typography>
                </Box>
            )}
        </Stack>
    );
};
