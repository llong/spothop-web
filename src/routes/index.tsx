import { createFileRoute } from '@tanstack/react-router';
import { Box, Button, Grid, Typography } from "@mui/material";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import useSpots from 'src/hooks/useSpots';
import SpotsListCard from './-components/SpotsListCard';
import { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { boundsAtom, getSpotsAtom, mapAtom } from 'src/atoms/map';

const position = [3.1319, 101.6841] as [number, number]

const currentTheme =
{
    name: 'Positron (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',

}


function MapEvents({ onMove }: { onMove: () => void }) {
    useMapEvents({
        move: onMove,
    });
    return null;
}

function HomeComponent() {
    const [map, setMap] = useState<LeafletMap | null>(null);
    const [moved, setMoved] = useState(false);
    const { spots, getSpots } = useSpots()
    const setMapAtom = useSetAtom(mapAtom);
    const setGetSpotsAtom = useSetAtom(getSpotsAtom);
    const setBoundsAtom = useSetAtom(boundsAtom);

    useEffect(() => {
        setMapAtom(map);
        if (map) {
            setBoundsAtom(map.getBounds());
        }
    }, [map, setMapAtom, setBoundsAtom]);

    useEffect(() => {
        setGetSpotsAtom(() => getSpots);
    }, [getSpots, setGetSpotsAtom]);

    const onMove = useCallback(() => {
        setMoved(true);
    }, []);

    useEffect(() => {
        if (map) {
            getSpots();
        }
    }, [map, getSpots]);
    return (
        <Grid container spacing={0} sx={{ height: 'calc(100vh - 64px)' }}>
            <Grid size={{ xs: 12, md: 8 }} sx={{ height: '100%', p: 0, position: 'relative' }}>
                {moved && (
                    <Box sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                        <Button variant="contained" onClick={() => {
                            getSpots();
                            setMoved(false);
                        }}>
                            Search this area
                        </Button>
                    </Box>
                )}
                <MapContainer
                    center={position}
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={false}
                    ref={setMap}
                >
                    <MapEvents onMove={onMove} />
                    <TileLayer
                        url={currentTheme.url}
                        attribution=''
                    />
                    {spots.map(spot => (
                        <Marker position={[spot.latitude, spot.longitude]} key={spot.id}>
                            <Popup>
                                A pretty CSS3 popup. <br /> Easily customizable.
                            </Popup>
                        </Marker>
                    ))}

                </MapContainer>
            </Grid>
            <Grid size={{ lg: 4, md: 12 }} sx={{ height: '100%', overflowY: 'auto', p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Spots</Typography>
                <Grid container spacing={2}>
                    {spots.length > 0 && spots.map(spot => (
                        <Grid size={{ xs: 12, lg: 6 }} key={spot.id}>
                            <SpotsListCard spot={spot} />
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        </Grid>
    )
}

export const Route = createFileRoute('/')({
    component: HomeComponent,
});
