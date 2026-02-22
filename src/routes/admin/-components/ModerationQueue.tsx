import {
    Box,
    Typography,
    Alert,
    Paper,
    Stack,
    Chip,
    Grid,
    Button,
} from '@mui/material';
import {
    DeleteForever,
    CheckCircleOutline,
} from '@mui/icons-material';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ModerationCard } from './ModerationCard';
import type { ContentReport } from '../../../types';

interface ModerationQueueProps {
    reports: ContentReport[];
    isLoading: boolean;
    error: any;
    onResolve: (id: string) => void;
    onDelete: (params: { type: any; id: string }) => void;
    isActioning: boolean;
}

export function ModerationQueue({
    reports,
    isLoading,
    error,
    onResolve,
    onDelete,
    isActioning,
}: ModerationQueueProps) {
    return (
        <Box>
            <Typography variant="h5" gutterBottom fontWeight={700} sx={{ mb: 3 }}>
                Moderation Queue
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Error loading reports: {error.message}
                </Alert>
            )}
            {isLoading ? (
                <Typography>Loading reports...</Typography>
            ) : reports.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography color="text.secondary">
                        All clear! No pending reports found.
                    </Typography>
                </Paper>
            ) : (
                reports.map((report) => (
                    <Paper key={report.id} sx={{ p: 3, mb: 3, borderLeft: 6, borderColor: 'warning.main' }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <Chip
                                        label={report.target_type.toUpperCase()}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 700 }}
                                    />
                                    <Typography variant="h6" fontWeight={700}>
                                        {report.reason}
                                    </Typography>
                                </Stack>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Reported by <strong>@{report.reporter?.username}</strong> on {format(new Date(report.created_at), 'PPP p')}
                                </Typography>

                                {report.details && (
                                    <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                                        <Typography variant="body1">
                                            "{report.details}"
                                        </Typography>
                                    </Box>
                                )}

                                <Typography variant="caption" display="block" sx={{ color: 'grey.500', mb: 2 }}>
                                    Target ID: {report.target_id}
                                </Typography>

                                {report.target_content && (
                                    <Box sx={{ mb: 2 }}>
                                        {report.context_id ? (
                                            <Link
                                                to="/spots/$spotId"
                                                params={{ spotId: report.context_id }}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <ModerationCard report={report} />
                                            </Link>
                                        ) : (
                                            <ModerationCard report={report} />
                                        )}
                                    </Box>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        color="inherit"
                                        startIcon={<CheckCircleOutline />}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onResolve(report.id);
                                        }}
                                        disabled={isActioning}
                                    >
                                        Dismiss
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<DeleteForever />}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (window.confirm(`Are you sure you want to delete this ${report.target_type}?`)) {
                                                onDelete({ type: report.target_type, id: report.target_id })
                                            }
                                        }}
                                        disabled={isActioning}
                                    >
                                        Delete
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>
                ))
            )}
        </Box>
    );
}
