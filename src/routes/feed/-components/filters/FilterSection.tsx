import { Box, Typography } from '@mui/material';
import { type ReactNode } from 'react';

interface FilterSectionProps {
    title: string;
    children: ReactNode;
}

export const FilterSection = ({ title, children }: FilterSectionProps) => {
    return (
        <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {title}
            </Typography>
            {children}
        </Box>
    );
};
