import { createFileRoute, Link } from '@tanstack/react-router';
import {
    Box,
    Container,
    Typography,
    Grid,
    Button,
    Divider,
    Card,
    CardMedia,
    CardContent,
    Skeleton,
    Alert,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { ContestSubmissionModal } from './-components/ContestSubmissionModal';
import { ContestCriteriaInfo } from './-components/ContestCriteriaInfo';
import { ContestEntryCard } from './-components/ContestEntryCard';
import { useContestDetails } from './hooks/useContestDetails';
import SEO from '@/components/SEO/SEO';

export const Route = createFileRoute('/contests/$contestId')({
    component: ContestDetailPage,
});

function ContestDetailPage() {
    const { contestId } = Route.useParams();
    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);

    const {
        user,
        isAdmin,
        isJudge,
        contest,
        contestLoading,
        entries,
        entriesLoading,
        userVotes,
        retractEntry,
        voteForEntry,
        isVoting,
        disqualifyEntry
    } = useContestDetails(contestId);

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

                    <ContestCriteriaInfo contest={contest} />

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
                            <ContestEntryCard
                                entry={entry}
                                isAdmin={isAdmin}
                                currentUserId={user?.user.id}
                                contestStatus={contest.status}
                                isJudge={isJudge || false}
                                votingType={contest.voting_type}
                                hasVoted={userVotes?.includes(entry.id) || false}
                                onVote={voteForEntry}
                                onRetract={retractEntry}
                                onDisqualify={disqualifyEntry}
                                isVoting={isVoting}
                            />
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
