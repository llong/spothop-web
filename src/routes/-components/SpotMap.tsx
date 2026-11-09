import { Box, Typography, Button, IconButton, Stack } from "@mui/material";
import { TILE_URLS } from "@/utils/mapTiles";
import { MapContainer, TileLayer, useMapEvents, Marker as LeafletMarker, Popup } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Map as LeafletMap } from 'leaflet';
import { useEffect, useState, memo, useMemo } from 'react';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import { boundsAtom, mapAtom, searchedLocationAtom } from '@/atoms/map';
import { filtersAtom } from '@/atoms/spots';
import { isLoggedInAtom } from '@/atoms/auth';
import type { Spot } from '@/types';
import { renderToStaticMarkup } from 'react-dom/server';
import { useMediaQuery } from '@mui/material';
import { themeModeAtom } from '@/atoms/ui';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import L, { Icon } from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapSearchAreaButton } from './MapSearchAreaButton';
import { UserLocationMarker } from './UserLocationMarker';
import { MapMarker } from './MapMarker';
import { NewSpotPopup } from './NewSpotPopup';
import { MapControls } from './MapControls';
import { useMapState } from '@/hooks/useMapState';
import { useSpotCreation } from '@/hooks/useSpotCreation';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default icon URL resolver breaks with bundlers; remove it so mergeOptions below wins.
delete (Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [43.088947, -76.154480] as [number, number];

const THEMES = TILE_URLS;

function MapEvents({ onMove, onRightClick }: { onMove: () => void, onRightClick: (latlng: L.LatLng) => void }) {
    const setBoundsAtom = useSetAtom(boundsAtom);
    const map = useMapEvents({
        dragstart: onMove,
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
    onMarkerClick?: (spot: Spot) => void;
    lat?: number;
    lng?: number;
}

const SpotMapComponent = ({ spots, getSpots, onMarkerClick, lat, lng }: SpotMapProps) => {
    const [map, setMap] = useState<LeafletMap | null>(null);
    const setMapAtom = useSetAtom(mapAtom);
    const [searchedLocation, setSearchedLocation] = useAtom(searchedLocationAtom);
    const isLoggedIn = useAtomValue(isLoggedInAtom);
    const filters = useAtomValue(filtersAtom);
    
    // Theme logic
    const themeModePreference = useAtomValue(themeModeAtom);
    // Actual implementation of system preference:
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const isDark = themeModePreference === 'dark' || (themeModePreference === 'system' && prefersDarkMode);
    const tileUrl = isDark ? THEMES.dark : THEMES.light;

    const searchIcon = useMemo(() => {
        const iconHtml = renderToStaticMarkup(
            <LocationOnIcon style={{
                color: '#EA4335',
                fontSize: '48px',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
            }} />
        );
        return L.divIcon({
            html: iconHtml,
            className: 'search-marker-icon', // Defined in index.css to remove default border/bg
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            popupAnchor: [0, -48],
        });
    }, []);

    const {
        moved,
        setMoved,
        isFollowingUser,
        userLocation,
        handleMove,
        handleCenterOnUser
    } = useMapState(map, getSpots, lat, lng);

    const { newSpot, setNewSpot, onRightClick } = useSpotCreation(isLoggedIn);
    const { locating } = useGeolocation(map);

    useEffect(() => {
        import('leaflet/dist/leaflet.css');
        import('leaflet.markercluster/dist/MarkerCluster.css');
        import('leaflet.markercluster/dist/MarkerCluster.Default.css');
    }, []);

    useEffect(() => {
        setMapAtom(map);
        // Other pages (the feed's search bar) read this atom: never leave them a destroyed map
        return () => setMapAtom(null);
    }, [map, setMapAtom]);

    const handleSearchArea = () => {
        if (map) getSpots(map.getBounds());
        setMoved(false);
    };

    return (
        <Box sx={{ height: '100%', p: 0, position: 'relative' }}>
            <MapSearchAreaButton visible={moved} onClick={handleSearchArea} />

            <MapContainer
                center={lat && lng ? [lat, lng] : DEFAULT_CENTER}
                zoom={lat && lng ? 13 : 12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
                ref={setMap}
            >
                <MapEvents onMove={handleMove} onRightClick={onRightClick} />
                <TileLayer url={tileUrl} attribution='' />

                {userLocation && (
                    <UserLocationMarker location={userLocation} />
                )}

                <MarkerClusterGroup
                    key={`cluster-${spots.length > 0 ? spots[0].id : 'empty'}-${spots.length}-${JSON.stringify(filters)}`}
                    chunkedLoading
                    maxClusterRadius={50}
                    showCoverageOnHover={false}
                >
                    {spots.map(spot => (
                        <MapMarker
                            key={spot.id}
                            spot={spot}
                            onClick={() => onMarkerClick?.(spot)}
                        />
                    ))}
                </MarkerClusterGroup>

                {newSpot && (
                    <NewSpotPopup newSpot={newSpot} onClose={() => setNewSpot(null)} />
                )}

                {/* Searched Location Indicator */}
                {searchedLocation && (
                    <LeafletMarker
                        position={[searchedLocation.lat, searchedLocation.lng]}
                        zIndexOffset={1000}
                        icon={searchIcon}
                    >
                        <Popup autoPan={false} closeButton={false}>
                            <Box
                                sx={{
                                    bgcolor: 'background.paper',
                                    color: 'text.primary',
                                    p: 2,
                                    borderRadius: 2,
                                    minWidth: 220,
                                    maxWidth: 280,
                                    boxShadow: 6,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={0.75}>
                                        <LocationOnIcon color="primary" sx={{ fontSize: 18 }} />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                fontSize: '0.65rem',
                                                letterSpacing: '0.05em'
                                            }}
                                        >
                                            Searched Location
                                        </Typography>
                                    </Stack>
                                    <IconButton
                                        size="small"
                                        onClick={() => setSearchedLocation(null)}
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
                                    variant="subtitle2"
                                    fontWeight={700}
                                    sx={{
                                        color: 'text.primary',
                                        mb: 1.5,
                                        lineHeight: 1.3,
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {searchedLocation.name}
                                </Typography>
                                <Button
                                    size="small"
                                    variant="contained"
                                    fullWidth
                                    onClick={() => {
                                        onRightClick(L.latLng(searchedLocation.lat, searchedLocation.lng));
                                        setSearchedLocation(null);
                                    }}
                                    sx={{ borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 700, textTransform: 'none', py: 0.75 }}
                                >
                                    Add New Spot Here
                                </Button>
                            </Box>
                        </Popup>
                    </LeafletMarker>
                )}
            </MapContainer>

            <MapControls
                locating={locating}
                isFollowingUser={isFollowingUser}
                onCenterOnUser={handleCenterOnUser}
            />
        </Box>
    );
};

export const SpotMap = memo(SpotMapComponent);
export default SpotMap;