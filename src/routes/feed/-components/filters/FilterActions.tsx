import { Box, Button } from '@mui/material';

interface FilterActionsProps {
    onReset: () => void;
    onApply: () => void;
}

export const FilterActions = ({ onReset, onApply }: FilterActionsProps) => {
    return (
        <Box sx={{ pt: 2, display: 'flex', gap: 2 }}>
            <Button
                variant="outlined"
                fullWidth
                onClick={onReset}
                sx={{ borderRadius: 10 }}
            >
                Reset
            </Button>
            <Button
                variant="contained"
                fullWidth
                onClick={onApply}
                sx={{ borderRadius: 10, fontWeight: 700 }}
            >
                Apply Filters
            </Button>
        </Box>
    );
};
