import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/adminService";

export const useAdminQueries = () => {
    const queryClient = useQueryClient();

    // Fetch reports
    const reportsQuery = useQuery({
        queryKey: ['admin', 'reports'],
        queryFn: () => adminService.fetchReports(),
    });

    // Resolve report mutation
    const resolveReportMutation = useMutation({
        mutationFn: (reportId: string) => adminService.resolveReport(reportId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
        },
    });

    // Delete content mutation
    const deleteContentMutation = useMutation({
        mutationFn: ({ type, id }: { type: 'spot' | 'comment' | 'media', id: string }) =>
            adminService.deleteReportTarget(type, id),
        onSuccess: () => {
            // Invalidate reports as triggers should have cleaned them up
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            // Also invalidate relevant content queries if necessary
            queryClient.invalidateQueries({ queryKey: ['spots'] });
            queryClient.invalidateQueries({ queryKey: ['comments'] });
        },
    });

    // Toggle user ban mutation
    const toggleBanMutation = useMutation({
        mutationFn: ({ userId, isBanned }: { userId: string, isBanned: boolean }) =>
            adminService.toggleUserBan(userId, isBanned),
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });

    return {
        reports: reportsQuery.data ?? [],
        isLoadingReports: reportsQuery.isLoading,
        reportsError: reportsQuery.error,
        resolveReport: resolveReportMutation.mutateAsync,
        deleteContent: deleteContentMutation.mutateAsync,
        toggleBan: toggleBanMutation.mutateAsync,
        isActioning: resolveReportMutation.isPending || deleteContentMutation.isPending || toggleBanMutation.isPending
    };
};
