import {
    ListItem,
    ListItemButton,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Box,
    Stack,
    Typography,
    Chip,
} from '@mui/material';
import {
    LocationOn,
    CalendarToday,
} from '@mui/icons-material';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import type { Spot } from 'src/types';

interface SpotGalleryItemProps {
    spot: Spot;
}

export function SpotGalleryItem({ spot }: SpotGalleryItemProps) {
    return (
        <ListItem disablePadding divider>
            <Link to="/spots/$spotId" params={{ spotId: spot.id.toString() }} style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                <ListItemButton sx={{ py: 2 }}>
                    <ListItemAvatar>
                        <Avatar
                            variant="rounded"
                            src={spot.photoUrl || undefined}
                            sx={{ width: 120, height: 90, mr: 2 }}
                        />
                    </ListItemAvatar>
                    <ListItemText
                        primary={spot.name}
                        secondary={
                            <Box sx={{ mt: 0.5 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <LocationOn sx={{ fontSize: 14 }} color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        {[
                                            [spot.city, spot.state].filter(Boolean).join(', '),
                                            spot.country
                                        ].filter(Boolean).join(', ') || 'Unknown Location'}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <CalendarToday sx={{ fontSize: 14 }} color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        {spot.created_at ? format(new Date(spot.created_at), 'MMM d, yyyy') : 'N/A'}
                                    </Typography>
                                </Stack>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                    {spot.difficulty && (
                                        <Chip
                                            label={spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                                            size="small"
                                            color={spot.difficulty === 'advanced' ? 'error' : spot.difficulty === 'intermediate' ? 'warning' : 'success'}
                                            sx={{
                                                height: 20,
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                color: spot.difficulty === 'intermediate' ? 'rgba(0,0,0,0.87)' : 'white'
                                            }}
                                        />
                                    )}
                                    {spot.kickout_risk !== undefined && (
                                        <Chip
                                            label={`Risk: ${spot.kickout_risk}/10`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                        />
                                    )}
                                    {spot.spot_type?.slice(0, 3).map((type: string) => (
                                        <Chip
                                            key={type}
                                            label={type.toUpperCase()}
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        primaryTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    />
                </ListItemButton>
            </Link>
        </ListItem>
    );
}
