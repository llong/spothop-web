import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Typography, IconButton, Stack, Button, Slider, CircularProgress } from '@mui/material';
import { PlayArrow, Pause, Delete, Image, VideoFile } from '@mui/icons-material';
import { VideoThumbnailSelector } from './VideoThumbnailSelector';
import type { VideoAsset } from 'src/types';

interface VideoPreviewProps {
    asset: VideoAsset;
    onRemove: (id: string) => void;
    onThumbnailChange: (id: string, thumbnail: File) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ asset, onRemove, onThumbnailChange }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [thumbnailSelectorOpen, setThumbnailSelectorOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (asset.file) {
            const url = URL.createObjectURL(asset.file);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [asset.file]);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setIsLoading(false);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (_: Event, newValue: number | number[]) => {
        const time = newValue as number;
        setCurrentTime(time);
        if (videoRef.current) videoRef.current.currentTime = time;
    };

    const handleVideoEnd = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (videoRef.current) videoRef.current.currentTime = 0;
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
                <Stack spacing={2}>
                    <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', bgcolor: 'black', borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }} onClick={handlePlayPause}>
                        {videoUrl && (
                            <video ref={videoRef} src={videoUrl} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} onEnded={handleVideoEnd} playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                        )}
                        {isLoading && <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.5)' }}><CircularProgress color="primary" /></Box>}
                        {!isLoading && <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: isPlaying ? 0 : 0.7, transition: 'opacity 0.2s', pointerEvents: 'none' }}><IconButton size="large" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>{isPlaying ? <Pause /> : <PlayArrow />}</IconButton></Box>}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', flex: 1 }}>
                            <VideoFile color="primary" fontSize="small" />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{asset.file.name}</Typography>
                            <Typography variant="caption" color="text.secondary">({formatTime(duration)})</Typography>
                        </Box>
                        <IconButton onClick={() => onRemove(asset.id)} color="error" size="small"><Delete fontSize="small" /></IconButton>
                    </Box>

                    {videoUrl && !isLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton onClick={handlePlayPause} color="primary" size="small">{isPlaying ? <Pause /> : <PlayArrow />}</IconButton>
                            <Box sx={{ flex: 1 }}><Slider value={currentTime} max={duration} step={0.1} onChange={handleSeek} size="small" valueLabelDisplay="auto" valueLabelFormat={formatTime} /></Box>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>{formatTime(currentTime)} / {formatTime(duration)}</Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {asset.thumbnail ? <Box component="img" src={URL.createObjectURL(asset.thumbnail)} sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }} /> : <Box sx={{ width: 50, height: 50, bgcolor: 'grey.200', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image fontSize="small" color="disabled" /></Box>}
                            <Box><Typography variant="caption" color="text.secondary">Video Thumbnail</Typography><Typography variant="caption" color="primary" sx={{ display: 'block' }}>{asset.thumbnail ? 'Click to change' : 'Generating...'}</Typography></Box>
                        </Box>
                        <Button size="small" variant="outlined" onClick={() => setThumbnailSelectorOpen(true)} disabled={!asset.thumbnail}>{asset.thumbnail ? 'Change' : 'Generating...'}</Button>
                    </Box>
                </Stack>

                <VideoThumbnailSelector open={thumbnailSelectorOpen} onClose={() => setThumbnailSelectorOpen(false)} videoFile={asset.file} onSelectThumbnail={(thumbnail) => { onThumbnailChange(asset.id, thumbnail); setThumbnailSelectorOpen(false); }} />
            </CardContent>
        </Card>
    );
};