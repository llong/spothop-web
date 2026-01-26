import { Box, Typography, Stack, Button } from "@mui/material";
import { ChatBubble } from "@mui/icons-material";
import { Link } from "@tanstack/react-router";
import { AvatarUpload } from "./AvatarUpload";
import type { UserProfile } from "src/types";

interface ProfileHeaderProps {
    profile: UserProfile;
    socialStats?: { followerCount: number; followingCount: number; favorites?: any[]; likes?: any[] } | null;
    formData: UserProfile;
    onAvatarUpload: (url: string) => Promise<void>;
}

export const ProfileHeader = ({ profile, socialStats, formData, onAvatarUpload }: ProfileHeaderProps) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <AvatarUpload
                avatarUrl={formData.avatarUrl ?? null}
                onUpload={onAvatarUpload}
            />
            <Typography variant="h6" component="h2" fontWeight={700}>
                {formData.displayName || "Set Display Name"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                @{formData.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, my: 1, justifyContent: 'center' }}>
                <Box>
                    <Typography variant="h6">{socialStats?.followerCount || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Followers</Typography>
                </Box>
                <Box>
                    <Typography variant="h6">{socialStats?.followingCount || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Following</Typography>
                </Box>
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Link to="/profile/$username" params={{ username: formData.username! }} style={{ textDecoration: 'none' }}>
                    <Button variant="outlined" size="small">
                        View Public Profile
                    </Button>
                </Link>
                <Link to="/chat" style={{ textDecoration: 'none' }}>
                    <Button variant="contained" size="small" startIcon={<ChatBubble />}>
                        Messages
                    </Button>
                </Link>
            </Stack>
        </Box>
    );
};
