import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminContestService } from '../../../services/adminContestService';

export function useAdminContests() {
    const queryClient = useQueryClient();

    const { data: contests, isLoading } = useQuery({
        queryKey: ['admin', 'contests'],
        queryFn: () => adminContestService.fetchAllContests()
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminContestService.deleteContest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'contests'] });
        }
    });

    return {
        contests,
        isLoading,
        deleteContest: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending
    };
}
