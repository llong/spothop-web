# Features and User Flows

## Core Features

### 1. Authentication & Onboarding
- **User Registration**: Create an account via email/password.
- **Login/Logout**: Secure access using Supabase Auth.
- **Password Management**: Forgot password flow and in-app password updates.
- **Profile Initialization**: Forced onboarding flow (/welcome) for new users to set their display name.

### 2. Spot Management
- **Map Discovery**: Interactive Leaflet map with clustering for finding spots.
- **List View**: Categorized list of nearby spots with preview cards.
- **Spot Details**: Comprehensive view including gallery, characteristics (difficulty, risk, lighting), and metadata.
- **Contribution**: Add new spots by selecting location on map, uploading photos/videos, and providing details.
- **Filtering**: Search and filter spots by type, difficulty, lighting status, and kickout risk.

### 3. Community & Social
- **User Profiles**: Public profiles showing contributions and user stats.
- **Discussion**: Commenting system for individual spots.
- **Media Engagement**: Ability to like photos and videos.
- **Safety**: Reporting/Flagging system for inappropriate content or inaccurate spot info.
- **Notifications**: Real-time alerts for likes, comments, and messages.

### 4. Communication
- **Direct Messaging**: Private real-time chat between users.
- **Group Chat**: Discussion groups for local communities (Creation/Settings).

### 5. Utility & PWA
- **PWA Capabilities**: Installable web app with offline asset caching.
- **Offline Mode**: Access to previously loaded spots, favorites, and chat history without connection.
- **Navigation**: "Get Directions" bridge to native map applications.

---

## Primary User Flows

### Flow 1: New User Onboarding
1. User lands on `/signup`.
2. User enters credentials and receives verification email.
3. User clicks link and is redirected back to `/welcome`.
4. User sets their Display Name and completes onboarding.
5. User is redirected to the home `/` map view.

### Flow 2: Spot Contribution
1. Authenticated user navigates to the home page Map view.
2. User right-clicks (desktop) or long-presses (mobile) on a specific location.
3. User clicks "Add Spot Here" in the popup.
4. User uploads at least one photo (optimized automatically).
5. User fills in Name, Description, and Characteristics.
6. User submits and is redirected to the new Spot's detail page.

### Flow 3: Interaction & Engagement
1. User clicks a spot marker or card from the list.
2. User views the `SpotDetails` page.
3. User browses the `SpotGallery`.
4. User likes a photo or leaves a comment in the `CommentSection`.
5. The spot creator receives a notification.

### Flow 4: Offline Usage
1. User loses internet connectivity.
2. App detects status and shows "Offline" indicator.
3. Map interface is disabled/hidden.
4. User browses previously cached spots in the List view.
5. User accesses their persistent Chat history.

### Flow 5: Managing Favorites
1. User views a spot they like.
2. User clicks "Save Spot" in the sidebar.
3. User navigates to their `Profile`.
4. User views their collection of saved spots.
