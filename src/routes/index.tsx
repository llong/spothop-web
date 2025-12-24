import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, Button, Grid, Typography, useTheme, useMediaQuery, Fab } from "@mui/material";
import { z } from 'zod';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import useSpots from 'src/hooks/useSpots';
import SpotsListCard from './-components/SpotsListCard';
import { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { boundsAtom, getSpotsAtom, mapAtom, viewAtom } from 'src/atoms/map';
import { filtersAtom } from 'src/atoms/spots';
import { MyLocation } from '@mui/icons-material';
import { isLoggedInAtom } from 'src/atoms/auth';
import { FilterBar } from './-components/FilterBar';

const position = [3.1319, 101.6841] as [number, number]

const currentTheme =
{
    name: 'Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',

}


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

function HomeComponent() {
    const { lat, lng } = Route.useSearch();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [view] = useAtom(viewAtom);
    const [map, setMap] = useState<LeafletMap | null>(null);
    const [moved, setMoved] = useState(false);
    const [newSpot, setNewSpot] = useState<{ latlng: L.LatLng, address: string } | null>(null);
    const { spots, getSpots } = useSpots()
    const setMapAtom = useSetAtom(mapAtom);
    const setGetSpotsAtom = useSetAtom(getSpotsAtom);
    const setBoundsAtom = useSetAtom(boundsAtom);
    const isLoggedIn = useAtomValue(isLoggedInAtom)
    const [filters, setFilters] = useAtom(filtersAtom);

    useEffect(() => {
        setMapAtom(map);
        if (map) {
            setBoundsAtom(map.getBounds());
        }
    }, [map, setMapAtom, setBoundsAtom]);

    useEffect(() => {
        setGetSpotsAtom(() => getSpots);
    }, [getSpots, setGetSpotsAtom]);

    useEffect(() => {
        if (!isLoggedIn) {
            setNewSpot(null);
        }
    }, [isLoggedIn]);

    const onMove = useCallback(() => {
        setMoved(true);
    }, []);

    const onRightClick = useCallback(async (latlng: L.LatLng) => {
        console.log(isLoggedIn)
        if (!isLoggedIn) return;
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng.lat},${latlng.lng}&key=AIzaSyA4RiC3UlcdfU3MRNkp0kBirRmSE8V9vdE`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            setNewSpot({ latlng, address: data.results[0].formatted_address });
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (map && !lat && !lng) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 12, {
                    duration: 1
                });
            });
        }
    }, [map, lat, lng]); // Removed getSpots to avoid double fetch? No, getSpots not needed here directly.

    // Effect to fetch spots when map is ready or getSpots changes (e.g. filters change)
    useEffect(() => {
        if (map) {
            // If lat/lng search params are present, we might want to wait for the moveEnd event from flyTo
            // But re-fetching on filter change is needed.
            // getSpots depends on filters, so this runs when filters change.
            getSpots(map.getBounds());
        }
    }, [map, getSpots]);

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

    const mapVisible = !isMobile || view === 'map';
    const listVisible = !isMobile || view === 'list';

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
                alert('Unable to retrieve your location.');
                console.error(error);
            }
        );
    };

    return (
        <Grid container spacing={0} sx={{ height: 'calc(100vh - 64px)' }}>
            {mapVisible && (
                <Grid size={{ xs: 12, lg: 8 }} sx={{ height: '100%', p: 0, position: 'relative' }}>
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

                    <FilterBar filters={filters} onFiltersChange={setFilters} />

                    <MapContainer
                        center={lat && lng ? [lat, lng] : position}
                        zoom={12}
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
                        {spots.map(spot => (
                            <Marker position={[spot.latitude, spot.longitude]} key={spot.id}>
                                <Popup>
                                    <Box>
                                        {spot.photoUrl && <img src={spot.photoUrl} alt={spot.name} style={{ width: '100%', height: 'auto' }} />}
                                        <Typography variant="h6">{spot.name}</Typography>
                                        <Typography variant="body2">{spot.address}</Typography>
                                        <Typography variant="caption">{spot.description}</Typography>
                                    </Box>
                                </Popup>
                            </Marker>
                        ))}
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
                        <Fab
                            color="primary"
                            aria-label="center map"
                            onClick={centerMap}
                            sx={{ position: 'absolute', bottom: { xs: 16 + 56, lg: 16 }, right: 16 }}
                        >
                            <MyLocation />
                        </Fab>
                    </MapContainer>
                </Grid>
            )}
            {listVisible && (
                <Grid size={{ xs: 12, lg: 4 }} sx={{ height: '100%', overflowY: 'auto', p: 2, bgcolor: 'grey.100' }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>Spots</Typography>
                    <Grid container spacing={2}>
                        {spots.length > 0 && spots.map(spot => (
                            <Grid size={{ xs: 12, lg: 6 }} key={spot.id}>
                                <SpotsListCard spot={spot} />
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            )}
        </Grid>
    )
}

const indexSearchSchema = z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
});

export const Route = createFileRoute('/')({
    component: HomeComponent,
    validateSearch: (search) => indexSearchSchema.parse(search),
});
