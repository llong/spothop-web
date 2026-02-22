import {
    Grid,
    Card,
    Box,
    CardContent,
    Typography,
    Stack,
} from '@mui/material';
import {
    PlayCircleOutline,
    LocationOn,
    CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { UserMediaItem } from 'src/types';

interface MediaGalleryItemProps {
    item: UserMediaItem;
    index: number;
    onClick: (index: number) => void;
}

export function MediaGalleryItem({ item, index, onClick }: MediaGalleryItemProps) {
    return (
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
                variant="outlined"
                sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
                onClick={() => onClick(index)}
            >
                <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'black' }}>
                    {item.type === 'photo' ? (
                        <Box
                            component="img"
                            src={item.url}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.thumbnailUrl && (
                                <Box
                                    component="img"
                                    src={item.thumbnailUrl}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        opacity: 0.7
                                    }}
                                />
                            )}
                            <PlayCircleOutline sx={{ position: 'absolute', fontSize: 48, color: 'white' }} />
                        </Box>
                    )}
                </Box>
                <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap gutterBottom>
                        {item.spot.name}
                    </Typography>
                    <Stack spacing={0.5}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationOn sx={{ fontSize: 12 }} color="action" />
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ width: '100%' }}>
                                {[
                                    [item.spot.city, (item.spot as any).state].filter(Boolean).join(', '),
                                    item.spot.country
                                ].filter(Boolean).join(', ') || 'Unknown Location'}
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarToday sx={{ fontSize: 12 }} color="action" />
                            <Typography variant="caption" color="text.secondary">
                                {format(new Date(item.created_at), 'MMM d, yyyy')}
                            </Typography>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Grid>
    );
}
