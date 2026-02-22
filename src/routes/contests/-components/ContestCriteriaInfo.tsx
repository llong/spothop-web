import {
    Box,
    Grid,
    Typography,
    Stack,
} from '@mui/material';
import {
    EmojiEvents as PrizeIcon,
    Rule as RuleIcon,
} from '@mui/icons-material';
import type { Contest } from "@/types";

interface ContestCriteriaInfoProps {
    contest: Contest;
}

export function ContestCriteriaInfo({ contest }: ContestCriteriaInfoProps) {
    return (
        <Grid container spacing={3} sx={{ mt: 1, mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PrizeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold">Prizes</Typography>
                </Box>
                <Typography variant="body2" color="text.primary">
                    {contest.prize_info || "To be announced!"}
                </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <RuleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold">Rules & Criteria</Typography>
                </Box>
                <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                            Deadline:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {new Date(contest.end_date).toLocaleDateString()}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                            Open To:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                            {contest.criteria.allowed_rider_types?.length
                                ? contest.criteria.allowed_rider_types.join(', ')
                                : 'All Riders'}
                        </Typography>
                    </Box>

                    {contest.criteria.required_media_types && contest.criteria.required_media_types.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Format:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                                {contest.criteria.required_media_types.join(', ')}
                            </Typography>
                        </Box>
                    )}

                    {contest.criteria.allowed_spot_types && contest.criteria.allowed_spot_types.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Spots:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                                {contest.criteria.allowed_spot_types.join(', ').replace(/_/g, ' ')}
                            </Typography>
                        </Box>
                    )}

                    {contest.criteria.allowed_difficulties && contest.criteria.allowed_difficulties.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Difficulty:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                                {contest.criteria.allowed_difficulties.join(', ')}
                            </Typography>
                        </Box>
                    )}

                    {contest.criteria.allowed_is_lit && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Lighting:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                Spot must be lit
                            </Typography>
                        </Box>
                    )}

                    {contest.criteria.allowed_kickout_risk_max !== undefined && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Max Risk:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                {contest.criteria.allowed_kickout_risk_max}/10
                            </Typography>
                        </Box>
                    )}

                    {(contest.criteria.location_radius_km && contest.criteria.location_latitude && contest.criteria.location_longitude) ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Location:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                Within {(contest.criteria.location_radius_km / 1.60934).toFixed(1)} miles of center
                            </Typography>
                        </Box>
                    ) : null}

                    {contest.criteria.specific_spot_id && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Location:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                Specific spot required
                            </Typography>
                        </Box>
                    )}

                    {contest.criteria.require_spot_creator_is_competitor && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Creator:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                Must be spot creator
                            </Typography>
                        </Box>
                    )}

                    {contest.criteria.spot_creation_time_frame && contest.criteria.spot_creation_time_frame !== 'anytime' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontWeight: 600 }}>
                                Spot Age:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                                Created {contest.criteria.spot_creation_time_frame.replace(/_/g, ' ')}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Grid>
        </Grid>
    );
}
