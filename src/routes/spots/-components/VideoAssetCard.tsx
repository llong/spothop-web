import {
    Card,
    Box,
    Fab,
    Typography,
    Button,
    IconButton,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    VideoFile as VideoFileIcon,
    Image as ImageIcon,
    PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import type { VideoAsset } from 'src/types';

interface VideoAssetCardProps {
    asset: VideoAsset;
    onPreview: (asset: VideoAsset) => void;
    onChangeThumbnail: (id: string) => void;
    onRemove: (id: string) => void;
}

export function VideoAssetCard({ asset, onPreview, onChangeThumbnail, onRemove }: VideoAssetCardProps) {
    return (
        <Card sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 0 }}>
                    <Box
                        onClick={() => asset.thumbnail && onPreview(asset)}
                        sx={{
                            position: 'relative',
                            width: 227,
                            height: 128,
                            borderRadius: 1,
                            overflow: 'hidden',
                            cursor: asset.thumbnail ? 'pointer' : 'default',
                            bgcolor: 'grey.200',
                            flexShrink: 0
                        }}
                    >
                        {asset.thumbnail ? (
                            <>
                                <Box
                                    component="img"
                                    src={URL.createObjectURL(asset.thumbnail)}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        bgcolor: 'rgba(0, 0, 0, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Fab
                                        size="medium"
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                                            '& .MuiSvgIcon-root': { fontSize: 28, color: 'black' }
                                        }}
                                    >
                                        <PlayArrowIcon />
                                    </Fab>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ImageIcon fontSize="large" color="disabled" />
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                            <VideoFileIcon color="primary" />
                            <Typography noWrap variant="body2">{asset.file.name}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {asset.thumbnail ? 'Thumbnail generated' : 'Generating thumbnail...'}
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onChangeThumbnail(asset.id)}
                            disabled={!asset.thumbnail}
                            sx={{ width: 'fit-content', mt: 'auto' }}
                        >
                            {asset.thumbnail ? 'Change Thumbnail' : 'Generating...'}
                        </Button>
                    </Box>
                </Box>

                <IconButton onClick={() => onRemove(asset.id)} color="error" sx={{ flexShrink: 0 }}>
                    <DeleteIcon />
                </IconButton>
            </Box>
        </Card>
    );
}
