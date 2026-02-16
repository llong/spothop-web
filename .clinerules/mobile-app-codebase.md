Project Path: getprops-mobile

Source Tree:

```txt
getprops-mobile
├── App.tsx
├── MIGRATION_INSTRUCTIONS.md
├── android
│   ├── app
│   │   ├── build.gradle
│   │   ├── debug.keystore
│   │   ├── proguard-rules.pro
│   │   └── src
│   │       ├── debug
│   │       │   ├── AndroidManifest.xml
│   │       │   └── res
│   │       │       ├── mipmap-hdpi
│   │       │       │   ├── ic_launcher.png
│   │       │       │   └── ic_launcher_round.png
│   │       │       └── values
│   │       │           └── strings.xml
│   │       └── main
│   │           ├── AndroidManifest.xml
│   │           ├── java
│   │           │   └── dev
│   │           │       └── getprops
│   │           │           └── app
│   │           │               ├── MainActivity.kt
│   │           │               └── MainApplication.kt
│   │           └── res
│   │               ├── drawable
│   │               │   ├── ic_launcher_background.xml
│   │               │   └── rn_edit_text_material.xml
│   │               ├── drawable-hdpi
│   │               │   └── splashscreen_logo.png
│   │               ├── drawable-mdpi
│   │               │   └── splashscreen_logo.png
│   │               ├── drawable-xhdpi
│   │               │   └── splashscreen_logo.png
│   │               ├── drawable-xxhdpi
│   │               │   └── splashscreen_logo.png
│   │               ├── drawable-xxxhdpi
│   │               │   └── splashscreen_logo.png
│   │               ├── mipmap-anydpi-v26
│   │               │   ├── ic_launcher.xml
│   │               │   └── ic_launcher_round.xml
│   │               ├── mipmap-hdpi
│   │               │   ├── ic_launcher.webp
│   │               │   ├── ic_launcher_foreground.webp
│   │               │   └── ic_launcher_round.webp
│   │               ├── mipmap-mdpi
│   │               │   ├── ic_launcher.webp
│   │               │   ├── ic_launcher_foreground.webp
│   │               │   └── ic_launcher_round.webp
│   │               ├── mipmap-xhdpi
│   │               │   ├── ic_launcher.webp
│   │               │   ├── ic_launcher_foreground.webp
│   │               │   └── ic_launcher_round.webp
│   │               ├── mipmap-xxhdpi
│   │               │   ├── ic_launcher.webp
│   │               │   ├── ic_launcher_foreground.webp
│   │               │   └── ic_launcher_round.webp
│   │               ├── mipmap-xxxhdpi
│   │               │   ├── ic_launcher.webp
│   │               │   ├── ic_launcher_foreground.webp
│   │               │   └── ic_launcher_round.webp
│   │               ├── values
│   │               │   ├── colors.xml
│   │               │   ├── strings.xml
│   │               │   └── styles.xml
│   │               └── values-night
│   │                   └── colors.xml
│   ├── build.gradle
│   ├── gradle
│   │   └── wrapper
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   └── settings.gradle
├── app.json
├── assets
│   ├── _adaptive-icon.png
│   ├── _splash-icon.png
│   ├── favicon.png
│   ├── images
│   │   ├── adaptive-icon.png
│   │   ├── icon.png
│   │   ├── logo.png
│   │   └── splash.png
│   └── splash.png
├── babel.config.js
├── docs
│   ├── README.md
│   ├── architecture
│   │   └── decisions
│   │       └── 001-media-optimization.md
│   ├── features
│   │   └── media
│   │       └── README.md
│   └── project
│       └── status.md
├── eas.json
├── index.js
├── ios
│   ├── AirGoogleMaps
│   │   ├── AIRDummyView.h
│   │   ├── AIRDummyView.m
│   │   ├── AIRGMSMarker.h
│   │   ├── AIRGMSMarker.m
│   │   ├── AIRGMSPolygon.h
│   │   ├── AIRGMSPolygon.m
│   │   ├── AIRGMSPolyline.h
│   │   ├── AIRGMSPolyline.m
│   │   ├── AIRGoogleMap.h
│   │   ├── AIRGoogleMap.m
│   │   ├── AIRGoogleMapCallout.h
│   │   ├── AIRGoogleMapCallout.m
│   │   ├── AIRGoogleMapCalloutManager.h
│   │   ├── AIRGoogleMapCalloutManager.m
│   │   ├── AIRGoogleMapCalloutSubview.h
│   │   ├── AIRGoogleMapCalloutSubview.m
│   │   ├── AIRGoogleMapCalloutSubviewManager.h
│   │   ├── AIRGoogleMapCalloutSubviewManager.m
│   │   ├── AIRGoogleMapCircle.h
│   │   ├── AIRGoogleMapCircle.m
│   │   ├── AIRGoogleMapCircleManager.h
│   │   ├── AIRGoogleMapCircleManager.m
│   │   ├── AIRGoogleMapHeatmap.h
│   │   ├── AIRGoogleMapHeatmap.m
│   │   ├── AIRGoogleMapHeatmapManager.h
│   │   ├── AIRGoogleMapHeatmapManager.m
│   │   ├── AIRGoogleMapManager.h
│   │   ├── AIRGoogleMapManager.m
│   │   ├── AIRGoogleMapMarker.h
│   │   ├── AIRGoogleMapMarker.m
│   │   ├── AIRGoogleMapMarkerManager.h
│   │   ├── AIRGoogleMapMarkerManager.m
│   │   ├── AIRGoogleMapOverlay.h
│   │   ├── AIRGoogleMapOverlay.m
│   │   ├── AIRGoogleMapOverlayManager.h
│   │   ├── AIRGoogleMapOverlayManager.m
│   │   ├── AIRGoogleMapPolygon.h
│   │   ├── AIRGoogleMapPolygon.m
│   │   ├── AIRGoogleMapPolygonManager.h
│   │   ├── AIRGoogleMapPolygonManager.m
│   │   ├── AIRGoogleMapPolyline.h
│   │   ├── AIRGoogleMapPolyline.m
│   │   ├── AIRGoogleMapPolylineManager.h
│   │   ├── AIRGoogleMapPolylineManager.m
│   │   ├── AIRGoogleMapURLTileManager.m
│   │   ├── AIRGoogleMapUrlTile.h
│   │   ├── AIRGoogleMapUrlTile.m
│   │   ├── AIRGoogleMapUrlTileManager.h
│   │   ├── AIRGoogleMapWMSTile.h
│   │   ├── AIRGoogleMapWMSTile.m
│   │   ├── AIRGoogleMapWMSTileManager.h
│   │   ├── AIRGoogleMapWMSTileManager.m
│   │   ├── RCTConvert+GMSMapViewType.h
│   │   ├── RCTConvert+GMSMapViewType.m
│   │   └── Resources
│   │       └── GoogleMapsPrivacy.bundle
│   │           └── PrivacyInfo.xcprivacy
│   ├── AirMaps
│   │   ├── AIRMap.h
│   │   ├── AIRMap.m
│   │   ├── AIRMapCallout.h
│   │   ├── AIRMapCallout.m
│   │   ├── AIRMapCalloutManager.h
│   │   ├── AIRMapCalloutManager.m
│   │   ├── AIRMapCalloutSubview.h
│   │   ├── AIRMapCalloutSubview.m
│   │   ├── AIRMapCalloutSubviewManager.h
│   │   ├── AIRMapCalloutSubviewManager.m
│   │   ├── AIRMapCircle.h
│   │   ├── AIRMapCircle.m
│   │   ├── AIRMapCircleManager.h
│   │   ├── AIRMapCircleManager.m
│   │   ├── AIRMapCoordinate.h
│   │   ├── AIRMapCoordinate.m
│   │   ├── AIRMapLocalTile.h
│   │   ├── AIRMapLocalTile.m
│   │   ├── AIRMapLocalTileManager.h
│   │   ├── AIRMapLocalTileManager.m
│   │   ├── AIRMapLocalTileOverlay.h
│   │   ├── AIRMapLocalTileOverlay.m
│   │   ├── AIRMapManager.h
│   │   ├── AIRMapManager.m
│   │   ├── AIRMapMarker.h
│   │   ├── AIRMapMarker.m
│   │   ├── AIRMapMarkerManager.h
│   │   ├── AIRMapMarkerManager.m
│   │   ├── AIRMapOverlay.h
│   │   ├── AIRMapOverlay.m
│   │   ├── AIRMapOverlayManager.h
│   │   ├── AIRMapOverlayManager.m
│   │   ├── AIRMapOverlayRenderer.h
│   │   ├── AIRMapOverlayRenderer.m
│   │   ├── AIRMapPolygon.h
│   │   ├── AIRMapPolygon.m
│   │   ├── AIRMapPolygonManager.h
│   │   ├── AIRMapPolygonManager.m
│   │   ├── AIRMapPolyline.h
│   │   ├── AIRMapPolyline.m
│   │   ├── AIRMapPolylineManager.h
│   │   ├── AIRMapPolylineManager.m
│   │   ├── AIRMapPolylineRenderer.h
│   │   ├── AIRMapPolylineRenderer.m
│   │   ├── AIRMapSnapshot.h
│   │   ├── AIRMapUrlTile.h
│   │   ├── AIRMapUrlTile.m
│   │   ├── AIRMapUrlTileCachedOverlay.h
│   │   ├── AIRMapUrlTileCachedOverlay.m
│   │   ├── AIRMapUrlTileManager.h
│   │   ├── AIRMapUrlTileManager.m
│   │   ├── AIRMapWMSTile.h
│   │   ├── AIRMapWMSTile.m
│   │   ├── AIRMapWMSTileManager.h
│   │   ├── AIRMapWMSTileManager.m
│   │   ├── AIRWeakMapReference.h
│   │   ├── AIRWeakMapReference.m
│   │   ├── AIRWeakTimerReference.h
│   │   ├── AIRWeakTimerReference.m
│   │   ├── Callout
│   │   │   ├── SMCalloutView.h
│   │   │   └── SMCalloutView.m
│   │   ├── RCTComponentData+Maps.h
│   │   ├── RCTComponentData+Maps.m
│   │   ├── RCTConvert+AirMap.h
│   │   └── RCTConvert+AirMap.m
│   ├── GetProps
│   │   ├── AppDelegate.h
│   │   ├── AppDelegate.mm
│   │   ├── GetProps-Bridging-Header.h
│   │   ├── GetProps.entitlements
│   │   ├── Images.xcassets
│   │   │   ├── AppIcon.appiconset
│   │   │   │   ├── App-Icon-1024x1024@1x.png
│   │   │   │   ├── App-Icon-20x20@1x.png
│   │   │   │   ├── App-Icon-20x20@2x.png
│   │   │   │   ├── App-Icon-20x20@3x.png
│   │   │   │   ├── App-Icon-29x29@1x.png
│   │   │   │   ├── App-Icon-29x29@2x.png
│   │   │   │   ├── App-Icon-29x29@3x.png
│   │   │   │   ├── App-Icon-40x40@1x.png
│   │   │   │   ├── App-Icon-40x40@2x.png
│   │   │   │   ├── App-Icon-40x40@3x.png
│   │   │   │   ├── App-Icon-60x60@2x.png
│   │   │   │   ├── App-Icon-60x60@3x.png
│   │   │   │   ├── App-Icon-76x76@1x.png
│   │   │   │   ├── App-Icon-76x76@2x.png
│   │   │   │   ├── App-Icon-83.5x83.5@2x.png
│   │   │   │   ├── Contents.json
│   │   │   │   └── ItunesArtwork@2x.png
│   │   │   ├── Contents.json
│   │   │   ├── SplashScreenBackground.colorset
│   │   │   │   └── Contents.json
│   │   │   └── SplashScreenLogo.imageset
│   │   │       ├── Contents.json
│   │   │       ├── image.png
│   │   │       ├── image@2x.png
│   │   │       └── image@3x.png
│   │   ├── Info.plist
│   │   ├── PrivacyInfo.xcprivacy
│   │   ├── SplashScreen.storyboard
│   │   ├── Supporting
│   │   │   └── Expo.plist
│   │   ├── main.m
│   │   └── noop-file.swift
│   ├── GetProps.xcodeproj
│   │   ├── project.pbxproj
│   │   └── xcshareddata
│   │       └── xcschemes
│   │           └── GetProps.xcscheme
│   ├── GetProps.xcworkspace
│   │   └── contents.xcworkspacedata
│   ├── Podfile
│   ├── Podfile.lock
│   └── Podfile.properties.json
├── metro.config.js
├── package.json
├── sprints
│   └── sprint1.md
├── src
│   ├── App.tsx
│   ├── assets
│   │   ├── _adaptive-icon.png
│   │   ├── _splash-icon.png
│   │   ├── favicon.png
│   │   ├── images
│   │   │   ├── adaptive-icon.png
│   │   │   ├── icon.png
│   │   │   ├── logo.png
│   │   │   └── splash.png
│   │   └── splash.png
│   ├── components
│   │   ├── AnimatedSwitcher.tsx
│   │   ├── CropPhotoModal.tsx
│   │   ├── InfoToast
│   │   │   └── InfoToast.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── LoadingSpinner
│   │   │   └── LoadingSpinner.tsx
│   │   ├── Providers
│   │   │   └── ToastProvider.tsx
│   │   ├── SearchInput
│   │   │   ├── SearchInput.tsx
│   │   │   └── types.ts
│   │   ├── SelectedSpotCarousel
│   │   │   └── SelectedSpotCarousel.tsx
│   │   ├── SelectedSpotOverlay
│   │   │   ├── SelectedSpotOverlay.tsx
│   │   │   └── SelectedSpotOverlayStyles.ts
│   │   ├── SpotDetails
│   │   │   ├── MediaCarousel.tsx
│   │   │   ├── SpotActions.tsx
│   │   │   ├── SpotAttributes.tsx
│   │   │   ├── SpotCreatorInfo.tsx
│   │   │   ├── SpotHeader.tsx
│   │   │   ├── SpotNotFound.tsx
│   │   │   └── index.ts
│   │   ├── Spots
│   │   │   ├── SpotList.tsx
│   │   │   └── SpotMap.tsx
│   │   └── StarRating
│   │       └── StarRating.tsx
│   ├── hooks
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   ├── useMapInteractions.ts
│   │   ├── useProfile.ts
│   │   ├── useSearch.ts
│   │   ├── useSpotData.ts
│   │   ├── useSpotImages.ts
│   │   ├── useSpotPhotos.ts
│   │   ├── useSpotSearch.ts
│   │   ├── useSpotVideos.ts
│   │   └── useSpots.ts
│   ├── navigation
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   ├── ProfileNavigator.tsx
│   │   ├── RootNavigator.tsx
│   │   ├── SpotsNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── index.tsx
│   ├── screens
│   │   ├── Auth
│   │   │   ├── AuthScreen.tsx
│   │   │   └── SignUpScreen.tsx
│   │   ├── Profile
│   │   │   ├── EditProfileScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── UserProfileScreen.tsx
│   │   │   └── components
│   │   │       ├── CountryPicker.tsx
│   │   │       ├── ImageCropperModal.tsx
│   │   │       ├── ProfileInfo.tsx
│   │   │       └── ProfileStats.tsx
│   │   └── Spots
│   │       ├── AddSpot
│   │       │   ├── AddSpotScreen.tsx
│   │       │   ├── components
│   │       │   │   ├── DifficultySection.tsx
│   │       │   │   ├── KickoutRiskSection.tsx
│   │       │   │   ├── LitToggleSection.tsx
│   │       │   │   ├── LocationSection.tsx
│   │       │   │   ├── PhotoSelector.tsx
│   │       │   │   ├── SpotTypeSection.tsx
│   │       │   │   └── VideoSelector
│   │       │   │       ├── components
│   │       │   │       │   ├── ThumbnailSlider.tsx
│   │       │   │       │   ├── VideoControls.tsx
│   │       │   │       │   └── VideoItem.tsx
│   │       │   │       ├── hooks
│   │       │   │       │   └── useVideoRefs.ts
│   │       │   │       ├── index.tsx
│   │       │   │       ├── styles.ts
│   │       │   │       └── types.ts
│   │       │   ├── hooks
│   │       │   │   ├── useSpotForm.ts
│   │       │   │   ├── useVideoList.ts
│   │       │   │   └── useVideoProcessing.ts
│   │       │   ├── types
│   │       │   │   └── video.ts
│   │       │   ├── types.ts
│   │       │   └── utils
│   │       │       └── videoHandlers.ts
│   │       ├── EditSpot
│   │       │   └── EditSpotScreen.tsx
│   │       ├── Search
│   │       │   ├── SearchScreen.tsx
│   │       │   └── components
│   │       │       └── SpotListItem.tsx
│   │       ├── SpotDetailsScreen.tsx
│   │       ├── SpotMediaScreen.tsx
│   │       ├── SpotsScreen.tsx
│   │       ├── SpotsScreenStyles.ts
│   │       └── components
│   │           ├── AddSpotOverlay.tsx
│   │           ├── SpotListItem.tsx
│   │           ├── SpotListItemStyles.ts
│   │           └── SpotViewToggle.tsx
│   ├── state
│   │   ├── auth.ts
│   │   ├── location.ts
│   │   └── spots.ts
│   ├── theme
│   │   ├── index.ts
│   │   └── theme.ts
│   ├── types
│   │   ├── database.ts
│   │   ├── env.d.ts
│   │   ├── expo-image-crop.d.ts
│   │   ├── location.ts
│   │   ├── media.ts
│   │   ├── navigation.ts
│   │   ├── postgis.ts
│   │   ├── profile.ts
│   │   ├── react-native-snap-carousel.d.ts
│   │   ├── react-native-video-compressor.d.ts
│   │   ├── react-native-video-editor.d.ts
│   │   ├── react-native-video-processing.d.ts
│   │   ├── react-native-video-trim.d.ts
│   │   ├── spot.ts
│   │   ├── supabase.ts
│   │   ├── ui.ts
│   │   ├── useTheme.d.ts
│   │   └── video.ts
│   └── utils
│       ├── cache.ts
│       ├── geocoding.ts
│       ├── helpers.ts
│       ├── linking.ts
│       ├── permissions.ts
│       ├── strings.ts
│       ├── supabase.ts
│       ├── transforms.ts
│       └── videoProcessing.ts
├── supabase
│   ├── schema.sql
│   └── spots_rows.sql
├── test-db-columns.ts
├── tsconfig.json
├── web
│   └── cors-config.js
├── webpack.config.js
└── yarn.lock