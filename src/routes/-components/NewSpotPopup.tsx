import { memo, Suspense } from "react";
import { Popup } from "react-leaflet";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import L from 'leaflet';

interface NewSpotPopupProps {
    newSpot: { latlng: L.LatLng; address: string };
    onClose: () => void;
}

export const NewSpotPopup = memo(({ newSpot, onClose }: NewSpotPopupProps) => {
    const navigate = useNavigate();

    return (
        <Suspense fallback={null}>
            <Popup
                position={newSpot.latlng}
                eventHandlers={{
                    remove: onClose,
                }}
            >
                <Box sx={{ p: 0.5 }}>
                    <Typography variant="body2">{newSpot.address}</Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() =>
                            navigate({
                                to: "/spots/new",
                                search: { lat: newSpot.latlng.lat, lng: newSpot.latlng.lng },
                            })
                        }
                    >
                        Add Spot Here
                    </Button>
                </Box>
            </Popup>
        </Suspense>
    );
});
