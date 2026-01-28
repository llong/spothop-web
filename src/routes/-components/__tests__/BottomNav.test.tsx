import { BottomNav } from "../BottomNav";
import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createRouter, createMemoryHistory, createRootRoute, createRoute } from "@tanstack/react-router";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";

import { fireEvent } from "@testing-library/react";

const createTestRouter = () => {
    const rootRoute = createRootRoute({
        component: () => <BottomNav />,
    });

    const feedRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/feed',
        component: () => <div>Feed Page</div>,
    });

    const spotsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/spots',
        component: () => <div>Spots Page</div>,
    });

    const profileRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/profile',
        component: () => <div>Profile Page</div>,
    });

    const routeTree = rootRoute.addChildren([feedRoute, spotsRoute, profileRoute]);

    const history = createMemoryHistory({ initialEntries: ['/feed'] });

    const router = createRouter({
        routeTree,
        history,
    });

    return router;
};

describe("BottomNav", () => {
    it("renders navigation items", async () => {
        const router = createTestRouter();
        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText("Feed")).toBeInTheDocument();
            expect(screen.getByText("Spots")).toBeInTheDocument();
            expect(screen.getByText("Profile")).toBeInTheDocument();
        });
    });

    it("navigates to the correct route when clicked", async () => {
        const router = createTestRouter();
        render(<RouterProvider router={router} />);

        const profileLink = await screen.findByText("Profile");
        fireEvent.click(profileLink);

        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/profile");
        });

        const spotsLink = await screen.findByText("Spots");
        fireEvent.click(spotsLink);

        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/spots");
        });

        const feedLink = await screen.findByText("Feed");
        fireEvent.click(feedLink);

        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/feed");
        });
    });
});
