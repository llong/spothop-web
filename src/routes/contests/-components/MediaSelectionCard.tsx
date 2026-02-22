import {
    Card,
    CardActionArea,
    Box,
    CardMedia,
    IconButton,
} from '@mui/material';
import {
    PlayArrow as PlayArrowIcon,
    Fullscreen as FullscreenIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface MediaSelectionCardProps {
    item: any;
    isSelected: boolean;
    onSelect: (id: string, type: 'photo' | 'video') => void;
    onFullscreen: (item: any) => void;
}

export function MediaSelectionCard({ item, isSelected, onSelect, onFullscreen }: MediaSelectionCardProps) {
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 1,
                borderColor: isSelected ? 'primary.main' : 'grey.300',
                borderWidth: isSelected ? 2 : 1,
                position: 'relative'
            }}
        >
            <CardActionArea onClick={() => onSelect(item.id, item.type)}>
                <Box sx={{ position: 'relative' }}>
                    <CardMedia
                        component={item.type === 'video' ? 'video' : 'img'}
                        height="120"
                        image={item.type === 'video' ? undefined : item.url}
                        src={item.type === 'video' ? item.url : undefined}
                        sx={{ bgcolor: 'black' }}
                    />
                    {item.type === 'video' && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                bgcolor: 'rgba(0,0,0,0.5)',
                                borderRadius: '50%',
                                p: 0.5,
                                display: 'flex'
                            }}
                        >
                            <PlayArrowIcon sx={{ color: 'white' }} />
                        </Box>
                    )}
                    <IconButton
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            bgcolor: 'rgba(255,255,255,0.7)',
                            '&:hover': { bgcolor: 'white' }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onFullscreen(item);
                        }}
                    >
                        <FullscreenIcon fontSize="small" />
                    </IconButton>
                </Box>
                {isSelected && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', borderRadius: '50%', display: 'flex' }}>
                        <CheckCircleIcon color="primary" />
                    </Box>
                )}
            </CardActionArea>
        </Card>
    );
}
