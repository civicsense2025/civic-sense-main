#!/bin/bash

# Enable module resolution debugging
export DEBUG_MODULE_RESOLUTION=true

# Clear Metro cache
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-map-* 2>/dev/null

# Start Expo with debugging
EXPO_DEBUG=true npx expo start --clear 