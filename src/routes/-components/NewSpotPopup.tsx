import { memo, Suspense } from "react";
import { Popup } from "react-leaflet";
import { Box, Button, Typography, IconButton, Stack } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import CloseIcon from '@mui/icons-material/Close';
import AddLocationIcon from '@mui/icons-material/AddLocation';
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
                closeButton={false}
                autoPan={true}
                eventHandlers={{
                    remove: onClose,
                }}
            >
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        p: 2,
                        borderRadius: 2,
                        minWidth: 240,
                        maxWidth: 300,
                        boxShadow: 6,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <AddLocationIcon color="primary" sx={{ fontSize: 20 }} />
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                New Spot
                            </Typography>
                        </Stack>
                        <IconButton
                            size="small"
                            onClick={onClose}
                            aria-label="Close"
                            sx={{
                                p: 0.25,
                                color: 'text.secondary',
                                '&:hover': { color: 'text.primary' }
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Stack>

                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.primary',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            lineHeight: 1.35,
                            mb: 1.5,
                            wordBreak: 'break-word',
                        }}
                    >
                        {newSpot.address}
                    </Typography>

                    <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textTransform: 'none',
                            py: 0.75,
                        }}
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
