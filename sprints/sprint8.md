# Sprint 8: Client-side Video Processing

## Overview
Implement client-side video processing using FFmpeg.wasm to enforce consistent quality and constraints for user-uploaded videos directly in the browser. This will reduce server load and storage costs while ensuring a better playback experience for all users.

## Goals
- Enforce 20-second maximum length for videos.
- Standardize resolution to 720p (1280x720).
- Encode all videos to H.264 (AVC) in an MP4 container.
- Provide an interactive trimming UI.

## Tasks

### 1. Setup & Infrastructure
- [x] 8.1.1 Install `@ffmpeg/ffmpeg` and `@ffmpeg/util`.
- [x] 8.1.2 Configure Vite to support `SharedArrayBuffer` (COOP/COEP headers).
- [x] 8.1.3 Create a Web Worker wrapper for FFmpeg operations to avoid blocking the main thread.

### 2. Trimming UI
- [ ] 8.2.1 Build an interactive `VideoTrimmer` component.
- [x] 8.2.2 Implement a timeline with draggable handles for selecting a segment.
- [x] 8.2.3 Ensure the trimmer enforces the 20-second maximum limit.
- [x] 8.2.4 Implement a live preview of the selected segment.

### 3. Transcoding Logic
- [x] 8.3.1 Implement the FFmpeg command generation for trimming and scaling.
- [x] 8.3.2 Configure H.264 encoding parameters.
- [x] 8.3.3 Implement progress tracking and feedback for the transcoding process.

### 4. Integration & Optimization
- [x] 8.4.1 Integrate `VideoTrimmer` into the spot media upload flow.
- [x] 8.4.2 Implement lazy-loading for the FFmpeg library.
- [ ] 8.4.3 Add error handling for unsupported browsers or low-memory situations.

## Success Criteria
- [ ] Users can trim a video to max 20 seconds before upload.
- [ ] All uploaded videos are 720p H.264 MP4.
- [ ] Transcoding progress is clearly visible to the user.
- [ ] App remains responsive during processing (handled in worker).
