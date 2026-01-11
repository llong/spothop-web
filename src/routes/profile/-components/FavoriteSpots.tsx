import { Card, CardContent, Typography, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Avatar } from "@mui/material";
import { Link } from "@tanstack/react-router";
import type { Spot } from "src/types";

interface FavoriteSpotsProps {
    favoriteSpots: Spot[];
}

export const FavoriteSpots = ({ favoriteSpots }: FavoriteSpotsProps) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" component="h2" gutterBottom fontWeight={700}>
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
                                        primary={spot.name || 'Unnamed Spot'}
                                        secondary={spot.address || 'No address'}
                                    />
                                </ListItemButton>
                            </Link>
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};