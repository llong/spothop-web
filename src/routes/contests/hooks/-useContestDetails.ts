import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contestService } from '@/services/contestService';
import { adminContestService } from '@/services/adminContestService';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/atoms/auth';
import { useProfileQuery } from '@/hooks/useProfileQueries';

export function useContestDetails(contestId: string) {
    const user = useAtomValue(userAtom);
    const { data: profile } = useProfileQuery(user?.user.id);
    const isAdmin = profile?.role === 'admin';
    const queryClient = useQueryClient();

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

    const isJudge = contest?.criteria?.judges?.includes((profile as any)?.id || '');

    return {
        user,
        profile,
        isAdmin,
        isJudge,
        contest,
        contestLoading,
        entries,
        entriesLoading,
        userVotes,
        retractEntry: retractMutation.mutate,
        voteForEntry: voteMutation.mutate,
        isVoting: voteMutation.isPending,
        disqualifyEntry: disqualifyMutation.mutate
    };
}
