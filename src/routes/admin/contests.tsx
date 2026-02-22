import { createFileRoute } from '@tanstack/react-router';
import {
    Box,
    Container,
    Typography,
    Button,
} from '@mui/material';
import {
    Add as AddIcon
} from '@mui/icons-material';
import { useState } from 'react';
import type { Contest } from '../../types';
import { ContestTable } from './-components/ContestTable';
import { ContestFormDialog } from './-components/ContestFormDialog';
import { useAdminContests } from './hooks/useAdminContests';

export const Route = createFileRoute('/admin/contests')({
    component: AdminContestsPage,
});

export function AdminContestsPage() {
    const { contests, deleteContest } = useAdminContests();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingContest, setEditingContest] = useState<Contest | null>(null);

    const handleEdit = (contest: Contest) => {
        setEditingContest(contest);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingContest(null);
        setIsFormOpen(true);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">Manage Contests</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    New Contest
                </Button>
            </Box>

            <ContestTable
                contests={contests || []}
                onEdit={handleEdit}
                onDelete={deleteContest}
            />

            <ContestFormDialog
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                contest={editingContest}
            />
        </Container>
    );
}
