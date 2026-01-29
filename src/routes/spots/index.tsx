import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const spotsSearchSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  spotId: z.string().optional(),
});

export const Route = createFileRoute('/spots/')({
  validateSearch: spotsSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/spots/"!</div>
}
