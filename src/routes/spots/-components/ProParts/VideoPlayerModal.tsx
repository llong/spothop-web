import {
    Modal,
    Box,
    Button,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';

interface VideoPlayerModalProps {
    open: boolean;
    onClose: () => void;
    playerKey: number;
    linkId: string;
    embedUrl: string;
    onReplay: () => void;
    youtubeUrl: string;
}

export function VideoPlayerModal({
    open,
    onClose,
    playerKey,
    linkId,
    embedUrl,
    onReplay,
    youtubeUrl,
}: VideoPlayerModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <Box sx={{ width: '90%', maxWidth: 800, bgcolor: 'black', boxShadow: 24, outline: 'none', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ aspectRatio: '16/9', width: '100%' }}>
                    <iframe
                        key={playerKey}
                        id={`youtube-player-${linkId}`}
                        width="100%"
                        height="100%"
                        src={embedUrl}
                        title="YouTube video player"
                        style={{ border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        // @ts-ignore
                        credentialless="true"
                    ></iframe>
                </Box>
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button 
                        startIcon={<ReplayIcon />}
                        onClick={onReplay}
                        variant="text"
                        size="small"
                        sx={{ color: 'grey.500' }}
                    >
                        Replay Clip
                    </Button>
                    <Button 
                        href={youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="text"
                        size="small"
                        sx={{ color: 'grey.500' }}
                    >
                        Open in YouTube
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
