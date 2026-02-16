# Media Handling Guide

This document outlines the correct procedure for handling media uploads (photos and videos) for spots in the application.

## Storage Structure

All media related to a specific spot must be stored in a folder named after the `spotId` within the `spot-media` bucket. The structure is as follows:

```
spot-media/
├── {spotId}/
│   ├── photos/
│   │   ├── originals/
│   │   └── thumbnails/
│   └── videos/
       ├── originals/
       └── thumbnails/
```

## Upload Process

To ensure that the `spotId` is available for creating the folder structure, the following two-step process must be followed when creating a new spot with media:

1.  **Create the Spot First:** The spot must be created in the `spots` table *before* any media is uploaded. This will generate the `spotId` that is required for the next step.

2.  **Upload Media:** Once the `spotId` has been obtained, the media can be uploaded to the correct path within the `spot-media` bucket.

3.  **Update the Spot:** After the media has been successfully uploaded, the `spots` table must be updated with the public URL of the uploaded media.

This two-step process ensures that all media is correctly associated with its corresponding spot and that the storage bucket remains organized.
