import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Contest } from '../../../types';

interface ContestTableProps {
    contests: Contest[];
    onEdit: (contest: Contest) => void;
    onDelete: (id: string) => void;
}

export function ContestTable({ contests, onEdit, onDelete }: ContestTableProps) {
    return (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Timeframe</TableCell>
                        <TableCell>Voting</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {contests.map((contest) => (
                        <TableRow key={contest.id}>
                            <TableCell sx={{ fontWeight: "medium" }}>{contest.title}</TableCell>
                            <TableCell>
                                <Chip
                                    label={contest.status.toUpperCase()}
                                    size="small"
                                    color={contest.status === 'active' ? 'success' : 'default'}
                                />
                            </TableCell>
                            <TableCell>
                                {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                <Chip label={contest.voting_type} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell align="right">
                                <IconButton onClick={() => onEdit(contest)} color="primary">
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => {
                                        if (window.confirm('Delete this contest?')) {
                                            onDelete(contest.id);
                                        }
                                    }}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
