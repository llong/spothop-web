# Manual Test Cases

This checklist covers scenarios that are difficult to automate reliably, such as visual polish, PWA behavior, and cross-device interactions.

| ID | Feature | Action | Expected Result | Status |
|----|---------|--------|-----------------|--------|
| **MT-001** | Auth | Sign up with a new email | Receives verification email; Clicking link leads to `/welcome` | |
| **MT-002** | Onboarding | Land on `/welcome` without a Display Name | Cannot navigate away until Display Name is set | |
| **MT-003** | Map | Long-press on a map location (Mobile) | "Add Spot Here" popup appears at the correct coordinate | |
| **MT-004** | Contribution | Upload a large 4K image | Image is resized in-browser before upload; payload is small | |
| **MT-005** | PWA | Install app to Home Screen (Mobile) | App opens in standalone mode without browser UI | |
| **MT-006** | Offline | Disable network while on Home Page | "Offline" chip appears; Map disappears; List remains usable | |
| **MT-007** | UX | Resize window from Desktop to Mobile | Layout smoothly transitions; BottomNav replaces Sidebar/AppBar items | |
| **MT-008** | Spot Details | Scroll through SpotGallery | Images load smoothly using the specific WebP optimized versions | |
| **MT-009** | Chat | Send a message while recipient is offline | Notification is delivered to recipient once they reconnect | |
| **MT-010** | Safety | Flag a spot for "Inaccurate Location" | Flag count increases; Snackbar confirms report success | |
| **MT-011** | Maps | Click "Get Directions" on a spot | Triggers system-level prompt to open Apple/Google Maps | |
| **MT-012** | Filtering | Apply "Advanced" difficulty filter | List and Map update instantly to show only advanced spots | |
| **MT-013** | Performance | Refresh Home page on slow 3G | MUI Skeletons appear immediately before content loads | |
