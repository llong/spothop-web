import {
    Box,
    Typography,
    Stack,
    Button,
    Avatar,
    Chip,
} from '@mui/material';
import { Link as RouterLink } from '@tanstack/react-router';
import type { FeedFilters } from 'src/atoms/feed';

interface FeedHeaderProps {
    hasActiveFilters: boolean;
    onFilterClick: () => void;
    onClearFilters: () => void;
    filters: FeedFilters;
    onRemoveLocation: () => void;
}

export function FeedHeader({
    hasActiveFilters,
    onFilterClick,
    onClearFilters,
    filters,
    onRemoveLocation,
}: FeedHeaderProps) {
    return (
        <Box sx={{ pt: 2, px: 2 }}>
            <Box sx={{ display: { lg: 'none' }, mb: 2 }}>
                <Typography variant="h5" fontWeight={900}>
                    SpotHop
                </Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
                    <Button
                        onClick={onFilterClick}
                        color="inherit"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: hasActiveFilters ? 'primary.main' : 'text.secondary',
                        }}
                    >
                        {hasActiveFilters ? 'Filters Active' : 'Filter Results'}
                    </Button>
                    {hasActiveFilters && (
                        <Button
                            variant="text"
                            onClick={onClearFilters}
                            sx={{
                                color: 'primary.main',
                                fontWeight: 700,
                                textTransform: 'none',
                                ml: 1,
                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </Box>
            </Stack>

            {(filters.author || filters.selectedLocation) && (
                <Stack direction="column" spacing={1} sx={{ pb: 1.5 }}>
                    {filters.author && (
                        <RouterLink
                            to="/profile/$username"
                            params={{ username: filters.author.username }}
                            style={{ textDecoration: 'none', width: '100%', flexShrink: 1 }}
                        >
                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                startIcon={<Avatar src={filters.author.avatarUrl || undefined} sx={{ width: 24, height: 24 }} />}
                                sx={{
                                    justifyContent: 'flex-start',
                                    textTransform: 'none',
                                    borderRadius: 3,
                                    py: 1,
                                    px: 2,
                                    fontWeight: 700,
                                    borderWidth: 1.5,
                                    '&:hover': { borderWidth: 1.5 }
                                }}
                            >
                                <Box sx={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                                    <Typography variant="subtitle2" component="span" sx={{ display: 'block', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {filters.author.displayName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        View Profile (@{filters.author.username})
                                    </Typography>
                                </Box>
                            </Button>
                        </RouterLink>
                    )}
                    {filters.selectedLocation && (
                        <Chip
                            label={`Near ${filters.selectedLocation.name}`}
                            onDelete={onRemoveLocation}
                            color="secondary"
                            variant="outlined"
                            sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
                        />
                    )}
                </Stack>
            )}
        </Box>
    );
}
