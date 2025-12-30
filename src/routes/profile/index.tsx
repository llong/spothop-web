import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import type { FC } from "react";
import { useEffect, useState } from "react";
import supabase from "../../supabase";
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
    ListItemAvatar,
    Avatar,
    Stack
} from "@mui/material";
import { Favorite, PlayCircleOutline, ChatBubble } from "@mui/icons-material";
import { useProfileQuery, useSocialStatsQuery, useUserContentQuery, profileKeys } from "../../hooks/useProfileQueries";
import { profileService } from "src/services/profileService";
import { useAtomValue } from "jotai";
import { userAtom } from "../../atoms/auth";
import { AvatarUpload } from "./-components/AvatarUpload";
import { UserContentGallery } from "./-components/UserContentGallery";
import type { UserProfile } from "../../types";

const ProfileComponent: FC = () => {
    const user = useAtomValue(userAtom);
    const userId = user?.user.id;

    // Use specialized queries
    const { data: profile, isLoading: loadingProfile } = useProfileQuery(userId);
    const { data: socialData, isLoading: loadingSocial } = useSocialStatsQuery(userId, !!profile?.displayName);
    const { data: contentData, isLoading: loadingContent } = useUserContentQuery(userId, !!profile?.displayName);

    const [formData, setFormData] = useState<UserProfile | null>(null);

    // Sync form data once when profile is loaded
    useEffect(() => {
        if (profile && !formData) {
            setFormData(profile);
        }
    }, [profile, formData]);

    const favoriteSpots = socialData?.favorites || [];
    const likedMedia = socialData?.likes || [];
    const createdSpots = contentData?.createdSpots || [];
    const userMedia = contentData?.userMedia || [];
    const loadingMedia = loadingSocial;

    if (loadingProfile || !formData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const updateProfile = async (updates: UserProfile) => {
        try {
            // Remove derived/virtual fields that aren't in the DB
            const { followerCount, followingCount, ...dbUpdates } = updates as any;

            const { error } = await supabase.from("profiles").upsert({
                ...dbUpdates,
                id: userId,
                updatedAt: new Date()
            });
            if (error) throw error;
            // Note: In a full refactor, we'd use useMutation here to invalidate queries
            window.location.reload(); // Temporary simple refresh
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev!, [name]: value }));
    };

    return (
        <Container sx={{ mt: 5 }}>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Manage your personal information and profile settings.
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <AvatarUpload
                                avatarUrl={formData.avatarUrl}
                                onUpload={(url) => updateProfile({ ...formData, avatarUrl: url })}
                            />
                            <Typography variant="h6" fontWeight={700}>{formData.displayName || "Set Display Name"}</Typography>
                            <Typography variant="body2" color="text.secondary">@{formData.username}</Typography>
                            <Box sx={{ display: 'flex', gap: 2, my: 1, justifyContent: 'center' }}>
                                <Box>
                                    <Typography variant="h6">{profile?.followerCount || 0}</Typography>
                                    <Typography variant="caption" color="text.secondary">Followers</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h6">{profile?.followingCount || 0}</Typography>
                                    <Typography variant="caption" color="text.secondary">Following</Typography>
                                </Box>
                            </Box>
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <Link to="/profile/$username" params={{ username: formData.username! }} style={{ textDecoration: 'none' }}>
                                    <Button variant="outlined" size="small">View Public Profile</Button>
                                </Link>
                                <Link to="/chat" style={{ textDecoration: 'none' }}>
                                    <Button variant="contained" size="small" startIcon={<ChatBubble />}>Messages</Button>
                                </Link>
                            </Stack>
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
                                        <TextField
                                            id="displayName"
                                            name="displayName"
                                            label="Display Name"
                                            type="text"
                                            value={formData.displayName || ""}
                                            onChange={handleFormChange}
                                            fullWidth
                                            helperText="This is how you will appear to other users."
                                        />
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
                                        onClick={async () => {
                                            await supabase.auth.signOut();
                                            // Force a reload to clear all state and cache safely
                                            window.location.href = '/';
                                        }}
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
                                {favoriteSpots.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">No favorite spots yet.</Typography>
                                )}
                                {favoriteSpots.map(spot => (
                                    <ListItem key={spot.id} disablePadding>
                                        <Link to="/spots/$spotId" params={{ spotId: spot.id.toString() }} style={{ textDecoration: 'none', width: '100%' }}>
                                            <ListItemButton>
                                                <ListItemAvatar>
                                                    <Avatar
                                                        variant="rounded"
                                                        src={spot.photoUrl || undefined}
                                                        alt={spot.name}
                                                        sx={{ width: 128, height: 96, mr: 2 }}
                                                    />
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={spot.name}
                                                    secondary={spot.address || 'No address'}
                                                />
                                            </ListItemButton>
                                        </Link>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Your Activity
                            </Typography>
                            <UserContentGallery
                                createdSpots={createdSpots}
                                uploadedMedia={userMedia}
                                isLoading={loadingContent}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Favorite color="error" fontSize="small" /> Liked Photos & Videos
                            </Typography>
                            <Grid container spacing={2}>
                                {likedMedia.length === 0 && !loadingMedia && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="body2" color="text.secondary">No liked media yet.</Typography>
                                    </Grid>
                                )}
                                {loadingMedia && (
                                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                        <CircularProgress size={24} />
                                    </Grid>
                                )}
                                {likedMedia.map((item) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                                        <Card variant="outlined" sx={{ height: '100%' }}>
                                            <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'black' }}>
                                                {item.type === 'photo' ? (
                                                    <Box
                                                        component="img"
                                                        src={item.url}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                ) : (
                                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Box
                                                            component="img"
                                                            src={item.thumbnailUrl}
                                                            sx={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                opacity: 0.7
                                                            }}
                                                        />
                                                        <PlayCircleOutline sx={{ position: 'absolute', fontSize: 48, color: 'white' }} />
                                                    </Box>
                                                )}
                                            </Box>
                                            <CardContent sx={{ p: 2 }}>
                                                <Link to="/spots/$spotId" params={{ spotId: item.spot.id }} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <Typography variant="subtitle2" fontWeight={700} noWrap gutterBottom>
                                                        {item.spot.name}
                                                    </Typography>
                                                </Link>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="caption" color="text.secondary">By</Typography>
                                                    <Link
                                                        to="/profile/$username"
                                                        params={{ username: item.author.username! }}
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Avatar src={item.author.avatarUrl || undefined} sx={{ width: 16, height: 16 }} />
                                                            <Typography variant="caption" fontWeight={600} color="primary">
                                                                @{item.author.username}
                                                            </Typography>
                                                        </Stack>
                                                    </Link>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
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
            throw redirect({ to: '/login' });
        }
        return { userId: session.user.id };
    },
    loader: async ({ context }) => {
        const { queryClient } = context as any;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;

        // Prefetch basic identity
        await queryClient.ensureQueryData({
            queryKey: profileKeys.detail(userId),
            queryFn: () => profileService.fetchIdentity(userId),
        });

        const profile = queryClient.getQueryData(profileKeys.detail(userId)) as UserProfile | undefined;

        // Prefetch social and content data if onboarding is complete
        if (profile?.displayName) {
            await Promise.all([
                queryClient.ensureQueryData({
                    queryKey: profileKeys.social(userId),
                    queryFn: async () => {
                        const [favorites, likes, stats] = await Promise.all([
                            profileService.fetchFavoriteSpots(userId),
                            profileService.fetchLikedMedia(userId),
                            profileService.fetchFollowStats(userId)
                        ]);
                        return { favorites, likes, ...stats };
                    },
                }),
                queryClient.ensureQueryData({
                    queryKey: profileKeys.content(userId),
                    queryFn: () => profileService.fetchUserContent(userId),
                })
            ]);
        }
    }
});
