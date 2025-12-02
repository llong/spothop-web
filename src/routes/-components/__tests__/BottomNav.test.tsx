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

    const indexRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/',
        component: () => <div>Home Page</div>,
    });

    const profileRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/profile',
        component: () => <div>Profile Page</div>,
    });

    const routeTree = rootRoute.addChildren([indexRoute, profileRoute]);

    const history = createMemoryHistory({ initialEntries: ['/'] });

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
            expect(router.state.location.pathname).toBe("/");
        });
    });
});
