import { Box, Button, Typography, Fab, CircularProgress } from "@mui/material";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { MyLocation } from '@mui/icons-material';
import { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { boundsAtom, mapAtom } from 'src/atoms/map';
import { filtersAtom } from 'src/atoms/spots';
import { isLoggedInAtom } from 'src/atoms/auth';
import { useNavigate } from '@tanstack/react-router';
import type { Spot } from 'src/types';
import L, { Icon } from 'leaflet';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;

Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Default center if geolocation fails
const DEFAULT_CENTER = [3.1319, 101.6841] as [number, number];

const currentTheme = {
    name: 'Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

function MapEvents({ onMove, onRightClick }: { onMove: () => void, onRightClick: (latlng: L.LatLng) => void }) {
    const isOnline = useOnlineStatus();
    const setBoundsAtom = useSetAtom(boundsAtom);
    const map = useMapEvents({
        move: onMove,
        moveend: () => {
            setBoundsAtom(map.getBounds());
        },
        contextmenu: (e) => {
            if (isOnline) {
                onRightClick(e.latlng);
            }
        },
    });
    return null;
}

interface SpotMapProps {
    spots: Spot[];
    getSpots: (bounds: any) => void;
    lat?: number;
    lng?: number;
}

export const SpotMap = ({ spots, getSpots, lat, lng }: SpotMapProps) => {
    const navigate = useNavigate();
    const [map, setMap] = useState<LeafletMap | null>(null);
    const [moved, setMoved] = useState(false);
    const [newSpot, setNewSpot] = useState<{ latlng: L.LatLng, address: string } | null>(null);
    const [initialCenterFound, setInitialCenterFound] = useState(false);
    const [locating, setLocating] = useState(false);

    const setMapAtom = useSetAtom(mapAtom);
    const setBoundsAtom = useSetAtom(boundsAtom);
    const isLoggedIn = useAtomValue(isLoggedInAtom)
    const filters = useAtomValue(filtersAtom);

    // Lazy load the CSS only when the map component mounts
    useEffect(() => {
        import('leaflet/dist/leaflet.css');
        import('leaflet.markercluster/dist/MarkerCluster.css');
        import('leaflet.markercluster/dist/MarkerCluster.Default.css');
    }, []);

    useEffect(() => {
        setMapAtom(map);
        if (map) {
            const bounds = map.getBounds();
            setBoundsAtom(bounds);
            // Trigger initial fetch when map is ready
            getSpots(bounds);
        }
    }, [map, setMapAtom, setBoundsAtom, getSpots]);

    useEffect(() => {
        if (!isLoggedIn) {
            setNewSpot(null);
        }
    }, [isLoggedIn]);

    const onMove = useCallback(() => {
        setMoved(true);
    }, []);

    const onRightClick = useCallback(async (latlng: L.LatLng) => {
        if (!isLoggedIn) return;
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng.lat},${latlng.lng}&key=AIzaSyA4RiC3UlcdfU3MRNkp0kBirRmSE8V9vdE`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            setNewSpot({ latlng, address: data.results[0].formatted_address });
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (map && !lat && !lng && !initialCenterFound && !locating) {
            console.log('Attempting initial geolocation...');
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    console.log('Initial geolocation successful:', latitude, longitude);
                    map.setView([latitude, longitude], 12);
                    setInitialCenterFound(true);
                    setLocating(false);
                },
                (error) => {
                    console.error('Initial geolocation failed:', error);
                    setInitialCenterFound(true); // Stop trying even on error
                    setLocating(false);

                    // Fallback: If geolocation fails, try to at least zoom out or show a message
                    if (error.code === error.PERMISSION_DENIED) {
                        console.warn('Location permission denied by user.');
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }
    }, [map, lat, lng, initialCenterFound, locating]);

    useEffect(() => {
        if (lat && lng && map) {
            const onMoveEnd = () => {
                getSpots(map.getBounds());
                map.off('moveend', onMoveEnd);
            };
            map.on('moveend', onMoveEnd);
            map.flyTo([lat, lng], 12, {
                duration: 1
            });
            setMoved(false);
        }
    }, [lat, lng, map, getSpots]);

    const centerMap = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (map) {
                    map.flyTo([latitude, longitude], 12, { duration: 1 });
                }
            },
            (error) => {
                let message = 'Unable to retrieve your location.';
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Location access was denied. Please check your browser permissions.';
                } else if (error.code === error.TIMEOUT) {
                    message = 'Location request timed out. Please try again.';
                }
                alert(message);
                console.error(error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    return (
        <Box sx={{ height: '100%', p: 0, position: 'relative' }}>
            {moved && (
                <Box sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                    <Button variant="contained" color='secondary' onClick={() => {
                        if (map) {
                            getSpots(map.getBounds());
                        }
                        setMoved(false);
                    }}>
                        Search this area
                    </Button>
                </Box>
            )}

            <MapContainer
                center={lat && lng ? [lat, lng] : DEFAULT_CENTER}
                zoom={lat && lng ? 17 : 12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
                ref={setMap}
            >
                <MapEvents onMove={onMove} onRightClick={onRightClick} />
                <TileLayer
                    url={currentTheme.url}
                    attribution=''
                />
                <MarkerClusterGroup
                    key={`cluster-${spots.length}-${JSON.stringify(filters)}`}
                    chunkedLoading
                    maxClusterRadius={50}
                >
                    {spots.map(spot => (
                        <Marker position={[spot.latitude, spot.longitude]} key={spot.id}>
                            <Popup closeButton={false}>
                                <Box
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => navigate({ to: '/spots/$spotId', params: { spotId: spot.id.toString() } })}
                                >
                                    {spot.photoUrl && (
                                        <img
                                            src={spot.photoUrl}
                                            alt={spot.name}
                                            style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                                        />
                                    )}
                                    <Typography variant="h6" sx={{ color: 'text.primary' }}>{spot.name}</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{spot.address}</Typography>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mt: 0.5 }}>{spot.description}</Typography>
                                </Box>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
                {newSpot && (
                    <Popup position={newSpot.latlng}>
                        <Box>
                            <Typography variant="body2">{newSpot.address}</Typography>
                            <Button
                                variant="contained"
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={() => navigate({
                                    to: '/spots/new',
                                    search: {
                                        lat: newSpot.latlng.lat,
                                        lng: newSpot.latlng.lng,
                                    },
                                })}
                            >
                                Add Spot Here
                            </Button>
                        </Box>
                    </Popup>
                )}
            </MapContainer>

            {locating && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        p: 1,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        zIndex: 1100,
                        boxShadow: 2
                    }}
                >
                    <CircularProgress size={20} />
                    <Typography variant="caption">Finding you...</Typography>
                </Box>
            )}

            <Fab
                aria-label="center map"
                onClick={centerMap}
                disabled={locating}
                size="small"
                sx={{
                    position: 'absolute',
                    bottom: {
                        xs: 'calc(16px + 56px + env(safe-area-inset-bottom, 0px))',
                        lg: 24
                    },
                    right: 16,
                    zIndex: 1000,
                    bgcolor: 'white',
                    color: 'text.primary',
                    '&:hover': {
                        bgcolor: 'grey.100',
                    },
                    boxShadow: 3
                }}
            >
                {locating ? <CircularProgress size={20} color="inherit" /> : <MyLocation fontSize="small" />}
            </Fab>
        </Box>
    );
};

export default SpotMap;
