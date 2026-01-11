import { Paper, Typography, Divider } from '@mui/material';
import type { Spot } from 'src/types';
import { SidebarActions } from './SidebarActions';

interface SpotSidebarProps {
    spot: Spot;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    onAddMedia: () => void;
    isLoggedIn: boolean;
}

export const SpotSidebar = ({ spot, isFavorited, onToggleFavorite, onAddMedia, isLoggedIn }: SpotSidebarProps) => {
    const handleOpenInMaps = () => {
        const { latitude, longitude, name, address } = spot;
        const query = encodeURIComponent(`${name || 'Spot'} ${address || ''}`);

        // Use apple maps on iOS devices if possible, otherwise google maps
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS
            ? `maps://?q=${query}&ll=${latitude},${longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

        window.open(url, '_blank');
    };

    return (
        <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            {spot.description && (
                <>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        About this spot
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {spot.description}
                    </Typography>
                </>
            )}

            <Divider sx={{ my: 2 }} />

            <SidebarActions
                isLoggedIn={isLoggedIn}
                isFavorited={isFavorited}
                onToggleFavorite={onToggleFavorite}
                onAddMedia={onAddMedia}
                onDirectionsClick={handleOpenInMaps}
            />
        </Paper>
    );
};
