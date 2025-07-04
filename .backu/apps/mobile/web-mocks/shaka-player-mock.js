/**
 * Mock shaka-player module for web bundling
 * This prevents bundling errors when react-native-track-player
 * tries to import shaka-player for web support
 */

// Mock UI class
class MockShakaUI {
  constructor() {
    console.warn('Using mock Shaka Player UI - web audio streaming not available');
  }
  
  getConfiguration() {
    return {};
  }
  
  configure() {
    // No-op
  }
  
  getControls() {
    return {
      setEnabled: () => {},
      getConfiguration: () => ({}),
      configure: () => {}
    };
  }
  
  destroy() {
    return Promise.resolve();
  }
}

// Mock Overlay class
class MockOverlay {
  constructor() {
    console.warn('Using mock Shaka Player Overlay - web controls not available');
  }
  
  destroy() {
    return Promise.resolve();
  }
}

// Export the mock UI module
module.exports = {
  Overlay: MockOverlay,
  default: {
    Overlay: MockOverlay
  }
};

// Also support ES6 imports
module.exports.Overlay = MockOverlay; 