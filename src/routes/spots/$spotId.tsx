import { createFileRoute } from '@tanstack/react-router';
import supabase from 'src/supabase';
import { spotKeys } from 'src/hooks/useSpotQueries';
import { spotService } from 'src/services/spotService';

const loader = async ({ params, context }: { params: { spotId: string }, context: any }) => {
    const { queryClient } = context;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    // Prefetch Spot Details via QueryClient
    await queryClient.ensureQueryData({
        queryKey: spotKeys.details(params.spotId),
        queryFn: () => spotService.fetchSpotDetails(params.spotId, userId),
    });

    return { spotId: params.spotId };
};

export const Route = createFileRoute('/spots/$spotId')({
    loader,
})
