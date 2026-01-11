import { Stack, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface SpotAddressProps {
    displayAddress: string | null;
}

export const SpotAddress = ({ displayAddress }: SpotAddressProps) => {
    return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <LocationOnIcon color="action" />
            <Typography variant="body1" color="text.secondary">
                {displayAddress || 'Loading location...'}
            </Typography>
        </Stack>
    );
};
