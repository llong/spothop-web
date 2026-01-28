import { memo, Suspense } from "react";
import { Marker, Popup } from "react-leaflet";
import { Box, Typography } from "@mui/material";
import type { Spot } from "src/types";
import { getOptimizedImageUrl } from "src/utils/imageOptimization";
import { useNavigate } from "@tanstack/react-router";

interface MapMarkerProps {
    spot: Spot;
}

export const MapMarker = memo(({ spot }: MapMarkerProps) => {
    const navigate = useNavigate();

    return (
        <Suspense fallback={null}>
            <Marker position={[spot.latitude, spot.longitude]}>
                <Popup closeButton={false} autoPan={false}>
                    <Box
                        sx={{ cursor: "pointer", minWidth: 150 }}
                        onClick={() => navigate({ to: "/spots/$spotId", params: { spotId: spot.id.toString() } })}
                    >
                        {spot.photoUrl && (
                            <img
                                src={getOptimizedImageUrl(spot.photoUrl)}
                                alt={spot.name}
                                crossOrigin="anonymous"
                                style={{ width: "100%", height: "auto", borderRadius: "4px" }}
                            />
                        )}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "text.primary" }}>
                            {spot.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {spot.address}
                        </Typography>
                    </Box>
                </Popup>
            </Marker>
        </Suspense>
    );
});
