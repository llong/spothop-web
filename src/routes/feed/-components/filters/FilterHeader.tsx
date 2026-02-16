import { Stack, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface FilterHeaderProps {
    onClose: () => void;
}

export const FilterHeader = ({ onClose }: FilterHeaderProps) => {
    return (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={800}>Feed Filters</Typography>
            <IconButton onClick={onClose} size="small">
                <CloseIcon />
            </IconButton>
        </Stack>
    );
};
