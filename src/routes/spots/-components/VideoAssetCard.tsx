import { Card, Box, Fab, Typography, IconButton, Tooltip } from '@mui/material';
import { Close as CloseIcon, Image as ImageIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import type { VideoAsset } from '@/types';

interface VideoAssetCardProps {
    asset: VideoAsset;
    onPreview: (asset: VideoAsset) => void;
    onChangeThumbnail: (id: string) => void;
    onRemove: (id: string) => void;
}

export function VideoAssetCard({ asset, onPreview, onChangeThumbnail, onRemove }: VideoAssetCardProps) {
    const thumbnailUrl = useObjectUrl(asset.thumbnail);
    const sizeMb = (asset.file.size / 1024 / 1024).toFixed(1);

    return (
        <Card variant="outlined" sx={{ overflow: 'hidden' }}>
            <Box
                onClick={() => asset.thumbnail && onPreview(asset)}
                sx={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    bgcolor: 'common.black',
                    cursor: asset.thumbnail ? 'pointer' : 'default',
                }}
            >
                {thumbnailUrl && (
                    <Box component="img" src={thumbnailUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                )}
                <Fab
                    size="medium"
                    aria-label="preview video"
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'rgba(255, 255, 255, 0.75)',
                        color: 'common.black',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                    }}
                >
                    <PlayArrowIcon />
                </Fab>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 1.5, pr: 0.5, py: 0.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap variant="body2" fontWeight={600}>{asset.file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{sizeMb} MB · trimmed and optimized</Typography>
                </Box>
                <Tooltip title="Choose thumbnail frame">
                    <span>
                        <IconButton aria-label="change thumbnail" onClick={() => onChangeThumbnail(asset.id)} disabled={!asset.thumbnail}>
                            <ImageIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Remove video">
                    <IconButton aria-label="remove video" onClick={() => onRemove(asset.id)} color="error">
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Card>
    );
}
