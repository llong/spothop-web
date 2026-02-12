import posthog from 'posthog-js';

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      ui_host: 'https://us.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,
      persistence: 'localStorage+cookie',
      autocapture: true, // Let's enable autocapture temporarily to see if basic clicks get through
    });
  }
  return posthog;
};

export const analytics = posthog;
