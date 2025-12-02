import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Container, TextField, Button, Typography, Box, Divider, Card, CardContent } from '@mui/material';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import supabase from 'src/supabase';
import { VideoUpload } from './-components/VideoUpload';
import { PhotoUpload } from './-components/PhotoUpload';

const NewSpotComponent = () => {
    const { lat, lng } = Route.useSearch();
    const navigate = useNavigate();
    const [address, setAddress] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [photoUrls, setPhotoUrls] = useState<{
        original: string;
        thumbnailSmall: string;
        thumbnailLarge: string;
    } | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [spotId, setSpotId] = useState<string | null>(null);

    useEffect(() => {
        setSpotId(uuidv4());
    }, []);

    useEffect(() => {
        const getAddress = async () => {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyA4RiC3UlcdfU3MRNkp0kBirRmSE8V9vdE`);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                setAddress(result.formatted_address);
                const postalCodeComponent = result.address_components.find((c: any) => c.types.includes('postal_code'));
                if (postalCodeComponent) {
                    setPostalCode(postalCodeComponent.long_name);
                }
            }
        };
        getAddress();
    }, [lat, lng]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!photoUrls) {
            alert('You must upload at least one photo.');
            return;
        }

        const { error } = await supabase
            .from('spots')
            .insert([{
                id: spotId,
                name,
                description,
                postalCode,
                latitude: lat,
                longitude: lng,
                photoUrl: photoUrls.original,
                videoUrl,
            }]);

        if (error) {
            console.error('Error creating spot:', error);
            alert('Failed to create spot.');
        } else {
            alert('Spot created successfully!');
            navigate({ to: '/' });
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                Add a New Spot
            </Typography>
            <Box sx={{ height: 200, my: 2 }}>
                <MapContainer center={[lat, lng]} zoom={17} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[lat, lng]} />
                </MapContainer>
            </Box>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6">Selected Location</Typography>
                    <Typography variant="body1">{address}</Typography>
                </CardContent>
            </Card>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
                <TextField
                    label="Spot Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    required
                    multiline
                    rows={4}
                    margin="normal"
                />
                <Divider sx={{ my: 3 }} />
                <PhotoUpload onUpload={setPhotoUrls} spotId={spotId} />
                <Divider sx={{ my: 3 }} />
                <VideoUpload onUpload={setVideoUrl} spotId={spotId} />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >
                    Add Spot
                </Button>
            </Box>
        </Container>
    );
};

const newSpotSearchSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
});

export const Route = createFileRoute('/spots/new')({
    component: NewSpotComponent,
    validateSearch: (search) => newSpotSearchSchema.parse(search),
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw redirect({
                to: '/login',
            });
        }
    },
});
