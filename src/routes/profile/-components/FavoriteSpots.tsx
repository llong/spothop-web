import { Box, List, Typography } from "@mui/material";
import type { Spot } from "@/types";
import { SpotGalleryItem } from "./SpotGalleryItem";

export const FavoriteSpots = ({ favoriteSpots }: { favoriteSpots: Spot[] }) => (
    <Box component="section">
        <Typography variant="h6" component="h2" gutterBottom fontWeight={700}>
            Favorite Spots
        </Typography>
        {favoriteSpots.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No favorite spots yet.</Typography>
        ) : (
            <List disablePadding>
                {favoriteSpots.map(spot => <SpotGalleryItem key={spot.id} spot={spot} />)}
            </List>
        )}
    </Box>
);
