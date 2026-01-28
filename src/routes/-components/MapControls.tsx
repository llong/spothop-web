import { memo } from "react";
import { Box, Typography, Fab, CircularProgress } from "@mui/material";
import { MyLocation } from "@mui/icons-material";

interface MapControlsProps {
    locating: boolean;
    isFollowingUser: boolean;
    onCenterOnUser: () => void;
}

export const MapControls = memo(({ locating, isFollowingUser, onCenterOnUser }: MapControlsProps) => {
    return (
        <>
            {locating && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        bgcolor: "rgba(255,255,255,0.9)",
                        p: 1,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        zIndex: 1100,
                        boxShadow: 2,
                    }}
                >
                    <CircularProgress size={20} />
                    <Typography variant="caption">Finding you...</Typography>
                </Box>
            )}

            <Fab
                aria-label="center map"
                onClick={onCenterOnUser}
                disabled={locating}
                size="small"
                sx={{
                    position: "absolute",
                    bottom: { xs: "calc(16px + 56px + env(safe-area-inset-bottom, 0px))", lg: 24 },
                    right: 16,
                    zIndex: 1000,
                    bgcolor: isFollowingUser ? "primary.main" : "white",
                    color: isFollowingUser ? "white" : "text.primary",
                    "&:hover": { bgcolor: isFollowingUser ? "primary.dark" : "grey.100" },
                    boxShadow: 3,
                }}
            >
                {locating ? <CircularProgress size={20} color="inherit" /> : <MyLocation fontSize="small" />}
            </Fab>
        </>
    );
});
