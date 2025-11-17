import { createFileRoute, useNavigate } from '@tanstack/react-router';
import supabase from '../../supabase';
import { Container, Box, Typography, Avatar, Card, CardContent, Grid, Divider, Button } from '@mui/material';
import type { UserProfile } from '../../types';

// Loader function to fetch profile data
const loader = async ({ params }: { params: { username: string } }) => {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`username, "avatarUrl", city, country, "riderType", bio, "instagramHandle"`)
        .eq('username', params.username)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return profile as UserProfile;
};

const PublicProfileComponent = () => {
    const navigate = useNavigate();
    const profile = Route.useLoaderData();

    if (!profile) {
        return (
            <Container sx={{ mt: 5 }}>
                <Typography variant="h4">Profile not found</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 5 }}>
            <Button onClick={() => navigate({ to: '..' })}>Back</Button>
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Avatar src={profile.avatarUrl || ""} sx={{ width: 120, height: 120, mb: 2 }} />
                            <Typography variant="h4">{profile.username}</Typography>
                            <Typography variant="body1" color="text.secondary">{profile.city}, {profile.country}</Typography>
                            <Divider sx={{ my: 2, width: '100%' }} />
                            <Typography variant="h6">Bio</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>{profile.bio}</Typography>
                            <Divider sx={{ my: 2, width: '100%' }} />
                            <Box>
                                <Typography variant="h6">Rider Type</Typography>
                                <Typography variant="body1">{profile.riderType}</Typography>
                            </Box>
                            {profile.instagramHandle && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6">Instagram</Typography>
                                    <Typography variant="body1">@{profile.instagramHandle}</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export const Route = createFileRoute('/profile/$username')({
    component: PublicProfileComponent,
    loader,
});
