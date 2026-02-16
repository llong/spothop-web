import { Box, Chip } from '@mui/material';

interface ChipFilterProps {
    items: string[];
    selectedItems: string[];
    onToggle: (item: string) => void;
}

export const ChipFilter = ({ items, selectedItems, onToggle }: ChipFilterProps) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {items.map(item => (
                <Chip
                    key={item}
                    label={item.replace('_', ' ').toUpperCase()}
                    onClick={() => onToggle(item)}
                    color={selectedItems.includes(item) ? "primary" : "default"}
                    variant={selectedItems.includes(item) ? "filled" : "outlined"}
                    size="small"
                />
            ))}
        </Box>
    );
};
