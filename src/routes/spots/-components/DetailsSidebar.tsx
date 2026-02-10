import {
    Box,
    Typography,
    Stack,
    Button,
    Divider,
    Avatar,
} from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from '@tanstack/react-router';
import type { Spot } from 'src/types';

interface DetailsSidebarProps {
    spot: Spot;
    currentUserId?: string;
    isAdmin?: boolean;
    onDirections: () => void;
    onDelete: () => void;
}

export const DetailsSidebar = ({ spot, currentUserId, isAdmin, onDirections, onDelete }: DetailsSidebarProps) => {
    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.1em' }}>
                    Actions
                </Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<DirectionsIcon />}
                        onClick={onDirections}
                        sx={{
                            py: 1.5,
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' }
                        }}
                    >
                        Get Directions
                    </Button>

                    {(currentUserId === spot.created_by || isAdmin) && (
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={onDelete}
                            sx={{ py: 1 }}
                        >
                            Delete Spot {isAdmin && currentUserId !== spot.created_by && '(Admin)'}
                        </Button>
                    )}
                </Stack>
            </Box>

            <Divider />

            <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.1em' }}>
                    Favorited By
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {spot.favoritedByUsers?.map((user) => (
                        <Link
                            key={user.id}
                            to="/profile/$username"
                            params={{ username: user.username || 'unknown' }}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar
                                    src={user.avatarUrl || undefined}
                                    sx={{ width: 32, height: 32, border: '1px solid', borderColor: 'divider' }}
                                />
                                <Typography variant="body2" fontWeight={700}>
                                    {user.username}
                                </Typography>
                            </Stack>
                        </Link>
                    ))}
                    {(!spot.favoritedByUsers || spot.favoritedByUsers.length === 0) && (
                        <Typography variant="body2" color="text.disabled">
                            No favorites yet
                        </Typography>
                    )}
                </Stack>
            </Box>
        </Box>
    );
};