import { Avatar, Box, Chip, ListItem, ListItemButton, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import type { Spot } from '@/types';

const chipSx = { height: 20, fontSize: '0.65rem', fontWeight: 700 } as const;

const difficultyColor = (difficulty: string) =>
    difficulty === 'advanced' ? 'error' : difficulty === 'intermediate' ? 'warning' : 'success';

/** One spot as a compact row: photo, name, "place · date" and a few tags. Used for favorites and your activity. */
export function SpotGalleryItem({ spot }: { spot: Spot }) {
    const place =
        [[spot.city, spot.state].filter(Boolean).join(', '), spot.country].filter(Boolean).join(', ') ||
        spot.address ||
        'Unknown location';
    const date = spot.created_at ? format(new Date(spot.created_at), 'MMM d, yyyy') : null;

    return (
        <ListItem disablePadding divider>
            <Link to="/spots/$spotId" params={{ spotId: spot.id.toString() }} style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                <ListItemButton sx={{ py: 1.5, px: { xs: 0, sm: 1 }, gap: 1.5, alignItems: 'flex-start' }}>
                    <Avatar
                        variant="rounded"
                        src={spot.photoUrl || undefined}
                        alt={spot.name}
                        sx={{ width: { xs: 88, sm: 112 }, height: { xs: 88, sm: 112 }, flexShrink: 0, borderRadius: 2 }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                            {spot.name || 'Unnamed Spot'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                            {place}
                        </Typography>
                        {date && (
                            <Typography variant="caption" color="text.secondary">{date}</Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
                            {spot.difficulty && (
                                <Chip
                                    label={spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                                    size="small"
                                    color={difficultyColor(spot.difficulty)}
                                    sx={{ ...chipSx, color: spot.difficulty === 'intermediate' ? 'rgba(0,0,0,0.87)' : 'white' }}
                                />
                            )}
                            {spot.kickout_risk !== undefined && (
                                <Chip label={`Risk ${spot.kickout_risk}/10`} size="small" variant="outlined" sx={chipSx} />
                            )}
                            {spot.spot_type?.slice(0, 1).map((type: string) => (
                                <Chip key={type} label={type.toUpperCase()} size="small" variant="outlined" color="primary" sx={chipSx} />
                            ))}
                        </Box>
                    </Box>
                </ListItemButton>
            </Link>
        </ListItem>
    );
}
