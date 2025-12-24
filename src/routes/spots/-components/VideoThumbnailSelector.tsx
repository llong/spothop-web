import { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Slider,
    Typography
} from '@mui/material';

interface VideoThumbnailSelectorProps {
    videoFile: File | null;
    open: boolean;
    onClose: () => void;
    onSelectThumbnail: (thumbnail: File) => void;
}

export const VideoThumbnailSelector = ({ videoFile, open, onClose, onSelectThumbnail }: VideoThumbnailSelectorProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [videoFile]);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleTimeChange = (_: Event, newValue: number | number[]) => {
        const time = newValue as number;
        setCurrentTime(time);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && videoFile) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const fileName = `thumbnail_${videoFile.name.split('.')[0]}.jpg`;
                        const file = new File([blob], fileName, { type: 'image/jpeg' });
                        onSelectThumbnail(file);
                        onClose();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Select Video Thumbnail</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {videoUrl && (
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            style={{ width: '100%', maxHeight: '50vh', backgroundColor: 'black' }}
                            onLoadedMetadata={handleLoadedMetadata}
                            crossOrigin="anonymous"
                        />
                    )}

                    <Box sx={{ px: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                            Scrub to select a frame
                        </Typography>
                        <Slider
                            value={currentTime}
                            min={0}
                            max={duration}
                            step={0.1}
                            onChange={handleTimeChange}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value.toFixed(1)}s`}
                        />
                    </Box>

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleCapture} variant="contained">
                    Use This Frame
                </Button>
            </DialogActions>
        </Dialog>
    );
};
