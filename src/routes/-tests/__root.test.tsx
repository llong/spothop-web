import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RootComponent, Route } from "../__root";
import { createRouter, RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import "@testing-library/jest-dom";
import { Provider, createStore } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { userAtom } from "src/atoms/auth";

// Mock dependencies
vi.mock("src/hooks/useDevTools", () => ({
  useDevtools: vi.fn(),
}));

vi.mock("src/hooks/useProfileQueries", () => ({
  useProfileQuery: vi.fn(() => ({ data: null, isLoading: false })),
}));

let authStateChangeCallback: any;
const unsubscribeMock = vi.fn();

vi.mock("src/supabase", () => ({
  default: {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        authStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: unsubscribeMock } },
        };
      }),
    },
  },
}));

// Mock using full path to ensure it hits
vi.mock("src/routes/-components/SearchAppBar", () => ({
  default: () => <div data-testid="search-app-bar">SearchAppBar</div>,
}));

vi.mock("src/routes/-components/BottomNav", () => ({
  BottomNav: () => <div data-testid="bottom-nav">BottomNav</div>,
}));

// Mock MUI useMediaQuery
import * as MuiMaterial from "@mui/material";
vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal<typeof MuiMaterial>();
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

import { useMediaQuery } from "@mui/material";

const theme = createTheme();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const createTestRouter = () => {
  const history = createMemoryHistory();
  return createRouter({
    routeTree: Route,
    history,
  });
};

describe("Root Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangeCallback = null;
  });

  it("renders SearchAppBar and Outlet content", async () => {
    // Default to desktop
    (useMediaQuery as any).mockReturnValue(false);

    const router = createTestRouter();
    render(
      <QueryClientProvider client={queryClient}>
        <Provider>
          <ThemeProvider theme={theme}>
            <RouterProvider router={router} />
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    );

    expect(await screen.findByTestId("search-app-bar")).toBeInTheDocument();
  });

  it("renders BottomNav on mobile devices", async () => {
    // Simulate mobile
    (useMediaQuery as any).mockReturnValue(true);

    const router = createTestRouter();
    render(
      <QueryClientProvider client={queryClient}>
        <Provider>
          <ThemeProvider theme={theme}>
            <RouterProvider router={router} />
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    );

    expect(await screen.findByTestId("bottom-nav")).toBeInTheDocument();
  });

  it("does not render BottomNav on desktop devices", async () => {
    // Simulate desktop
    (useMediaQuery as any).mockReturnValue(false);

    const router = createTestRouter();
    render(
      <QueryClientProvider client={queryClient}>
        <Provider>
          <ThemeProvider theme={theme}>
            <RouterProvider router={router} />
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    );

    // Ensure SearchAppBar is present to confirm render happened
    await screen.findByTestId("search-app-bar");

    expect(screen.queryByTestId("bottom-nav")).not.toBeInTheDocument();
  });

  it("updates user atom on auth state change (login)", async () => {
    (useMediaQuery as any).mockReturnValue(false);
    const store = createStore();
    const router = createTestRouter();

    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <RouterProvider router={router} />
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    );

    // Wait for component to mount and effect to run
    await screen.findByTestId("search-app-bar");

    const mockSession = { user: { id: "123" }, access_token: "test-token" };

    expect(authStateChangeCallback).toBeDefined();

    act(() => {
      authStateChangeCallback("SIGNED_IN", mockSession);
    });

    const userState = store.get(userAtom);
    expect(userState).toEqual({
      user: mockSession.user,
      session: mockSession,
    });
  });

  it("updates user atom on auth state change (logout)", async () => {
    (useMediaQuery as any).mockReturnValue(false);
    const store = createStore();
    // Set initial user
    store.set(userAtom, { user: { id: "123" } as any, session: { access_token: 'old-token' } as any });

    const router = createTestRouter();

    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <RouterProvider router={router} />
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    );

    await screen.findByTestId("search-app-bar");

    expect(authStateChangeCallback).toBeDefined();

    act(() => {
      authStateChangeCallback("SIGNED_OUT", null);
    });

    const userState = store.get(userAtom);
    expect(userState).toBeNull();
  });

  it("unsubscribes from auth listener on unmount", async () => {
    (useMediaQuery as any).mockReturnValue(false);
    const router = createTestRouter();
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <Provider>
          <ThemeProvider theme={theme}>
            <RouterProvider router={router} />
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    );

    await screen.findByTestId("search-app-bar");
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it("exports Route correctly", () => {
    expect(Route).toBeDefined();
    expect(Route.options.component).toBe(RootComponent);
  });
});
