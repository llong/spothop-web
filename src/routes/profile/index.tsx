import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import type { FC } from "react";
import { useEffect, useState } from "react";
import supabase from "../../supabase";
import type { Spot } from "src/types";
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Card,
    CardContent,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
} from "@mui/material";
import { useProfile } from "../../hooks/useProfile";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/auth";
import { AvatarUpload } from "./-components/AvatarUpload";
import type { UserProfile } from "../../types";

const ProfileComponent: FC = () => {
    const [user] = useAtom(userAtom);
    const { profile, updateProfile } = useProfile();
    const [formData, setFormData] = useState<UserProfile | null>(null);
    const [favoriteSpots, setFavoriteSpots] = useState<Spot[]>([]);

    useEffect(() => {
        const getFavoriteSpots = async () => {
            if (user?.user.id) {
                const { data } = await supabase
                    .from('user_favorite_spots')
                    .select('spots(*)')
                    .eq('user_id', user.user.id);

                if (data) {
                    const spots: Spot[] = data.map((item: any) => item.spots).filter(Boolean);
                    setFavoriteSpots(spots);
                }
            }
        };
        getFavoriteSpots();
    }, [user]);

    useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile]);

    if (!formData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev!, [name]: value }));
    };

    return (
        <Container sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                Account
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Manage your account settings.
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Account Details
                            </Typography>
                            <Typography variant="body1"><strong>Email:</strong> {user?.user.email}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <AvatarUpload
                                avatarUrl={formData.avatarUrl}
                                onUpload={(url) => updateProfile({ ...formData, avatarUrl: url })}
                            />
                            <Typography variant="h6">{formData.username || "Your Username"}</Typography>
                            <Link to="/profile/$username" params={{ username: formData.username! }}>
                                <Button>View Public Profile</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Public Profile
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                This information will be displayed publicly.
                            </Typography>
                            <Box component="form" onSubmit={(e) => {
                                e.preventDefault();
                                updateProfile(formData);
                            }} noValidate sx={{ mt: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body1"><strong>Username:</strong> {formData.username}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            id="city"
                                            name="city"
                                            label="City"
                                            type="text"
                                            value={formData.city || ""}
                                            onChange={handleFormChange}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            id="country"
                                            name="country"
                                            label="Country"
                                            type="text"
                                            value={formData.country || ""}
                                            onChange={handleFormChange}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            id="bio"
                                            name="bio"
                                            label="Bio"
                                            multiline
                                            rows={4}
                                            value={formData.bio || ""}
                                            onChange={handleFormChange}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="riderType-label">Rider Type</InputLabel>
                                            <Select
                                                labelId="riderType-label"
                                                id="riderType"
                                                name="riderType"
                                                value={formData.riderType || ""}
                                                label="Rider Type"
                                                onChange={handleFormChange}
                                            >
                                                <MenuItem value="inline">Inline</MenuItem>
                                                <MenuItem value="skateboard">Skateboard</MenuItem>
                                                <MenuItem value="bmx">BMX</MenuItem>
                                                <MenuItem value="scooter">Scooter</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            id="instagramHandle"
                                            name="instagramHandle"
                                            label="Instagram Handle"
                                            type="text"
                                            value={formData.instagramHandle || ""}
                                            onChange={handleFormChange}
                                            fullWidth
                                        />
                                    </Grid>
                                </Grid>
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        type="button"
                                        variant="contained"
                                        color="error"
                                        onClick={() => supabase.auth.signOut()}
                                    >
                                        Sign Out
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                    >
                                        Update Profile
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Favorite Spots
                            </Typography>
                            <List>
                                {favoriteSpots.map(spot => (
                                    <ListItem key={spot.id} disablePadding>
                                        <Link to="/spots/$spotId" params={{ spotId: spot.id.toString() }} style={{ textDecoration: 'none', width: '100%' }}>
                                            <ListItemButton>
                                                <ListItemText primary={spot.name} />
                                            </ListItemButton>
                                        </Link>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export const Route = createFileRoute("/profile/")({
    component: ProfileComponent,
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw redirect({
                to: '/login',
            });
        }
    },
});
