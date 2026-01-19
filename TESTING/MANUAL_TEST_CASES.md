# Manual Test Cases

This checklist covers scenarios that are difficult to automate reliably, such as visual polish, PWA behavior, and cross-device interactions.

| ID | Feature | Action | Expected Result | Status |
|----|---------|--------|-----------------|--------|
| **MT-001** | Auth | Sign up with a new email | Receives verification email; Clicking link leads to `/welcome` | x |
| **MT-002** | Onboarding | Land on `/welcome` without a Display Name | Cannot navigate away until Display Name is set | x |
| **MT-003** | Map | Long-press on a map location (Mobile) | "Add Spot Here" popup appears at the correct coordinate | x |
| **MT-004** | Contribution | Upload a large 4K image | Image is resized in-browser before upload; payload is small | x |
| **MT-005** | PWA | Install app to Home Screen (Mobile) | App opens in standalone mode without browser UI | x |
| **MT-006** | Offline | Disable network while on Home Page | "Offline" chip appears; Map disappears; List remains usable | x |
| **MT-007** | UX | Resize window from Desktop to Mobile | Layout smoothly transitions; BottomNav replaces Sidebar/AppBar items | x |
| **MT-008** | Spot Details | Scroll through SpotGallery | Images load smoothly using the specific WebP optimized versions | |
| **MT-009** | Chat | Send a message while recipient is offline | Notification is delivered to recipient once they reconnect | x |
| **MT-010** | Safety | Flag a spot for "Inaccurate Location" | Flag count increases; Snackbar confirms report success | x |
| **MT-011** | Maps | Click "Get Directions" on a spot | Triggers system-level prompt to open Apple/Google Maps | x |
| **MT-012** | Filtering | Apply "Advanced" difficulty filter | List and Map update instantly to show only advanced spots | x |
| **MT-013** | Performance | Refresh Home page on slow 3G | MUI Skeletons appear immediately before content loads | x |

## Media Processing (Sprint 8)

### TC-MEDIA-001: Video Trimming and Optimization
**Goal:** Verify that large/long videos are correctly trimmed and transcoded before upload.
**Prerequisites:** Logged in user, a video file longer than 20 seconds.
**Steps:**
1. Navigate to "Add Spot" or "Edit Spot"
2. Click "Select Video" in the video upload section.
3. Select a video file (e.g., 45 seconds long).
4. **Expected Result:** The `VideoTrimmer` dialog should automatically appear.
5. Use the range slider to select a segment (e.g., from 0:10 to 0:25).
6. Click the Play button to preview the selected segment.
7. Click "Trim & Save".
8. **Expected Result:** A loading indicator should show processing progress (0-100%).
9. Once finished, the dialog closes and the video appears in the upload list with a generated thumbnail.
10. Click "Submit" to save the spot.
11. **Verification:** Verify the uploaded video plays correctly in the Spot Gallery and is approximately 720p resolution.

### TC-MEDIA-002: SharedArrayBuffer / Headers Check
**Goal:** Ensure the security headers are correctly configured for FFmpeg.wasm.
**Steps:**
1. Open the application in Chrome/Edge.
2. Open DevTools (F12) -> Console.
3. Type `self.crossOriginIsolated` and press Enter.
4. **Expected Result:** Returns `true`. If `false`, FFmpeg.wasm will not work.
