import { Box, Button } from "@mui/material";

interface MapSearchAreaButtonProps {
    visible: boolean;
    onClick: () => void;
}

export const MapSearchAreaButton = ({ visible, onClick }: MapSearchAreaButtonProps) => {
    if (!visible) return null;

    return (
        <Box sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
            <Button variant="contained" color='secondary' onClick={onClick}>
                Search this area
            </Button>
        </Box>
    );
};
