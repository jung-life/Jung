module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest-setup.js'],
  // Ensure necessary node_modules are transformed by Babel
  transformIgnorePatterns: [
    "node_modules/(?!(@react-native|react-native|expo-|@expo|@unimodules|react-navigation|@react-navigation|native-base|react-native-svg)/).*"
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    // Add explicit mock for the error-guard.js file causing issues
    '@react-native/js-polyfills/error-guard': '<rootDir>/__mocks__/@react-native/js-polyfills/error-guard.js'
  }
};
