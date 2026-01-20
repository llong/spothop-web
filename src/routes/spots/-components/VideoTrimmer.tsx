import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Slider,
    Typography,
    Button,
    CircularProgress,
    IconButton,
    Stack
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { trimVideo } from '../../../utils/videoProcessing';

interface VideoTrimmerProps {
    file: File;
    onTrimmed: (trimmedBlob: Blob) => void;
    onCancel: () => void;
    maxDuration?: number;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
    file,
    onTrimmed,
    onCancel,
    maxDuration = 20
}) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [range, setRange] = useState<[number, number]>([0, 0]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null); // Added AbortController ref

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setVideoUrl(null);
    }, [file]);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const d = videoRef.current.duration;
            setDuration(d);
            setRange([0, Math.min(d, maxDuration)]);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);

            // Loop within range
            if (time >= range[1]) {
                videoRef.current.currentTime = range[0];
            }
        }
    };

    const handleRangeChange = (_event: Event, newValue: number | number[]) => {
        const newRange = newValue as [number, number];
        const newDuration = newRange[1] - newRange[0];

        if (newDuration <= maxDuration) {
            setRange(newRange);
            if (videoRef.current) {
                videoRef.current.currentTime = newRange[0];
            }
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleProcess = async () => {
        abortControllerRef.current = new AbortController(); // Create new AbortController
        setIsProcessing(true);
        setProgress(0); // Reset progress on start
        try {
            const trimmedData = await trimVideo(
                file,
                range[0],
                range[1] - range[0],
                (p) => setProgress(p),
                abortControllerRef.current.signal // Pass the signal
            );
            const blob = new Blob([Uint8Array.from(trimmedData)], { type: 'video/mp4' });
            onTrimmed(blob);
            abortControllerRef.current = null; // Clear controller on success
        } catch (error) {
            console.error('Trimming failed:', error);
            if (error instanceof DOMException && error.name === 'AbortError') {
                alert('Video processing cancelled.');
            } else {
                alert('Video processing failed. Your browser might not support this feature or is out of memory.');
            }
        } finally {
            setIsProcessing(false);
            // If not already cleared by success, clear controller on error/cancellation
            if (abortControllerRef.current) {
                abortControllerRef.current = null;
            }
        }
    };

    const handleCancelProcessing = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort(); // Abort the ongoing operation
            setIsProcessing(false); // Immediately stop the loading indicator
            setProgress(0); // Reset progress
        }
        onCancel(); // Call the original onCancel prop
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    pt: '56.25%',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: videoUrl ? 'pointer' : 'default'
                }}
                onClick={videoUrl ? togglePlay : undefined}
            >
                {videoUrl && (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        playsInline
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                )}
            </Box>

            <Stack spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={togglePlay} color="primary" disabled={!videoUrl}>
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <Typography variant="caption" sx={{ minWidth: 100 }}>
                        {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                    </Typography>
                    <Typography variant="caption" color="primary">
                        Selected: {(range[1] - range[0]).toFixed(1)}s (Max {maxDuration}s)
                    </Typography>
                </Box>

                <Slider
                    value={range}
                    onChange={handleRangeChange}
                    min={0}
                    max={duration}
                    step={0.1}
                    valueLabelDisplay="auto"
                    disabled={isProcessing || !videoUrl}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={handleCancelProcessing} disabled={!isProcessing}> {/* Updated onClick and disabled */}
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleProcess}
                        disabled={isProcessing || (range[1] - range[0]) <= 0 || !videoUrl}
                        startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isProcessing ? `Processing ${progress}%` : 'Trim & Save'}
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};
