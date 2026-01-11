import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Box, Typography, Grid, CircularProgress, Card, CardContent, Divider, Container } from "@mui/material";
import { useProfileQuery, useSocialStatsQuery, useUserContentQuery } from "../../hooks/useProfileQueries";
import { useAtomValue } from "jotai";
import { userAtom } from "../../atoms/auth";
import { useProfileManagement } from "../../hooks/useProfileManagement";
import { ProfileHeader } from "./-components/ProfileHeader";
import { ProfileForm } from "./-components/ProfileForm";
import { FavoriteSpots } from "./-components/FavoriteSpots";
import { LikedMediaGallery } from "./-components/LikedMediaGallery";
import { UserContentGallery } from "./-components/UserContentGallery";
import type { UserProfile } from "../../types";

export const Route = createLazyFileRoute("/profile/")({
    component: ProfileComponent,
})

function ProfileComponent() {
    const user = useAtomValue(userAtom);
    const userId = user?.user.id;
    const { updateProfile, handleSignOut, createHandleFormChange, isUpdating } = useProfileManagement();

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

    const handleFormChange = createHandleFormChange(setFormData);

    return (
        <Container sx={{ mt: 5 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={800}>
                Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Manage your personal information and profile settings.
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <ProfileHeader
                                profile={profile!}
                                formData={formData!}
                                onAvatarUpload={async (url) => {
                                    await updateProfile({ ...formData!, avatarUrl: url });
                                }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" component="h2" gutterBottom fontWeight={700}>
                                Public Profile
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                This information will be displayed publicly.
                            </Typography>
                            <ProfileForm
                                formData={formData}
                                onFormChange={handleFormChange}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    await updateProfile(formData);
                                }}
                                onSignOut={handleSignOut}
                                isUpdating={isUpdating}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <FavoriteSpots favoriteSpots={favoriteSpots} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" component="h2" gutterBottom fontWeight={700}>
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
                    <LikedMediaGallery likedMedia={likedMedia} loadingMedia={loadingMedia} />
                </Grid>
            </Grid>
        </Container>
    );
}
