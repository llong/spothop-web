import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Icon } from '@mui/material';

interface EmptyStateProps {
  message: string;
  icon?: React.ElementType;
  ctaText?: string;
  onCtaPress?: () => void;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon: IconComponent,
  ctaText,
  onCtaPress,
  subtitle,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
        minHeight: '200px', // Ensure it has some height for visibility
        bgcolor: 'background.paper', // Or a subtle grey
        borderRadius: 2,
      }}
    >
      {IconComponent && (
        <Icon component={IconComponent} sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      )}
      <Typography variant="h6" component="h3" gutterBottom>
        {message}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      {ctaText && onCtaPress && (
        <Button variant="contained" onClick={onCtaPress} sx={{ mt: 2 }}>
          {ctaText}
        </Button>
      )}
    </Box>
  );
};
