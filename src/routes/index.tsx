import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

const indexSearchSchema = z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
});

export const Route = createFileRoute('/')({
    validateSearch: (search) => indexSearchSchema.parse(search),
    beforeLoad: () => {
        throw redirect({ to: '/feed' });
    },
});
