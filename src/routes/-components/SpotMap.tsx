import { Box, Button, Typography, Fab, CircularProgress } from "@mui/material";
import { MapContainer, TileLayer, useMapEvents, Circle } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { MyLocation } from '@mui/icons-material';
import { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useState, memo, lazy, Suspense } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { boundsAtom, mapAtom } from 'src/atoms/map';
import { filtersAtom } from 'src/atoms/spots';
import { isLoggedInAtom } from 'src/atoms/auth';
import { useNavigate } from '@tanstack/react-router';
import type { Spot } from 'src/types';
import L, { Icon } from 'leaflet';
import { useGeolocation } from 'src/hooks/useGeolocation';
import { MapSearchAreaButton } from './MapSearchAreaButton';
import { getOptimizedImageUrl } from 'src/utils/imageOptimization';

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

const injectPulseAnimation = () => {
    if (!document.getElementById('location-pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'location-pulse-animation';
        style.textContent = ``;
        document.head.appendChild(style);
    }
};

const DEFAULT_CENTER = [3.1319, 101.6841] as [number, number];

const currentTheme = {
    name: 'Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const Popup = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Popup })));

function MapEvents({ onMove, onRightClick }: { onMove: () => void, onRightClick: (latlng: L.LatLng) => void }) {
    const setBoundsAtom = useSetAtom(boundsAtom);
    const map = useMapEvents({
        move: onMove,
        moveend: () => {
            setBoundsAtom(map.getBounds());
        },
        contextmenu: (e) => {
            onRightClick(e.latlng);
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

const SpotMapComponent = ({ spots, getSpots, lat, lng }: SpotMapProps) => {
    const navigate = useNavigate();
    const [map, setMap] = useState<LeafletMap | null>(null);
    const [moved, setMoved] = useState(false);
    const [newSpot, setNewSpot] = useState<{ latlng: L.LatLng, address: string } | null>(null);
    const [initialCenterFound, setInitialCenterFound] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number, accuracy: number } | null>(null);
    const [pulseRings, setPulseRings] = useState<Array<{ id: number, radius: number, opacity: number }>>([]);
    const [mapZoom, setMapZoom] = useState<number>(12);
    const [circleSize, setCircleSize] = useState<number>(25);

    const setMapAtom = useSetAtom(mapAtom);
    const setBoundsAtom = useSetAtom(boundsAtom);
    const isLoggedIn = useAtomValue(isLoggedInAtom);
    const filters = useAtomValue(filtersAtom);
    const { locating, centerMapOnUser, getCurrentPosition } = useGeolocation(map);

    useEffect(() => {
        import('leaflet/dist/leaflet.css');
        import('leaflet.markercluster/dist/MarkerCluster.css');
        import('leaflet.markercluster/dist/MarkerCluster.Default.css');
        injectPulseAnimation();
    }, []);

    useEffect(() => {
        setMapAtom(map);
        if (map) {
            const bounds = map.getBounds();
            setBoundsAtom(bounds);
            getSpots(bounds);
            const zoom = map.getZoom();
            setMapZoom(zoom);

            // Adjust circle size based on zoom level to maintain consistent screen size
            const newSize = Math.max(25, Math.min(35, 25 * Math.pow(2, 17 - zoom)));
            setCircleSize(newSize);
        }
    }, [map, setMapAtom, setBoundsAtom, getSpots, setMapZoom, setCircleSize]);

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
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng.lat},${latlng.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            setNewSpot({ latlng, address: data.results[0].formatted_address });
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (map && !lat && !lng && !initialCenterFound && !locating) {
            const setInitialView = async () => {
                try {
                    const pos = await getCurrentPosition();
                    map.setView([pos.latitude, pos.longitude], 12);
                } catch (error) {
                    console.error('Initial geolocation failed:', error);
                } finally {
                    setInitialCenterFound(true);
                }
            };
            setInitialView();
        }
    }, [map, lat, lng, initialCenterFound, locating, getCurrentPosition]);

    useEffect(() => {
        if (lat && lng && map) {
            const onMoveEnd = () => {
                getSpots(map.getBounds());
                map.off('moveend', onMoveEnd);
            };
            map.on('moveend', onMoveEnd);
            map.flyTo([lat, lng], 12, { duration: 1 });
            setMoved(false);
        }
    }, [lat, lng, map, getSpots]);

    useEffect(() => {
        if (navigator.geolocation && 'watchPosition' in navigator.geolocation && map) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy || 100
                    });
                },
                (error) => {
                    console.error('Geolocation watch error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                }
            );

            return () => {
                if (watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                }
            };
        }
    }, [map]);

    useEffect(() => {
        if (!userLocation) {
            setPulseRings([]);
            return;
        }

        const addRing = () => {
            const id = Date.now();
            setPulseRings(prev => [...prev, { id, radius: circleSize, opacity: 0.6 }]);
        };

        const interval = setInterval(addRing, 2000);

        return () => clearInterval(interval);
    }, [userLocation]);

    useEffect(() => {
        const animationInterval = setInterval(() => {
            setPulseRings(prev => prev.map(ring => ({
                ...ring,
                radius: Math.min(ring.radius + (circleSize / 25), (circleSize * 2.2)),
                opacity: Math.max(ring.opacity - 0.012, 0)
            })).filter(ring => ring.opacity > 0));
        }, 50);

        return () => clearInterval(animationInterval);
    }, [mapZoom, circleSize]);

    const handleSearchArea = () => {
        if (map) {
            getSpots(map.getBounds());
        }
        setMoved(false);
    };

    return (
        <Box sx={{ height: '100%', p: 0, position: 'relative' }}>
            <MapSearchAreaButton visible={moved} onClick={handleSearchArea} />

            <MapContainer
                center={lat && lng ? [lat, lng] : DEFAULT_CENTER}
                zoom={lat && lng ? 17 : 12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
                ref={setMap}
            >
                <MapEvents onMove={onMove} onRightClick={onRightClick} />
                <TileLayer url={currentTheme.url} attribution='' />

                {userLocation && (
                    <>
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={circleSize * 0.48}
                            pathOptions={{
                                color: '#4285F4',
                                fillColor: '#4285F4',
                                fillOpacity: 1,
                                weight: 0,
                                opacity: 1,
                            }}
                        />
                        {pulseRings.map(ring => (
                            <Circle
                                key={ring.id}
                                center={[userLocation.lat, userLocation.lng]}
                                radius={circleSize * (ring.radius / 25)}
                                pathOptions={{
                                    color: 'transparent',
                                    fillColor: '#4285F4',
                                    fillOpacity: ring.opacity,
                                    weight: 0,
                                    opacity: 1,
                                }}
                            />
                        ))}
                    </>
                )}

                <MarkerClusterGroup
                    key={`cluster-${spots.length}-${JSON.stringify(filters)}`}
                    chunkedLoading
                    maxClusterRadius={50}
                >
                    {spots.map(spot => (
                        <Suspense key={spot.id} fallback={null}>
                            <Marker position={[spot.latitude, spot.longitude]}>
                                <Popup closeButton={false}>
                                    <Box
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate({ to: '/spots/$spotId', params: { spotId: spot.id.toString() } })}
                                    >
                                        {spot.photoUrl && (
                                            <img
                                                src={getOptimizedImageUrl(spot.photoUrl)}
                                                alt={spot.name}
                                                crossOrigin="anonymous"
                                                style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                                            />
                                        )}
                                        <Typography variant="h6" sx={{ color: 'text.primary' }}>{spot.name}</Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{spot.address}</Typography>
                                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mt: 0.5 }}>{spot.description}</Typography>
                                    </Box>
                                </Popup>
                            </Marker>
                        </Suspense>
                    ))}
                </MarkerClusterGroup>
                {newSpot && (
                    <Suspense fallback={null}>
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
                    </Suspense>
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
                onClick={centerMapOnUser}
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

export const SpotMap = memo(SpotMapComponent);
export default SpotMap;
