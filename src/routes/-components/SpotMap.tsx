import { Box, Typography, Button } from "@mui/material";
import { MapContainer, TileLayer, useMapEvents, Marker as LeafletMarker, Popup } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Map as LeafletMap } from 'leaflet';
import { useEffect, useState, memo } from 'react';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import { boundsAtom, mapAtom, searchedLocationAtom } from 'src/atoms/map';
import { filtersAtom } from 'src/atoms/spots';
import { isLoggedInAtom } from 'src/atoms/auth';
import type { Spot } from 'src/types';
import L, { Icon } from 'leaflet';
import { useGeolocation } from 'src/hooks/useGeolocation';
import { MapSearchAreaButton } from './MapSearchAreaButton';
import { UserLocationMarker } from './UserLocationMarker';
import { MapMarker } from './MapMarker';
import { NewSpotPopup } from './NewSpotPopup';
import { MapControls } from './MapControls';
import { useMapState } from 'src/hooks/useMapState';
import { useSpotCreation } from 'src/hooks/useSpotCreation';

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

const DEFAULT_CENTER = [3.1319, 101.6841] as [number, number];

const currentTheme = {
    name: 'Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

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

    const {
        moved,
        setMoved,
        isFollowingUser,
        circleSize,
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
                <TileLayer url={currentTheme.url} attribution='' />

                {userLocation && (
                    <UserLocationMarker location={userLocation} circleSize={circleSize} />
                )}

                <MarkerClusterGroup
                    key={`cluster-${spots.length}-${JSON.stringify(filters)}`}
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
                    >
                        <Popup autoPan={false}>
                            <Box sx={{ p: 0.5 }}>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
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
                                    sx={{ borderRadius: 1.5, fontSize: '0.7rem', textTransform: 'none' }}
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