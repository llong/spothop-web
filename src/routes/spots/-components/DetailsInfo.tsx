import {
    Box,
    Typography,
    Stack,
    Avatar,
    Divider,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import LightModeIcon from '@mui/icons-material/LightMode';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import type { Spot } from 'src/types';

interface DetailsInfoProps {
    spot: Spot;
}

export const DetailsInfo = ({ spot }: DetailsInfoProps) => {
    const locationString = [spot.address, spot.city, spot.state, spot.country].filter(Boolean).join(', ');

    return (
        <Stack spacing={3}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '2.5rem' }, color: 'text.primary' }}>
                {spot.name}
            </Typography>
            {/* Creator Info */}

            <Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                    <LocationOnIcon sx={{ fontSize: 16 }} />
                    {locationString}
                </Typography>

                <Stack direction="row" spacing={3} alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                        <FitnessCenterIcon sx={{ fontSize: 20 }} />
                        <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'uppercase' }}>
                            {spot.difficulty || 'intermediate'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                        <LocalPoliceIcon sx={{ fontSize: 20 }} />
                        <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'uppercase' }}>
                            {(spot.kickout_risk || 0) <= 3 ? 'Low Risk' : (spot.kickout_risk || 0) <= 7 ? 'Med Risk' : 'High Risk'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                        <LightModeIcon sx={{ fontSize: 20 }} />
                        <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'uppercase' }}>
                            {spot.is_lit ? 'Lit' : 'Not Lit'}
                        </Typography>
                    </Stack>
                </Stack>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Link to="/profile/$username" params={{ username: spot.creator?.username || 'unknown' }}>
                    <Avatar
                        src={spot.creator?.avatarUrl || undefined}
                        sx={{ width: 40, height: 40, border: '1px solid', borderColor: 'divider' }}
                    />
                </Link>
                <Box>
                    <Link
                        to="/profile/$username"
                        params={{ username: spot.creator?.username || 'unknown' }}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                            {spot.creator?.displayName || spot.creator?.username || 'Unknown User'}
                        </Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Posted {spot.created_at ? formatDistanceToNow(new Date(spot.created_at), { addSuffix: true }) : ''}
                    </Typography>
                </Box>
            </Box>

            <Divider />

            <Box>
                <Typography variant="h6" fontWeight={800} gutterBottom sx={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'text.secondary' }}>
                    About this spot
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'text.primary', maxWidth: '65ch' }}>
                    {spot.description || "No description provided."}
                </Typography>
            </Box>
        </Stack>
    );
};