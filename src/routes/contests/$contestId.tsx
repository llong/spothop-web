import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contestService } from '@/services/contestService';
import {
    Box,
    Container,
    Typography,
    Grid,
    Button,
    Divider,
    Avatar,
    Card,
    CardMedia,
    CardContent,
    Skeleton,
    Alert,
    Stack
} from '@mui/material';
import {
    Favorite as FavoriteIcon,
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    EmojiEvents as PrizeIcon,
    Rule as RuleIcon,
    Delete as DeleteIcon,
    Undo as UndoIcon
} from '@mui/icons-material';
import { adminContestService } from '@/services/adminContestService';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/atoms/auth';
import { useProfileQuery } from '@/hooks/useProfileQueries';
import { useState } from 'react';
import { ContestSubmissionModal } from './-components/ContestSubmissionModal';
import SEO from '@/components/SEO/SEO';

export const Route = createFileRoute('/contests/$contestId')({
    component: ContestDetailPage,
});

function ContestDetailPage() {
    const { contestId } = Route.useParams();
    const user = useAtomValue(userAtom);
    const { data: profile } = useProfileQuery(user?.user.id);
    const isAdmin = profile?.role === 'admin';
    const queryClient = useQueryClient();
    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);

    const { data: contest, isLoading: contestLoading } = useQuery({
        queryKey: ['contests', contestId],
        queryFn: () => contestService.fetchContestById(contestId)
    });

    const { data: entries, isLoading: entriesLoading } = useQuery({
        queryKey: ['contests', contestId, 'entries'],
        queryFn: () => contestService.fetchContestEntries(contestId)
    });

    const { data: userVotes } = useQuery({
        queryKey: ['contests', contestId, 'my-votes'],
        queryFn: async () => {
            if (!user) return [];
            // This is a bit inefficient but for small number of entries it's fine
            const votes = await Promise.all(
                (entries || []).map(async (entry) => {
                    const voted = await contestService.hasUserVoted(entry.id, user.user.id);
                    return voted ? entry.id : null;
                })
            );
            return votes.filter(Boolean) as string[];
        },
        enabled: !!user && !!entries
    });

    const retractMutation = useMutation({
        mutationFn: (entryId: string) => contestService.retractEntry(entryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contests', contestId, 'entries'] });
            queryClient.invalidateQueries({ queryKey: ['contests', contestId, 'my-votes'] });
        }
    });

    const isJudge = contest?.criteria?.judges?.includes((profile as any)?.id || '');

    const voteMutation = useMutation({
        mutationFn: ({ entryId, hasVoted }: { entryId: string, hasVoted: boolean }) =>
            hasVoted ? contestService.removeVote(entryId) : contestService.voteForEntry(contestId, entryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contests', contestId, 'entries'] });
            queryClient.invalidateQueries({ queryKey: ['contests', contestId, 'my-votes'] });
        }
    });

    const disqualifyMutation = useMutation({
        mutationFn: (entryId: string) => adminContestService.moderateEntry(entryId, 'disqualified'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contests', contestId, 'entries'] });
        }
    });

    if (contestLoading) return <Container maxWidth="md" sx={{ py: 4 }}><Skeleton variant="rectangular" height={400} /></Container>;
    if (!contest) return <Container maxWidth="md" sx={{ py: 4 }}><Typography>Contest not found</Typography></Container>;

    const flyerImageSrc = contest.flyer_url || '/spothopIcon.png';

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <SEO
                title={contest.title}
                description={contest.description || undefined}
                image={contest.flyer_url || undefined}
                url={`/contests/${contest.id}`}
            />
            <Button
                startIcon={<ArrowBackIcon />}
                component={Link}
                to="/contests"
                sx={{ mb: 3, color: 'text.secondary', textTransform: 'none' }}
            >
                Back to Contests
            </Button>

            {/* Contest Header Card */}
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200', mb: 4, overflow: 'hidden' }}>
                <CardMedia
                    component="img"
                    image={flyerImageSrc}
                    alt={contest.title}
                    sx={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <CardContent sx={{ p: 3 }}>
                    <Box mb={3}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {contest.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {contest.description}
                        </Typography>
                    </Box>

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

                    {contest.status === 'active' && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                            {user ? (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{
                                        borderRadius: 2,
                                        px: 4,
                                        py: 1.2,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                    }}
                                    onClick={() => setSubmissionModalOpen(true)}
                                >
                                    Enter Contest
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    component={Link}
                                    to="/signup"
                                    startIcon={<AddIcon />}
                                    sx={{
                                        borderRadius: 2,
                                        px: 4,
                                        py: 1.2,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Sign Up To Enter
                                </Button>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Divider sx={{ mb: 4 }} />

            {/* Entries Section */}
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                Entries ({entries?.length || 0})
            </Typography>

            {entriesLoading ? (
                <Grid container spacing={2}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : entries && entries.length > 0 ? (
                <Grid container spacing={3}>
                    {entries.map((entry) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={entry.id}>
                            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200', position: 'relative' }}>
                                {isAdmin && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<DeleteIcon />}
                                        sx={{
                                            position: 'absolute',
                                            top: 10,
                                            left: 10,
                                            zIndex: 2,
                                            bgcolor: 'black',
                                            color: 'white',
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                                        }}
                                        onClick={() => {
                                            if (window.confirm('Admin: Are you sure you want to remove this entry?')) {
                                                disqualifyMutation.mutate(entry.id);
                                            }
                                        }}
                                    >
                                        Remove Entry
                                    </Button>
                                )}
                                {!isAdmin && entry.user_id === user?.user.id && contest?.status === 'active' && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<UndoIcon />}
                                        sx={{
                                            position: 'absolute',
                                            top: 10,
                                            left: 10,
                                            zIndex: 2,
                                            bgcolor: 'black',
                                            color: 'white',
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                                        }}
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to remove your entry? You can submit a new one after.')) {
                                                retractMutation.mutate(entry.id);
                                            }
                                        }}
                                    >
                                        Remove Entry
                                    </Button>
                                )}
                                <CardMedia
                                    component={entry.media_type === 'video' ? 'video' : 'img'}
                                    height="240"
                                    image={entry.media_type === 'video' ? undefined : entry.media_url}
                                    src={entry.media_type === 'video' ? entry.media_url : undefined}
                                    controls={entry.media_type === 'video'}
                                    sx={{
                                        bgcolor: 'black',
                                    }}
                                />
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Avatar
                                            src={entry.author?.avatarUrl || undefined}
                                            sx={{ width: 32, height: 32, mr: 1 }}
                                        />
                                        <Box>
                                            <Typography variant="subtitle2" lineHeight={1.2}>
                                                {entry.author?.username}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {entry.spot?.name}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                                        <Typography variant="body2" fontWeight="medium" color="text.primary">
                                            {entry.vote_count} votes
                                        </Typography>
                                        {contest.status === 'voting' && (contest.voting_type === 'public' || isJudge) && (
                                            <Button
                                                size="small"
                                                variant={userVotes?.includes(entry.id) ? "contained" : "outlined"}
                                                startIcon={<FavoriteIcon />}
                                                disabled={!user || voteMutation.isPending}
                                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                                onClick={() => voteMutation.mutate({
                                                    entryId: entry.id,
                                                    hasVoted: userVotes?.includes(entry.id) || false
                                                })}
                                            >
                                                {userVotes?.includes(entry.id) ? 'Voted' : 'Vote'}
                                            </Button>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                    No entries yet. Be the first to submit!
                </Alert>
            )}

            <ContestSubmissionModal
                open={submissionModalOpen}
                onClose={() => setSubmissionModalOpen(false)}
                contest={contest}
            />
        </Container>
    );
}
