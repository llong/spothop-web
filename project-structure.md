# Spothop Web - Project Structure

```text
spothop-web/
├── .clinerules/              # AI coding standards and guidelines
├── public/                   # Static assets (robots.txt, icons)
│   └── ffmpeg/               # FFmpeg WebAssembly files
├── sprints/                  # Sprint planning and milestones
├── src/                      # Main application source code
│   ├── assets/               # React assets and SVGs
│   ├── atoms/                # Jotai state management atoms
│   ├── components/           # Reusable React components
│   │   ├── EmptyState/
│   │   ├── SearchInput/
│   │   └── SEO/
│   ├── constants/            # Application constants and configuration
│   ├── hooks/                # Custom React hooks (Queries, Mutations, State)
│   ├── lib/                  # Third-party library configurations (e.g., PostHog)
│   ├── routes/               # File-based routing (TanStack Router)
│   │   ├── admin/            # Admin dashboard routes
│   │   ├── chat/             # Chat feature routes
│   │   ├── contests/         # Contest feature routes
│   │   ├── feed/             # Main feed routes
│   │   ├── profile/          # User profile routes
│   │   └── spots/            # Spot related routes
│   ├── services/             # API and business logic services
│   │   ├── admin/
│   │   ├── chat/
│   │   ├── profile/
│   │   └── spot/
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Helper functions and utilities
├── supabase/                 # Supabase backend configuration
│   ├── functions/            # Edge functions
│   ├── migrations/           # Database migrations
│   └── snippets/             # SQL snippets
├── DOCS/                     # Project documentation
├── TESTING/                  # Test cases and testing documentation
├── package.json              # Project dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── eslint.config.js          # ESLint configuration
```

## Key Architectural Highlights

- **Frontend Framework**: React with Vite
- **Routing**: TanStack Router (file-based routing in `src/routes/`)
- **State Management**: Jotai (`src/atoms/`)
- **Backend/BaaS**: Supabase (Database, Auth, Storage, Edge Functions)
- **Styling**: Material-UI (MUI) and standard CSS
- **Data Fetching**: Custom hooks abstracting API calls (`src/hooks/` and `src/services/`)
