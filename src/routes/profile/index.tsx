import { createFileRoute } from "@tanstack/react-router";
import type { FC } from "react";
import { useEffect, useState, useRef } from "react";
import supabase from "../../supabase";
import type { Session } from "@supabase/supabase-js";
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Avatar,
    Card,
    CardContent,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Modal,
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface UserProfile {
    username: string | null;
    avatarUrl: string | null;
    city: string | null;
    country: string | null;
    riderType: string | null;
    bio: string | null;
    instagramHandle: string | null;
}

const ProfileComponent: FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        username: null,
        avatarUrl: null,
        city: null,
        country: null,
        riderType: null,
        bio: null,
        instagramHandle: null,
    });
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [openCrop, setOpenCrop] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);


    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            getProfile();
        }
    }, [session]);

    const getProfile = async () => {
        try {
            setLoading(true);
            if (!session?.user) throw new Error("No user on the session!");

            const { data, error, status } = await supabase
                .from("profiles")
                .select(`username, "avatarUrl", city, country, "riderType", bio, "instagramHandle"`)
                .eq("id", session?.user.id)
                .single();
            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setProfile({
                    username: data.username,
                    avatarUrl: data.avatarUrl,
                    city: data.city,
                    country: data.country,
                    riderType: data.riderType,
                    bio: data.bio,
                    instagramHandle: data.instagramHandle,
                });
            }
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setLoading(true);
            if (!session?.user) throw new Error("No user on the session!");

            const updates = {
                id: session?.user.id,
                username: profile.username,
                "avatarUrl": profile.avatarUrl,
                city: profile.city,
                country: profile.country,
                "riderType": profile.riderType,
                bio: profile.bio,
                "instagramHandle": profile.instagramHandle,
                "spotsContributed": [],
                "likedSpots": [],
                "dislikedSpots": [],
                "updatedAt": new Date(),
            };

            const { error } = await supabase.from("profiles").upsert(updates);

            if (error) {
                throw error;
            }
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Makes crop preview update between images.
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                setImgSrc(reader.result?.toString() || ''),
            );
            reader.readAsDataURL(e.target.files[0]);
            setOpenCrop(true);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                1,
                width,
                height,
            ),
            width,
            height,
        ));
    };

    const uploadAvatar = async () => {
        if (!completedCrop || !imgRef.current) {
            throw new Error("Crop details not available.");
        }

        const canvas = document.createElement("canvas");
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        const pixelRatio = window.devicePixelRatio;
        canvas.width = completedCrop.width * pixelRatio;
        canvas.height = completedCrop.height * pixelRatio;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            500,
            500
        );


        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });

        if (!blob) {
            throw new Error("Failed to create blob.");
        }

        try {
            setUploading(true);
            setOpenCrop(false);

            const file = (document.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
            if (!file) {
                throw new Error("No file selected.");
            }
            const fileExt = file.name.split('.').pop();
            const filePath = `${session?.user.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, blob, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            const updates = {
                ...profile,
                id: session?.user.id,
                "avatarUrl": publicUrl,
                "updatedAt": new Date(),
            };

            const { error } = await supabase.from("profiles").upsert(updates);

            if (error) {
                throw error;
            }
            getProfile();
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        } finally {
            setUploading(false);
        }
    };


    return (
        <Container sx={{ mt: 5 }}>
            <Modal open={openCrop} onClose={() => setOpenCrop(false)}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    {imgSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imgSrc}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    )}
                    <Button onClick={uploadAvatar} variant="contained" sx={{ mt: 2 }}>Crop and Upload</Button>
                </Box>
            </Modal>
            <Typography variant="h4" gutterBottom>
                Account
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Manage your account settings and public profile.
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <Avatar
                                    src={profile.avatarUrl || ""}
                                    sx={{ width: 80, height: 80, mb: 2 }}
                                />
                                <IconButton
                                    color="primary"
                                    aria-label="upload picture"
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        backgroundColor: 'white',
                                        '&:hover': {
                                            backgroundColor: 'grey.200',
                                        },
                                    }}
                                >
                                    <input hidden accept="image/*" type="file" onChange={onSelectFile} />
                                    <PhotoCamera />
                                </IconButton>
                            </Box>
                            <Typography variant="h6">{profile.username || "Your Username"}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Profile
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                This information will be displayed publicly.
                            </Typography>
                            <Box component="form" onSubmit={updateProfile} noValidate sx={{ mt: 3 }}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            id="email"
                                            label="Email"
                                            type="text"
                                            value={session?.user.email || ""}
                                            disabled
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            id="username"
                                            label="Username"
                                            type="text"
                                            value={profile.username || ""}
                                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            id="city"
                                            label="City"
                                            type="text"
                                            value={profile.city || ""}
                                            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            id="country"
                                            label="Country"
                                            type="text"
                                            value={profile.country || ""}
                                            onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            id="bio"
                                            label="Bio"
                                            multiline
                                            rows={4}
                                            value={profile.bio || ""}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel id="riderType-label">Rider Type</InputLabel>
                                            <Select
                                                labelId="riderType-label"
                                                id="riderType"
                                                value={profile.riderType || ""}
                                                label="Rider Type"
                                                onChange={(e) => setProfile({ ...profile, riderType: e.target.value })}
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
                                            label="Instagram Handle"
                                            type="text"
                                            value={profile.instagramHandle || ""}
                                            onChange={(e) => setProfile({ ...profile, instagramHandle: e.target.value })}
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
                                        disabled={loading || uploading}
                                        sx={{ position: 'relative' }}
                                    >
                                        {(loading || uploading) && (
                                            <CircularProgress
                                                size={24}
                                                sx={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    marginTop: '-12px',
                                                    marginLeft: '-12px',
                                                }}
                                            />
                                        )}
                                        {loading || uploading ? "" : "Update Profile"}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export const Route = createFileRoute("/profile/")({
    component: ProfileComponent,
});
