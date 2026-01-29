import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { useSocialStatsQuery } from 'src/hooks/useProfileQueries';

interface UserStatsProps {
    userId: string;
}

export const UserStats = ({ userId }: UserStatsProps) => {
    const { data: stats, isLoading } = useSocialStatsQuery(userId);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <Stack direction="row" spacing={4} justifyContent="space-around">
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={900}>
                    {stats?.followerCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    Followers
                </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={900}>
                    {stats?.followingCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    Following
                </Typography>
            </Box>
        </Stack>
    );
};