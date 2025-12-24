import { Box, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';

interface SpotCreatorInfoProps {
    createdAt?: string;
    username?: string;
}

export const SpotCreatorInfo = ({ createdAt, username }: SpotCreatorInfoProps) => {
    const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : '';

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            {createdAt && (
                <Typography variant="body2" color="text.secondary">
                    Added on {formattedDate}
                </Typography>
            )}

            {username && (
                <Typography variant="body2">
                    Created by{' '}
                    <Link
                        to="/profile/$username"
                        params={{ username }}
                        style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
                    >
                        @{username}
                    </Link>
                </Typography>
            )}
        </Box>
    );
};
