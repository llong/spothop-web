import {
    Card,
    CardActionArea,
    Box,
    CardMedia,
    Typography,
    Divider,
    Chip,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface SpotSelectionCardProps {
    spot: any;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export function SpotSelectionCard({ spot, isSelected, onSelect }: SpotSelectionCardProps) {
    const theme = useTheme();
    
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 1,
                borderColor: isSelected ? 'primary.main' : 'grey.300',
                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                borderWidth: isSelected ? 2 : 1
            }}
        >
            <CardActionArea onClick={() => onSelect(spot.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                    <CardMedia
                        component="img"
                        sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
                        image={spot.thumbnail_small_url || '/spothopIcon.png'}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">{spot.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                {[spot.address, spot.city, spot.state, spot.country].filter(Boolean).join(', ')}
                            </Typography>
                            <Divider orientation="vertical" flexItem sx={{ height: 12 }} />
                            <Typography variant="caption" color="text.secondary">
                                {new Date(spot.created_at!).toLocaleDateString()}
                            </Typography>
                        </Box>
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                            {spot.spot_type?.map((type: string) => (
                                <Chip
                                    key={type}
                                    label={type}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                            ))}
                        </Box>
                    </Box>
                    {isSelected && <CheckCircleIcon color="primary" />}
                </Box>
            </CardActionArea>
        </Card>
    );
}
