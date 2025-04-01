// Mock implementation of error-guard.js
module.exports = {
  ErrorUtils: {
    setGlobalHandler: jest.fn(),
    getGlobalHandler: jest.fn(),
    reportError: jest.fn(),
    reportFatalError: jest.fn(),
  },
};
