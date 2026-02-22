import {
    Card,
    CardMedia,
    CardContent,
    Box,
    Avatar,
    Typography,
    Button,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Undo as UndoIcon,
    Favorite as FavoriteIcon,
} from '@mui/icons-material';

interface ContestEntryCardProps {
    entry: any;
    isAdmin: boolean;
    currentUserId?: string;
    contestStatus: string;
    isJudge: boolean;
    votingType: string;
    hasVoted: boolean;
    onVote: (params: { entryId: string, hasVoted: boolean }) => void;
    onRetract: (entryId: string) => void;
    onDisqualify: (entryId: string) => void;
    isVoting: boolean;
}

export function ContestEntryCard({
    entry,
    isAdmin,
    currentUserId,
    contestStatus,
    isJudge,
    votingType,
    hasVoted,
    onVote,
    onRetract,
    onDisqualify,
    isVoting,
}: ContestEntryCardProps) {
    return (
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
                            onDisqualify(entry.id);
                        }
                    }}
                >
                    Remove Entry
                </Button>
            )}
            {!isAdmin && entry.user_id === currentUserId && contestStatus === 'active' && (
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
                            onRetract(entry.id);
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
                    {contestStatus === 'voting' && (votingType === 'public' || isJudge) && (
                        <Button
                            size="small"
                            variant={hasVoted ? "contained" : "outlined"}
                            startIcon={<FavoriteIcon />}
                            disabled={!currentUserId || isVoting}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                            onClick={() => onVote({
                                entryId: entry.id,
                                hasVoted: hasVoted
                            })}
                        >
                            {hasVoted ? 'Voted' : 'Vote'}
                        </Button>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
